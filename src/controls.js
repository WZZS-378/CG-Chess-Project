console.log("controls.js loaded");

window.buildControlsUI = function (panel) {
  if (
    typeof scene === "undefined" ||
    typeof createChessBoard === "undefined" ||
    typeof refreshBoard3D === "undefined"
  ) {
    console.warn("Waiting for scene and required functions...");
    setTimeout(function () {
      window.buildControlsUI(panel);
    }, 100);
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
    var whitePieceHex = hexToInt(state.whiteColor);
    var blackPieceHex = hexToInt(state.blackColor);
    var boardHex = hexToInt(state.boardColor);

    createChessBoard(whitePieceHex, blackPieceHex, boardHex);
    currentWhitePieceColor = whitePieceHex;
    currentBlackPieceColor = blackPieceHex;
    refreshBoard3D();

    if (typeof resetBoardInteraction === "function") resetBoardInteraction();

    // Keep clock faces in sync with piece colors
    if (typeof refreshClockColors === "function") refreshClockColors();
  }

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

  function makeColorInput(value, onChange) {
    var input = document.createElement("input");
    input.type = "color";
    input.value = value;
    input.style.cssText =
      "width:40px;height:25px;border:none;border-radius:3px;cursor:pointer";
    input.addEventListener("input", function () {
      onChange(input.value);
    });
    return input;
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

  // ── Divider ──────────────────────────────────────────────
  var hr = document.createElement("hr");
  hr.style.cssText = "border:none;border-top:1px solid #bbb;margin:8px 0";
  panel.appendChild(hr);

  // ── Colors ───────────────────────────────────────────────
  panel.appendChild(
    makeRow(
      "White Pieces:",
      makeColorInput(state.whiteColor, function (v) {
        state.whiteColor = v;
        updateScene();
      }),
    ),
  );
  panel.appendChild(
    makeRow(
      "Black Pieces:",
      makeColorInput(state.blackColor, function (v) {
        state.blackColor = v;
        updateScene();
      }),
    ),
  );
  panel.appendChild(
    makeRow(
      "Board Color:",
      makeColorInput(state.boardColor, function (v) {
        state.boardColor = v;
        updateScene();
      }),
    ),
  );

  // ── Game Mode ────────────────────────────────────────────
  var modeSelect = makeSelect(
    [
      { value: "local", label: "Local (2 Players)" },
      { value: "cpu", label: "Vs CPU" },
    ],
    function (v) {
      window.gameMode = v;
      difficultyRow.style.display = v === "cpu" ? "block" : "none";
      if (typeof startGame === "function") {
        clearHistory();
        startGame();
      }
    },
  );
  modeSelect.value = window.gameMode || "local";
  panel.appendChild(makeRow("Game Mode:", modeSelect));

  // ── CPU Difficulty ───────────────────────────────────────
  var difficultySelect = makeSelect(
    [
      { value: "easy", label: "Easy (random)" },
      { value: "medium", label: "Medium (depth 2)" },
      { value: "hard", label: "Hard (depth 3)" },
    ],
    function (v) {
      window.aiDifficulty = v;
      if (window.gameMode === "cpu" && typeof startGame === "function") {
        clearHistory();
        startGame();
      }
    },
  );
  difficultySelect.value = window.aiDifficulty || "medium";

  var difficultyRow = makeRow("CPU Level:", difficultySelect);
  difficultyRow.style.display =
    (window.gameMode || "local") === "cpu" ? "block" : "none";
  panel.appendChild(difficultyRow);
};
