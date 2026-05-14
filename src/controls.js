// Must load AFTER build.js functions are available

console.log("controls.js loaded");

(function () {
  // Wait for scene and functions to be available
  if (
    typeof scene === "undefined" ||
    typeof createChessBoard === "undefined" ||
    typeof refreshBoard3D === "undefined"
  ) {
    console.warn("Waiting for scene and required functions...");
    setTimeout(arguments.callee, 100);
    return;
  }

  var state = {
    whiteColor: "#faf0dc",
    blackColor: "#222222",
    boardColor: "#8B4513",
  };

  function hexToInt(h) {
    return parseInt(h.replace("#", ""), 16);
  }

  function updateScene() {
    const whitePieceHex = hexToInt(state.whiteColor);
    const blackPieceHex = hexToInt(state.blackColor);
    const boardHex = hexToInt(state.boardColor);

    createChessBoard(whitePieceHex, blackPieceHex, boardHex);

    currentWhitePieceColor = whitePieceHex;
    currentBlackPieceColor = blackPieceHex;
    refreshBoard3D();
    if (typeof resetBoardInteraction === "function") resetBoardInteraction();
  }

  // ── Panel container ───────────────────────────────────────────────────────
  var panel = document.createElement("div");
  panel.style.cssText =
    "background:#eee;padding:12px 14px;border:1px solid #999;font-size:13px;font-family:sans-serif;line-height:2.5;border-radius:6px";

  // ── White color ───────────────────────────────────────────────────────────
  var whiteLabel = document.createElement("label");
  whiteLabel.textContent = "White Pieces: ";
  whiteLabel.style.cssText = "display:inline-block;width:120px";

  var whiteInput = document.createElement("input");
  whiteInput.type = "color";
  whiteInput.value = state.whiteColor;
  whiteInput.style.cssText =
    "width:40px;height:25px;border:none;border-radius:3px;cursor:pointer;vertical-align:middle;margin-left:5px";
  whiteInput.addEventListener("input", function () {
    state.whiteColor = whiteInput.value;
    updateScene();
  });
  
  var whiteContainer = document.createElement("div");
  whiteContainer.style.cssText = "margin-bottom:10px";
  whiteContainer.appendChild(whiteLabel);
  whiteContainer.appendChild(whiteInput);
  panel.appendChild(whiteContainer);

  // ── Black color (controls both pieces AND board squares) ──────────────────
  var blackLabel = document.createElement("label");
  blackLabel.textContent = "Black Pieces & Squares: ";
  blackLabel.style.cssText = "display:inline-block;width:120px";

  var blackInput = document.createElement("input");
  blackInput.type = "color";
  blackInput.value = state.blackColor;
  blackInput.style.cssText =
    "width:40px;height:25px;border:none;border-radius:3px;cursor:pointer;vertical-align:middle;margin-left:5px";
  blackInput.addEventListener("input", function () {
    state.blackColor = blackInput.value;
    updateScene();
  });
  
  var blackContainer = document.createElement("div");
  blackContainer.style.cssText = "margin-bottom:10px";
  blackContainer.appendChild(blackLabel);
  blackContainer.appendChild(blackInput);
  panel.appendChild(blackContainer);

  // ── Board color ───────────────────────────────────────────────────────────
  var boardLabel = document.createElement("label");
  boardLabel.textContent = "Board Color: ";
  boardLabel.style.cssText = "display:inline-block;width:120px";

  var boardInput = document.createElement("input");
  boardInput.type = "color";
  boardInput.value = state.boardColor;
  boardInput.style.cssText =
    "width:40px;height:25px;border:none;border-radius:3px;cursor:pointer;vertical-align:middle;margin-left:5px";
  boardInput.addEventListener("input", function () {
    state.boardColor = boardInput.value;
    updateScene();
  });
  
  var boardContainer = document.createElement("div");
  boardContainer.style.cssText = "margin-bottom:10px";
  boardContainer.appendChild(boardLabel);
  boardContainer.appendChild(boardInput);
  panel.appendChild(boardContainer);

  // Game mode — local (both colours human) vs CPU (human White only)
  var modeLabel = document.createElement("label");
  modeLabel.textContent = "Play mode: ";
  modeLabel.style.cssText = "display:inline-block;width:120px";

  var modeSelect = document.createElement("select");
  modeSelect.style.cssText =
    "margin-left:5px;padding:4px 8px;border-radius:3px;border:1px solid #999;font-size:13px";
  [["local", "Local (both sides)"], ["cpu", "vs CPU (you are White)"]].forEach(function (opt) {
    var o = document.createElement("option");
    o.value = opt[0];
    o.textContent = opt[1];
    modeSelect.appendChild(o);
  });
  modeSelect.value = window.gameMode || "local";
  modeSelect.addEventListener("change", function () {
    window.gameMode = modeSelect.value;
    if (typeof startGame === "function") startGame();
  });

  var modeContainer = document.createElement("div");
  modeContainer.style.cssText = "margin-bottom:10px";
  modeContainer.appendChild(modeLabel);
  modeContainer.appendChild(modeSelect);
  panel.appendChild(modeContainer);

  // AI difficulty (only used when mode is CPU)
  var diffLabel = document.createElement("label");
  diffLabel.textContent = "CPU strength: ";
  diffLabel.style.cssText = "display:inline-block;width:120px";

  var diffSelect = document.createElement("select");
  diffSelect.style.cssText =
    "margin-left:5px;padding:4px 8px;border-radius:3px;border:1px solid #999;font-size:13px";
  [["easy", "Easy (random)"], ["medium", "Medium (depth 2)"], ["hard", "Hard (depth 3)"]].forEach(
    function (opt) {
      var o = document.createElement("option");
      o.value = opt[0];
      o.textContent = opt[1];
      diffSelect.appendChild(o);
    }
  );
  diffSelect.value = window.aiDifficulty || "medium";
  diffSelect.addEventListener("change", function () {
    window.aiDifficulty = diffSelect.value;
    if (window.gameMode === "cpu" && typeof startGame === "function") startGame();
  });

  var diffContainer = document.createElement("div");
  diffContainer.style.cssText = "margin-bottom:0px";
  diffContainer.appendChild(diffLabel);
  diffContainer.appendChild(diffSelect);
  panel.appendChild(diffContainer);

  // ── Mount panel ────────────────────────────────────────────────────────────
  (document.getElementById("menu") || document.body).appendChild(panel);
})();
