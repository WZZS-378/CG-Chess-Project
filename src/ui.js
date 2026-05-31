// ui.js — Settings UI + all game-flow screens.

(function () {
  function init() {
    if (document.getElementById("menu-root")) return;

    if (
      typeof THEMES === "undefined" ||
      typeof MATERIAL_PRESETS === "undefined"
    ) {
      setTimeout(init, 100);
      return;
    }

    // Root container (hidden until game starts)
    var root = document.createElement("div");
    root.id = "menu-root";
    root.style.position = "absolute";
    root.style.top = "20px";
    root.style.right = "20px";
    root.style.zIndex = "1000";
    root.style.display = "none";
    document.body.appendChild(root);

    // Pause overlay
    var pauseOverlay = document.createElement("div");
    pauseOverlay.id = "pause-overlay";
    pauseOverlay.style.cssText =
      "display:none;position:fixed;top:0;left:0;width:100%;height:100%;" +
      "background:rgba(0,0,0,0.55);z-index:900;pointer-events:none;" +
      "justify-content:center;align-items:center;flex-direction:column;";
    var pauseTitle = document.createElement("div");
    pauseTitle.innerText = "PAUSED";
    pauseTitle.style.cssText =
      "font-family:sans-serif;font-size:96px;font-weight:900;color:white;" +
      "letter-spacing:12px;text-shadow:0 4px 32px rgba(0,0,0,0.8);line-height:1;";
    var pauseSub = document.createElement("div");
    pauseSub.innerText = "Close Settings to continue";
    pauseSub.style.cssText =
      "font-family:sans-serif;font-size:18px;color:rgba(255,255,255,0.65);" +
      "margin-top:16px;letter-spacing:2px;text-transform:uppercase;";
    pauseOverlay.appendChild(pauseTitle);
    pauseOverlay.appendChild(pauseSub);
    document.body.appendChild(pauseOverlay);

    // Panel
    var panel = document.createElement("div");
    panel.id = "settings-panel";
    panel.style.background = "rgba(255,255,255,0.95)";
    panel.style.padding = "12px";
    panel.style.borderRadius = "8px";
    panel.style.display = "none";
    panel.style.minWidth = "200px";
    root.appendChild(panel);

    if (typeof buildControlsUI === "function") buildControlsUI(panel);
    if (typeof buildEnvironmentUI === "function") buildEnvironmentUI(panel);
    if (typeof buildFiltersUI === "function") buildFiltersUI(panel);

    // Toggle button
    var toggleBtn = document.createElement("button");
    toggleBtn.innerText = "⚙ Settings";
    toggleBtn.style.padding = "10px 16px";
    toggleBtn.style.fontSize = "14px";
    toggleBtn.style.background = "#333";
    toggleBtn.style.background = "#333";
    toggleBtn.style.border = "none";
    toggleBtn.style.borderRadius = "6px";
    toggleBtn.style.cursor = "pointer";
    toggleBtn.style.marginBottom = "8px";
    toggleBtn.style.color = "white";
    root.appendChild(toggleBtn);

    var isOpen = false;
    function togglePanel() {
      isOpen = !isOpen;
      panel.style.display = isOpen ? "block" : "none";
      toggleBtn.innerText = isOpen ? "✕ Close Settings" : "⚙ Settings";

      // Show/hide pause overlay
      pauseOverlay.style.display = isOpen ? "flex" : "none";

      // Pause/resume clock
      if (isOpen) {
        if (typeof stopClock === "function") stopClock();
      } else {
        if (typeof startClock === "function" && window.clockEnabled)
          startClock();
      }

      if (typeof renderer !== "undefined") {
        renderer.domElement.style.pointerEvents = isOpen ? "none" : "auto";
      }
      if (typeof controls !== "undefined") controls.enabled = !isOpen;
    }

    // Reveal settings button when a game is active
    window.showSettingsButton = function () {
      root.style.display = "block";
    };
    // Hide settings button when returning to menus
    window.hideSettingsButton = function () {
      root.style.display = "none";
      if (isOpen) {
        isOpen = false;
        panel.style.display = "none";
        pauseOverlay.style.display = "none";
        if (typeof renderer !== "undefined")
          renderer.domElement.style.pointerEvents = "auto";
        if (typeof controls !== "undefined") controls.enabled = true;
      }
    };

    toggleBtn.onclick = togglePanel;
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.key.toLowerCase() === "u") {
        if (root.style.display !== "none") togglePanel();
      }
    });
    panel.addEventListener("click", function (e) {
      e.stopPropagation();
    });
    toggleBtn.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    // ── Divider ────────────────────────────────────
    var hr = document.createElement("hr");
    hr.style.border = "none";
    hr.style.borderTop = "1px solid #bbb";
    hr.style.margin = "8px 0";
    panel.appendChild(hr);

    // ── Helpers ────────────────────────────────────
    function makeRow(labelText, el) {
      var row = document.createElement("div");
      row.style.marginBottom = "8px";
      var lbl = document.createElement("label");
      lbl.textContent = labelText;
      lbl.style.cssText =
        "display:inline-block;width:120px;font-size:13px;font-family:sans-serif";
      row.appendChild(lbl);
      row.appendChild(el);
      return row;
    }

    function makeSelect(options, onChange) {
      var sel = document.createElement("select");
      sel.style.cssText =
        "padding:3px 6px;border-radius:3px;border:1px solid #999;font-size:13px";
      options.forEach(function (o) {
        var opt = document.createElement("option");
        opt.value = o.value;
        opt.textContent = o.label;
        sel.appendChild(opt);
      });
      sel.addEventListener("change", function () {
        onChange(sel.value);
      });
      return sel;
    }

    // Board Style
    panel.appendChild(
      makeRow(
        "Board Style:",
        makeSelect(
          Object.keys(BOARD_STYLES).map(function (k) {
            return { value: k, label: BOARD_STYLES[k].label };
          }),
          function (v) {
            applyBoardStyle(v);
          },
        ),
      ),
    );

    // Board Material
    panel.appendChild(
      makeRow(
        "Board Material:",
        makeSelect(
          Object.keys(BOARD_MATERIAL_PRESETS).map(function (k) {
            return { value: k, label: BOARD_MATERIAL_PRESETS[k].label };
          }),
          function (v) {
            applyBoardMaterial(v);
          },
        ),
      ),
    );

    // Piece Style
    panel.appendChild(
      makeRow(
        "Piece Style:",
        makeSelect(
          Object.keys(PIECE_STYLES).map(function (k) {
            return { value: k, label: PIECE_STYLES[k].label };
          }),
          function (v) {
            applyPieceStyle(v);
          },
        ),
      ),
    );

    // Piece Material
    panel.appendChild(
      makeRow(
        "Piece Material:",
        makeSelect(
          Object.keys(MATERIAL_PRESETS).map(function (k) {
            return { value: k, label: MATERIAL_PRESETS[k].label };
          }),
          function (v) {
            applyMaterialPreset(v);
          },
        ),
      ),
    );

    // Theme
    panel.appendChild(
      makeRow(
        "Theme:",
        makeSelect(
          Object.keys(THEMES).map(function (k) {
            return { value: k, label: THEMES[k].label };
          }),
          function (v) {
            applyTheme(v);
          },
        ),
      ),
    );
  }

  window.initSettingsUI = init;
})();

