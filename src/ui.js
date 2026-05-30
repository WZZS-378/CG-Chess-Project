// ui.js — Piece theme + material controls
// Appends rows to the panel controls.js already built inside #menu.
// Calls applyTheme() and applyMaterialPreset() from pieces.js.

(function () {
  function init() {
  // Prevent duplicate init
  if (document.getElementById("menu-root")) return;

  // Wait for dependencies
  if (
    typeof THEMES === "undefined" ||
    typeof MATERIAL_PRESETS === "undefined"
  ) {
    setTimeout(init, 100);
    return;
  }

  // ── Root container ─────────────────────────────
  var root = document.createElement("div");
  root.id = "menu-root";
  root.style.cssText = `
    position:absolute;
    top:20px;
    right:20px;
    z-index:1000;
  `;
  document.body.appendChild(root);

  // ── Panel ──────────────────────────────────────
  var panel = document.createElement("div");
  panel.id = "settings-panel";
  panel.style.cssText = `
    background:rgba(255, 255, 255, 0.95);
    padding:12px;
    border-radius:8px;
    display:none;
    min-width:200px;
  `;
  root.appendChild(panel);
  
  if (typeof buildControlsUI === "function") {
    buildControlsUI(panel);
  }

  if (typeof buildEnvironmentUI === "function") {
    buildEnvironmentUI(panel);
  }

  // ── Toggle button ──────────────────────────────
  var toggleBtn = document.createElement("button");
  toggleBtn.innerText = "⚙ Settings";

  toggleBtn.style.cssText = `
    padding:10px 16px;
    font-size:14px;
    background:#333;
    color:white;
    border:none;
    border-radius:6px;
    cursor:pointer;
    margin-bottom:8px;
  `;

  root.appendChild(toggleBtn);

  // ── Toggle logic ───────────────────────────────
  var isOpen = false;

  function togglePanel() {
    isOpen = !isOpen;
    panel.style.display = isOpen ? "block" : "none";

    // Optional: disable board interaction
    if (typeof renderer !== "undefined") {
      renderer.domElement.style.pointerEvents = isOpen ? "none" : "auto";
    }

    if (typeof controls !== "undefined") {
      controls.enabled = !isOpen;
    }
  }

  toggleBtn.onclick = togglePanel;

  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" || e.key.toLowerCase() === "u") {
      togglePanel();
    }
  });

  panel.addEventListener("click", e => e.stopPropagation());
  toggleBtn.addEventListener("click", e => e.stopPropagation());

  // ── Divider ───────────────────────────────────
  var hr = document.createElement("hr");
  hr.style.cssText = "border:none;border-top:1px solid #bbb;margin:8px 0";
  panel.appendChild(hr);

  // ── Helpers ───────────────────────────────────
  function makeRow(labelText, el) {
    var row = document.createElement("div");
    row.style.cssText = "margin-bottom:8px";

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

  // ── Theme dropdown ────────────────────────────
  var themeOptions = Object.keys(THEMES).map(function (k) {
    return { value: k, label: THEMES[k].label };
  });

  panel.appendChild(
    makeRow(
      "Theme:",
      makeSelect(themeOptions, function (v) {
        applyTheme(v);
      }),
    ),
  );

  // ── Material dropdown ─────────────────────────
  var matOptions = Object.keys(MATERIAL_PRESETS).map(function (k) {
    return { value: k, label: MATERIAL_PRESETS[k].label };
  });

  panel.appendChild(
    makeRow(
      "Material:",
      makeSelect(matOptions, function (v) {
        applyMaterialPreset(v);
      }),
    ),
  );
}

  window.initSettingsUI = init;
})();



//Game UI
function showMainMenu() {
    hideStatusBar();

    const menu = document.createElement("div");
    menu.style.position = "absolute";
    menu.style.top = "50%";
    menu.style.left = "50%";
    menu.style.transform = "translate(-50%, -50%)";
    menu.style.textAlign = "center";

    const title = document.createElement("h1");
    title.innerText = "Chess";
    title.style.fontSize = "48px";

    const startBtn = document.createElement("button");
    startBtn.innerText = "Start Game";

    //Button styling
    startBtn.style.cssText = `
        padding:16px 40px;
        font-size:22px;
        font-weight:bold;
        background:#4CAF50;
        color:white;
        border:none;
        border-radius:8px;
        cursor:pointer;
        margin-top:20px;
        transition:transform 0.1s ease, background 0.2s;
    `;

    //Interactions
    startBtn.onmouseenter = () => startBtn.style.background = "#45a049";
    startBtn.onmouseleave = () => startBtn.style.background = "#4CAF50";
    startBtn.onmousedown = () => startBtn.style.transform = "scale(0.95)";
    startBtn.onmouseup = () => startBtn.style.transform = "scale(1)";

    //Start game
    startBtn.onclick = () => {
        document.body.removeChild(menu);
        showModeSelection();
    };

    if (typeof initSettingsUI === "function") {
        initSettingsUI();
    }
    
    menu.appendChild(title);
    menu.appendChild(startBtn);
    document.body.appendChild(menu);
}

function showEndScreenFromStatus(status) {
    let text = "";

    if (status === 'checkmate') {
        const winner = gameState.turn === 'white' ? 'Black' : 'White';
        text = winner + " wins by checkmate!";
    } 
    else if (status === 'stalemate') {
        text = "Draw by stalemate";
    } 
    else if (status === 'draw-50move') {
        text = "Draw by 50-move rule";
    }

    showEndScreen(text);
}

