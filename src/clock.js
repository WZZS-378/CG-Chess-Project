// clock.js — Chess clock for local (human vs human) games only.
// Displays two clocks top-center, colored to match the current piece colors.
// Flow: showModeSelection (local) → showTimeControlSelection → initClock → startGame → startClock

(function () {
  // ── State ──────────────────────────────────────────────────
  var whiteTimeMs = 0;
  var blackTimeMs = 0;
  var incrementMs = 0;
  var activeSide = "white";
  var tickInterval = null;
  var lastTick = null;
  var clockRunning = false;
  window.clockEnabled = false;

  // DOM refs
  var clockContainer = null;
  var whiteClockEl = null;
  var blackClockEl = null;
  var whiteNameEl = null;
  var blackNameEl = null;
  var whiteFaceEl = null;
  var blackFaceEl = null;

  // ── Helpers ────────────────────────────────────────────────
  function msToDisplay(ms) {
    if (ms < 0) ms = 0;
    var totalSec = Math.ceil(ms / 1000);
    var mins = Math.floor(totalSec / 60);
    var secs = totalSec % 60;
    return (mins < 10 ? "0" : "") + mins + ":" + (secs < 10 ? "0" : "") + secs;
  }

  function hexToCSS(hex) {
    var r = (hex >> 16) & 255;
    var g = (hex >> 8) & 255;
    var b = hex & 255;
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  function luminance(hex) {
    var r = ((hex >> 16) & 255) / 255;
    var g = ((hex >> 8) & 255) / 255;
    var b = (hex & 255) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  function textColorFor(bgHex) {
    return luminance(bgHex) > 0.45 ? "#111111" : "#ffffff";
  }

  // ── Build UI ───────────────────────────────────────────────
  function buildClockUI() {
    if (clockContainer) return;

    clockContainer = document.createElement("div");
    clockContainer.id = "chess-clock";
    clockContainer.style.position = "absolute";
    clockContainer.style.top = "20px";
    clockContainer.style.left = "50%";
    clockContainer.style.transform = "translateX(-50%)";
    clockContainer.style.display = "flex";
    clockContainer.style.gap = "16px";
    clockContainer.style.zIndex = "500";
    clockContainer.style.pointerEvents = "none";

    function makeFace(side) {
      var wrap = document.createElement("div");
      wrap.style.display = "flex";
      wrap.style.flexDirection = "column";
      wrap.style.alignItems = "center";
      wrap.style.padding = "10px 28px 12px";
      wrap.style.borderRadius = "12px";
      wrap.style.minWidth = "130px";
      wrap.style.boxShadow = "0 4px 16px rgba(0,0,0,0.45)";
      wrap.style.transition = "opacity 0.2s, box-shadow 0.2s";

      var nameEl = document.createElement("div");
      nameEl.textContent = side === "white" ? "White" : "Black";
      nameEl.style.fontSize = "11px";
      nameEl.style.fontFamily = "sans-serif";
      nameEl.style.fontWeight = "bold";
      nameEl.style.letterSpacing = "1.5px";
      nameEl.style.textTransform = "uppercase";
      nameEl.style.opacity = "0.7";
      nameEl.style.marginBottom = "4px";

      var timeEl = document.createElement("div");
      timeEl.style.fontSize = "30px";
      timeEl.style.fontFamily = "'Courier New', monospace";
      timeEl.style.fontWeight = "bold";
      timeEl.style.letterSpacing = "3px";

      wrap.appendChild(nameEl);
      wrap.appendChild(timeEl);
      return { wrap: wrap, nameEl: nameEl, timeEl: timeEl };
    }

    var wFace = makeFace("white");
    var bFace = makeFace("black");

    whiteFaceEl = wFace.wrap;
    blackFaceEl = bFace.wrap;
    whiteClockEl = wFace.timeEl;
    blackClockEl = bFace.timeEl;
    whiteNameEl = wFace.nameEl;
    blackNameEl = bFace.nameEl;

    clockContainer.appendChild(wFace.wrap);
    clockContainer.appendChild(bFace.wrap);
    document.body.appendChild(clockContainer);

    applyColors();
  }

  function applyColors() {
    if (!clockContainer) return;
    var wHex =
      typeof currentWhitePieceColor !== "undefined"
        ? currentWhitePieceColor
        : 0xfaf0dc;
    var bHex =
      typeof currentBlackPieceColor !== "undefined"
        ? currentBlackPieceColor
        : 0x222222;

    whiteFaceEl.style.background = hexToCSS(wHex);
    var wText = textColorFor(wHex);
    whiteClockEl.style.color = wText;
    whiteNameEl.style.color = wText;

    blackFaceEl.style.background = hexToCSS(bHex);
    var bText = textColorFor(bHex);
    blackClockEl.style.color = bText;
    blackNameEl.style.color = bText;
  }

  function updateDisplay() {
    if (!whiteClockEl || !blackClockEl) return;
    whiteClockEl.textContent = msToDisplay(whiteTimeMs);
    blackClockEl.textContent = msToDisplay(blackTimeMs);

    if (!whiteFaceEl || !blackFaceEl) return;

    // Active clock bright + ring; inactive dimmed
    if (clockRunning && activeSide === "white") {
      whiteFaceEl.style.opacity = "1";
      whiteFaceEl.style.boxShadow =
        "0 0 0 3px rgba(255,255,255,0.7), 0 4px 16px rgba(0,0,0,0.45)";
      blackFaceEl.style.opacity = "0.5";
      blackFaceEl.style.boxShadow = "0 4px 16px rgba(0,0,0,0.45)";
    } else if (clockRunning && activeSide === "black") {
      blackFaceEl.style.opacity = "1";
      blackFaceEl.style.boxShadow =
        "0 0 0 3px rgba(255,255,255,0.7), 0 4px 16px rgba(0,0,0,0.45)";
      whiteFaceEl.style.opacity = "0.5";
      whiteFaceEl.style.boxShadow = "0 4px 16px rgba(0,0,0,0.45)";
    } else {
      whiteFaceEl.style.opacity = "1";
      blackFaceEl.style.opacity = "1";
      whiteFaceEl.style.boxShadow = "0 4px 16px rgba(0,0,0,0.45)";
      blackFaceEl.style.boxShadow = "0 4px 16px rgba(0,0,0,0.45)";
    }

    // Low-time warning: flash red outline under 10 s
    var activeMs = activeSide === "white" ? whiteTimeMs : blackTimeMs;
    var activeFace = activeSide === "white" ? whiteFaceEl : blackFaceEl;
    var otherFace = activeSide === "white" ? blackFaceEl : whiteFaceEl;
    if (clockRunning && activeMs < 10000) {
      var flash = Math.floor(Date.now() / 500) % 2 === 0;
      activeFace.style.outline = flash ? "3px solid #ff3333" : "none";
    } else {
      activeFace.style.outline = "none";
      otherFace.style.outline = "none";
    }
  }

  function onFlag(side) {
    stopClock();
    var winner = side === "white" ? "Black" : "White";
    if (typeof showEndScreen === "function") {
      showEndScreen(winner + " wins on time!");
    }
    if (typeof renderer !== "undefined") {
      renderer.domElement.removeEventListener("click", onBoardClick);
    }
  }

  // ── Tick ───────────────────────────────────────────────────
  function tick() {
    if (!clockRunning) return;
    var now = Date.now();
    var elapsed = now - lastTick;
    lastTick = now;

    if (activeSide === "white") {
      whiteTimeMs -= elapsed;
      if (whiteTimeMs <= 0) {
        whiteTimeMs = 0;
        updateDisplay();
        onFlag("white");
        return;
      }
    } else {
      blackTimeMs -= elapsed;
      if (blackTimeMs <= 0) {
        blackTimeMs = 0;
        updateDisplay();
        onFlag("black");
        return;
      }
    }
    updateDisplay();
  }

  // ── Public API ─────────────────────────────────────────────

  window.initClock = function (wMs, bMs, incMs) {
    // Tear down any previous clock so we start fresh
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
    clockRunning = false;
    if (clockContainer) {
      document.body.removeChild(clockContainer);
      clockContainer =
        whiteFaceEl =
        blackFaceEl =
        whiteClockEl =
        blackClockEl =
        whiteNameEl =
        blackNameEl =
          null;
    }

    window.clockEnabled = true;
    whiteTimeMs = wMs;
    blackTimeMs = bMs;
    incrementMs = incMs || 0;
    activeSide = "white";

    buildClockUI();
    updateDisplay();
  };

  window.startClock = function () {
    if (!window.clockEnabled) return;
    clockRunning = true;
    lastTick = Date.now();
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = setInterval(tick, 100);
    updateDisplay();
  };

  window.stopClock = function () {
    clockRunning = false;
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
    updateDisplay();
  };

  window.switchClock = function () {
    if (!window.clockEnabled || !clockRunning) return;
    // Add increment to the side that just finished their move
    if (incrementMs > 0) {
      if (activeSide === "white") whiteTimeMs += incrementMs;
      else blackTimeMs += incrementMs;
    }
    activeSide = activeSide === "white" ? "black" : "white";
    updateDisplay();
  };

  window.destroyClock = function () {
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
    clockRunning = false;
    window.clockEnabled = false;
    if (clockContainer) {
      document.body.removeChild(clockContainer);
      clockContainer =
        whiteFaceEl =
        blackFaceEl =
        whiteClockEl =
        blackClockEl =
        whiteNameEl =
        blackNameEl =
          null;
    }
  };

  // Called by controls.js when piece colors change
  window.refreshClockColors = function () {
    applyColors();
  };
})();

// ── Time-control selection screen ─────────────────────────────────────────────
// Shown after the player picks "Play Locally".
// Calls onConfirm(totalMs, incrementMs) with the chosen values.

var TIME_PRESETS = [
  { label: "Bullet  —  1 min", time: 60, inc: 0 },
  { label: "Bullet  —  2 + 1", time: 120, inc: 1 },
  { label: "Blitz   —  3 min", time: 180, inc: 0 },
  { label: "Blitz   —  3 + 2", time: 180, inc: 2 },
  { label: "Blitz   —  5 min", time: 300, inc: 0 },
  { label: "Rapid   — 10 min", time: 600, inc: 0 },
  { label: "Rapid   — 10 + 5", time: 600, inc: 5 },
  { label: "Classical — 30 min", time: 1800, inc: 0 },
  { label: "No clock", time: 0, inc: 0 },
];

function showTimeControlSelection(onConfirm) {
  var screen = document.createElement("div");
  screen.id = "time-control-screen";
  screen.style.position = "absolute";
  screen.style.top = "50%";
  screen.style.left = "50%";
  screen.style.transform = "translate(-50%,-50%)";
  screen.style.textAlign = "center";
  screen.style.zIndex = "2000";

  var title = document.createElement("h2");
  title.innerText = "Select Time Control";
  title.style.marginBottom = "20px";
  screen.appendChild(title);

  // ── Preset grid ─────────────────────────────────────────
  var grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "1fr 1fr";
  grid.style.gap = "10px";
  grid.style.marginBottom = "18px";
  grid.style.maxWidth = "440px";
  grid.style.marginLeft = "auto";
  grid.style.marginRight = "auto";

  TIME_PRESETS.forEach(function (preset) {
    var btn = document.createElement("button");
    btn.innerText = preset.label;
    btn.style.padding = "12px 16px";
    btn.style.fontSize = "14px";
    btn.style.fontWeight = "bold";
    btn.style.background = "#4CAF50";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "8px";
    btn.style.cursor = "pointer";
    btn.style.transition = "transform 0.1s ease, background 0.2s";
    btn.onmouseenter = function () {
      btn.style.background = "#45a049";
    };
    btn.onmouseleave = function () {
      btn.style.background = "#4CAF50";
    };
    btn.onmousedown = function () {
      btn.style.transform = "scale(0.95)";
    };
    btn.onmouseup = function () {
      btn.style.transform = "scale(1)";
    };
    btn.onclick = function () {
      document.body.removeChild(screen);
      onConfirm(preset.time * 1000, preset.inc * 1000);
    };
    grid.appendChild(btn);
  });
  screen.appendChild(grid);

  // ── Custom time row ──────────────────────────────────────
  var customWrap = document.createElement("div");
  customWrap.style.background = "rgba(255,255,255,0.92)";
  customWrap.style.borderRadius = "10px";
  customWrap.style.padding = "14px 18px";
  customWrap.style.display = "flex";
  customWrap.style.alignItems = "center";
  customWrap.style.gap = "10px";
  customWrap.style.justifyContent = "center";
  customWrap.style.fontFamily = "sans-serif";
  customWrap.style.fontSize = "14px";
  customWrap.style.maxWidth = "440px";
  customWrap.style.margin = "0 auto";

  function numInput(placeholder, min, max, def) {
    var inp = document.createElement("input");
    inp.type = "number";
    inp.placeholder = placeholder;
    inp.min = min;
    inp.max = max;
    inp.value = def;
    inp.style.width = "58px";
    inp.style.padding = "6px 8px";
    inp.style.borderRadius = "5px";
    inp.style.border = "1px solid #aaa";
    inp.style.fontSize = "14px";
    inp.style.textAlign = "center";
    return inp;
  }

  var lbl = document.createElement("span");
  lbl.innerText = "Custom:";
  lbl.style.fontWeight = "bold";

  var minInp = numInput("Min", 0, 180, 5);
  var plus = document.createElement("span");
  plus.innerText = "+";
  var secInp = numInput("Sec", 0, 59, 0);
  var secLbl = document.createElement("span");
  secLbl.innerText = "sec";
  var incInp = numInput("Inc", 0, 60, 0);
  var incLbl = document.createElement("span");
  incLbl.innerText = "inc (s)";

  var goBtn = document.createElement("button");
  goBtn.innerText = "Start";
  goBtn.style.padding = "8px 20px";
  goBtn.style.fontSize = "14px";
  goBtn.style.fontWeight = "bold";
  goBtn.style.background = "#2196F3";
  goBtn.style.color = "white";
  goBtn.style.border = "none";
  goBtn.style.borderRadius = "6px";
  goBtn.style.cursor = "pointer";
  goBtn.style.transition = "background 0.2s";
  goBtn.onmouseenter = function () {
    goBtn.style.background = "#1976D2";
  };
  goBtn.onmouseleave = function () {
    goBtn.style.background = "#2196F3";
  };
  goBtn.onclick = function () {
    var mins = parseInt(minInp.value) || 0;
    var secs = parseInt(secInp.value) || 0;
    var inc = parseInt(incInp.value) || 0;
    var total = (mins * 60 + secs) * 1000;
    if (total <= 0) total = 300000; // fallback 5 min
    document.body.removeChild(screen);
    onConfirm(total, inc * 1000);
  };

  [lbl, minInp, plus, secInp, secLbl, incInp, incLbl, goBtn].forEach(
    function (el) {
      customWrap.appendChild(el);
    },
  );
  screen.appendChild(customWrap);

  document.body.appendChild(screen);
}