// ── Main Menu ──────────────────────────────────────────────────────────────────

function showMainMenu() {
  hideStatusBar();
  if (typeof hideSettingsButton === "function") hideSettingsButton();
  if (typeof destroyClock === "function") destroyClock();

  var menu = document.createElement("div");
  menu.style.position = "absolute";
  menu.style.top = "50%";
  menu.style.left = "50%";
  menu.style.transform = "translate(-50%,-50%)";
  menu.style.textAlign = "center";
  menu.style.background = "rgba(30,30,30,0.88)";
  menu.style.color = "white";
  menu.style.padding = "40px 60px 48px";
  menu.style.borderRadius = "18px";
  menu.style.boxShadow = "0 8px 48px rgba(0,0,0,0.7)";
  menu.style.fontFamily = "sans-serif";
  menu.style.zIndex = "2000";

  var title = document.createElement("h1");
  title.innerText = "Chess";
  title.style.fontSize = "48px";

  var startBtn = document.createElement("button");
  startBtn.innerText = "Start Game";
  startBtn.style.cssText =
    "padding:16px 40px;font-size:22px;font-weight:bold;background:#4CAF50;color:white;border:none;border-radius:8px;cursor:pointer;margin-top:20px;transition:transform 0.1s ease,background 0.2s;display:block;margin-left:auto;margin-right:auto;";
  startBtn.onmouseenter = function () {
    startBtn.style.background = "#45a049";
  };
  startBtn.onmouseleave = function () {
    startBtn.style.background = "#4CAF50";
  };
  startBtn.onmousedown = function () {
    startBtn.style.transform = "scale(0.95)";
  };
  startBtn.onmouseup = function () {
    startBtn.style.transform = "scale(1)";
  };
  startBtn.onclick = function () {
    document.body.removeChild(menu);
    showModeSelection();
  };

  var watchBtn = document.createElement("button");
  watchBtn.innerText = "Watch Famous Games";
  watchBtn.style.cssText =
    "padding:16px 40px;font-size:22px;font-weight:bold;background:#2196F3;color:white;border:none;border-radius:8px;cursor:pointer;margin-top:20px;transition:transform 0.1s ease,background 0.2s;display:block;margin-left:auto;margin-right:auto;";
  watchBtn.onmouseenter = function () {
    watchBtn.style.background = "#1976D2";
  };
  watchBtn.onmouseleave = function () {
    watchBtn.style.background = "#2196F3";
  };
  watchBtn.onmousedown = function () {
    watchBtn.style.transform = "scale(0.95)";
  };
  watchBtn.onmouseup = function () {
    watchBtn.style.transform = "scale(1)";
  };
  watchBtn.onclick = function () {
    document.body.removeChild(menu);
    if (typeof showGameSelection === "function") showGameSelection();
  };

  if (typeof initSettingsUI === "function") initSettingsUI();

  menu.appendChild(title);
  menu.appendChild(startBtn);
  menu.appendChild(watchBtn);
  document.body.appendChild(menu);
}