function showEndScreen(resultText) {
    const screen = document.createElement("div");
    screen.style.position = "absolute";
    screen.style.top = "50%";
    screen.style.left = "50%";
    screen.style.transform = "translate(-50%, -50%)";
    screen.style.textAlign = "center";

    const result = document.createElement("h1");
    result.innerText = resultText;
    result.style.fontSize = "32px";

    const restart = document.createElement("button");
    restart.innerText = "Play Again";

    const menuBtn = document.createElement("button");
    menuBtn.innerText = "Main Menu";

    // Restart button
    restart.style.cssText = `
        padding:16px 40px;
        font-size:20px;
        font-weight:bold;
        background:#2196F3;
        color:white;
        border:none;
        border-radius:8px;
        cursor:pointer;
        margin:10px;
        transition:transform 0.1s ease, background 0.2s;
    `;

    // Menu button
    menuBtn.style.cssText = `
        padding:16px 40px;
        font-size:20px;
        font-weight:bold;
        background:#f44336;
        color:white;
        border:none;
        border-radius:8px;
        cursor:pointer;
        margin:10px;
        transition:transform 0.1s ease, background 0.2s;
    `;

    //Shared click animation
    [restart, menuBtn].forEach(btn => {
        btn.onmousedown = () => btn.style.transform = "scale(0.95)";
        btn.onmouseup = () => btn.style.transform = "scale(1)";
    });

    // over effects
    restart.onmouseenter = () => restart.style.background = "#1976D2";
    restart.onmouseleave = () => restart.style.background = "#2196F3";

    menuBtn.onmouseenter = () => menuBtn.style.background = "#d32f2f";
    menuBtn.onmouseleave = () => menuBtn.style.background = "#f44336";

    //Restart game
    restart.onclick = () => {
        document.body.removeChild(screen);

        clearHistory();
        addShapes();   // rebuild board
        startGame();   // restart logic
    };

    //Back to menu
    menuBtn.onclick = () => {
        document.body.removeChild(screen);
        showMainMenu();
    };

    screen.appendChild(result);
    screen.appendChild(restart);
    screen.appendChild(menuBtn);
    document.body.appendChild(screen);
}

function showModeSelection() {
    const screen = document.createElement("div");
    screen.style = `
        position:absolute;
        top:50%;
        left:50%;
        transform:translate(-50%, -50%);
        text-align:center;
    `;

    const title = document.createElement("h2");
    title.innerText = "Select Game Mode";

    const localBtn = document.createElement("button");
    localBtn.innerText = "Play Locally";

    const cpuBtn = document.createElement("button");
    cpuBtn.innerText = "Play vs CPU";

    styleMenuButton(localBtn);
    styleMenuButton(cpuBtn);

    // Local game
    localBtn.onclick = () => {
        window.gameMode = 'local';
        document.body.removeChild(screen);

        clearHistory();
        addShapes();
        startGame();
        createMoveHistoryPanel();
    };

    // CPU game → go to difficulty select
    cpuBtn.onclick = () => {
        document.body.removeChild(screen);
        showDifficultySelection();
    };

    screen.appendChild(title);
    screen.appendChild(localBtn);
    screen.appendChild(cpuBtn);
    document.body.appendChild(screen);
}

function showDifficultySelection() {
    const screen = document.createElement("div");
    screen.style = `
        position:absolute;
        top:50%;
        left:50%;
        transform:translate(-50%, -50%);
        text-align:center;
    `;

    const title = document.createElement("h2");
    title.innerText = "Select CPU Difficulty";

    const easy = document.createElement("button");
    const medium = document.createElement("button");
    const hard = document.createElement("button");

    easy.innerText = "Easy";
    medium.innerText = "Medium";
    hard.innerText = "Hard";

    [easy, medium, hard].forEach(styleMenuButton);

    easy.onclick = () => startCpuGame('easy', screen);
    medium.onclick = () => startCpuGame('medium', screen);
    hard.onclick = () => startCpuGame('hard', screen);

    screen.appendChild(title);
    screen.appendChild(easy);
    screen.appendChild(medium);
    screen.appendChild(hard);
    document.body.appendChild(screen);
}

function startCpuGame(difficulty, screen) {
    window.gameMode = 'cpu';
    window.aiDifficulty = difficulty;

    document.body.removeChild(screen);

    clearHistory();
    addShapes();
    startGame();
    createMoveHistoryPanel();
}

function styleMenuButton(btn) {
    btn.style.cssText = `
        display:block;
        padding:16px 40px;
        font-size:20px;
        font-weight:bold;
        margin:10px auto;
        background:#4CAF50;
        color:white;
        border:none;
        border-radius:8px;
        cursor:pointer;
        transition:transform 0.1s ease, background 0.2s;
    `;

    btn.onmouseenter = () => btn.style.background = "#45a049";
    btn.onmouseleave = () => btn.style.background = "#4CAF50";
    btn.onmousedown = () => btn.style.transform = "scale(0.95)";
    btn.onmouseup = () => btn.style.transform = "scale(1)";
}

// Create move history panel
function createMoveHistoryPanel() {
  const panel = document.createElement("div");

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

  const title = document.createElement("div");
  title.innerText = "Move History";
  Object.assign(title.style, {
    fontWeight: "bold",
    marginBottom: "8px",
    textAlign: "center",
  });

  panel.appendChild(title);

  const list = document.createElement("div");
  list.id = "moveList";

  panel.appendChild(list);

  document.body.appendChild(panel);
}