// ── Mode Selection ─────────────────────────────────────────────────────────────

function showModeSelection() {
  var screen = document.createElement("div");
  screen.style.position = "absolute";
  screen.style.top = "50%";
  screen.style.left = "50%";
  screen.style.transform = "translate(-50%,-50%)";
  screen.style.textAlign = "center";
  screen.style.background = "rgba(30,30,30,0.92)";
  screen.style.color = "white";
  screen.style.padding = "32px 48px 40px";
  screen.style.borderRadius = "16px";
  screen.style.boxShadow = "0 8px 40px rgba(0,0,0,0.7)";
  screen.style.fontFamily = "sans-serif";
  screen.style.zIndex = "2000";

  var title = document.createElement("h2");
  title.innerText = "Select Game Mode";

  var localBtn = document.createElement("button");
  localBtn.innerText = "Play Locally";
  var cpuBtn = document.createElement("button");
  cpuBtn.innerText = "Play vs CPU";

  styleMenuButton(localBtn);
  styleMenuButton(cpuBtn);

  // ── Local: pick time control first, then start ────────────
  localBtn.onclick = function () {
    window.gameMode = "local";
    document.body.removeChild(screen);

    showTimeControlSelection(function (timeMs, incMs) {
      // Destroy any old clock before creating a new one
      if (typeof destroyClock === "function") destroyClock();

      if (timeMs > 0 && typeof initClock === "function") {
        initClock(timeMs, timeMs, incMs);
      }

      clearHistory();
      addShapes();
      startGame(); // startGame calls startClock() internally when clockEnabled
    });
  };

  // ── CPU: pick difficulty then start (no clock) ────────────
  cpuBtn.onclick = function () {
    document.body.removeChild(screen);
    showDifficultySelection();
  };

  screen.appendChild(title);
  screen.appendChild(localBtn);
  screen.appendChild(cpuBtn);
  document.body.appendChild(screen);
}

// ── Difficulty Selection ───────────────────────────────────────────────────────

function showDifficultySelection() {
  var screen = document.createElement("div");
  screen.style.position = "absolute";
  screen.style.top = "50%";
  screen.style.left = "50%";
  screen.style.transform = "translate(-50%,-50%)";
  screen.style.textAlign = "center";
  screen.style.background = "rgba(30,30,30,0.92)";
  screen.style.color = "white";
  screen.style.padding = "32px 48px 40px";
  screen.style.borderRadius = "16px";
  screen.style.boxShadow = "0 8px 40px rgba(0,0,0,0.7)";
  screen.style.fontFamily = "sans-serif";
  screen.style.zIndex = "2000";

  var title = document.createElement("h2");
  title.innerText = "Select CPU Difficulty";

  var easy = document.createElement("button");
  easy.innerText = "Easy";
  var medium = document.createElement("button");
  medium.innerText = "Medium";
  var hard = document.createElement("button");
  hard.innerText = "Hard";

  [easy, medium, hard].forEach(styleMenuButton);

  easy.onclick = function () {
    startCpuGame("easy", screen);
  };
  medium.onclick = function () {
    startCpuGame("medium", screen);
  };
  hard.onclick = function () {
    startCpuGame("hard", screen);
  };

  screen.appendChild(title);
  screen.appendChild(easy);
  screen.appendChild(medium);
  screen.appendChild(hard);
  document.body.appendChild(screen);
}

function startCpuGame(difficulty, screen) {
  window.gameMode = "cpu";
  window.aiDifficulty = difficulty;
  document.body.removeChild(screen);
  clearHistory();
  addShapes();
  startGame();
}

// ── End Screen ─────────────────────────────────────────────────────────────────

function showEndScreenFromStatus(status) {
  var text = "";
  if (status === "checkmate") {
    var winner = gameState.turn === "white" ? "Black" : "White";
    text = winner + " wins by checkmate!";
  } else if (status === "stalemate") {
    text = "Draw by stalemate";
  } else if (status === "draw-50move") {
    text = "Draw by 50-move rule";
  }
  showEndScreen(text);
}

function showEndScreen(resultText) {
  if (typeof stopClock === "function") stopClock();
  if (typeof hideSettingsButton === "function") hideSettingsButton();

  var screen = document.createElement("div");
  screen.style.position = "absolute";
  screen.style.top = "50%";
  screen.style.left = "50%";
  screen.style.transform = "translate(-50%,-50%)";
  screen.style.textAlign = "center";

  var result = document.createElement("h1");
  result.innerText = resultText;
  result.style.fontSize = "32px";

  var restart = document.createElement("button");
  restart.innerText = "Play Again";
  restart.style.cssText =
    "padding:16px 40px;font-size:20px;font-weight:bold;background:#2196F3;color:white;border:none;border-radius:8px;cursor:pointer;margin:10px;transition:transform 0.1s ease,background 0.2s;";

  var menuBtn = document.createElement("button");
  menuBtn.innerText = "Main Menu";
  menuBtn.style.cssText =
    "padding:16px 40px;font-size:20px;font-weight:bold;background:#f44336;color:white;border:none;border-radius:8px;cursor:pointer;margin:10px;transition:transform 0.1s ease,background 0.2s;";

  [restart, menuBtn].forEach(function (btn) {
    btn.onmousedown = function () {
      btn.style.transform = "scale(0.95)";
    };
    btn.onmouseup = function () {
      btn.style.transform = "scale(1)";
    };
  });

  restart.onmouseenter = function () {
    restart.style.background = "#1976D2";
  };
  restart.onmouseleave = function () {
    restart.style.background = "#2196F3";
  };
  menuBtn.onmouseenter = function () {
    menuBtn.style.background = "#d32f2f";
  };
  menuBtn.onmouseleave = function () {
    menuBtn.style.background = "#f44336";
  };

  // Play Again: if local mode, go back through time-control selection
  restart.onclick = function () {
    document.body.removeChild(screen);

    if (window.gameMode === "local") {
      if (typeof destroyClock === "function") destroyClock();
      showTimeControlSelection(function (timeMs, incMs) {
        if (timeMs > 0 && typeof initClock === "function") {
          initClock(timeMs, timeMs, incMs);
        }
        clearHistory();
        addShapes();
        startGame();
      });
    } else {
      clearHistory();
      addShapes();
      startGame();
    }
  };

  menuBtn.onclick = function () {
    document.body.removeChild(screen);
    showMainMenu();
  };

  screen.appendChild(result);
  screen.appendChild(restart);
  screen.appendChild(menuBtn);
  document.body.appendChild(screen);
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function styleMenuButton(btn) {
  btn.style.cssText =
    "display:block;padding:16px 40px;font-size:20px;font-weight:bold;margin:10px auto;background:#4CAF50;color:white;border:none;border-radius:8px;cursor:pointer;transition:transform 0.1s ease,background 0.2s;";
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
}

function createMoveHistoryPanel() {
  var panel = document.createElement("div");
  panel.id = "moveHistoryPanel";
  Object.assign(panel.style, {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    width: "220px",
    height: "300px",
    backgroundColor: "rgba(0,0,0,0.7)",
    color: "white",
    padding: "10px",
    borderRadius: "10px",
    overflowY: "auto",
    fontFamily: "monospace",
    fontSize: "14px",
  });

  var title = document.createElement("div");
  title.innerText = "Move History";
  Object.assign(title.style, {
    fontWeight: "bold",
    marginBottom: "8px",
    textAlign: "center",
  });
  panel.appendChild(title);

  var list = document.createElement("div");
  list.id = "moveList";
  panel.appendChild(list);

  document.body.appendChild(panel);
}
