// Must load AFTER pieces.js.

console.log(
  "controls.js loaded, placePieces:",
  typeof placePieces,
  "menu:",
  document.getElementById("menu"),
);

(function () {
  var state = {
    pieceStyle: "classic",
    materialType: "flat",
    whiteColor: "#faf0dc",
    blackColor: "#1a1a1a",
  };

  function hexToInt(h) {
    return parseInt(h.replace("#", ""), 16);
  }

  function push() {
    placePieces({
      pieceStyle: state.pieceStyle,
      materialType: state.materialType,
      whiteColor: hexToInt(state.whiteColor),
      blackColor: hexToInt(state.blackColor),
    });
  }

  // ── Panel container ───────────────────────────────────────────────────────
  var panel = document.createElement("div");
  panel.style.cssText =
    "background:#eee;padding:8px 12px;border:1px solid #999;font-size:13px;font-family:sans-serif;line-height:2";

  // ── Piece style ───────────────────────────────────────────────────────────
  var styleLabel = document.createElement("label");
  styleLabel.textContent = "Piece style: ";

  var styleSelect = document.createElement("select");
  [
    { value: "classic", text: "Classic" },
    { value: "lowpoly", text: "Low Poly" },
    { value: "military", text: "Military" },
  ].forEach(function (o) {
    var opt = document.createElement("option");
    opt.value = o.value;
    opt.textContent = o.text;
    if (o.value === state.pieceStyle) opt.selected = true;
    styleSelect.appendChild(opt);
  });
  styleSelect.addEventListener("change", function () {
    state.pieceStyle = styleSelect.value;
    push();
  });

  styleLabel.appendChild(styleSelect);
  panel.appendChild(styleLabel);
  panel.appendChild(document.createElement("br"));

  // ── Material ──────────────────────────────────────────────────────────────
  var matLabel = document.createElement("label");
  matLabel.textContent = "Material: ";

  var matSelect = document.createElement("select");
  [
    { value: "flat", text: "Flat" },
    { value: "matte", text: "Matte" },
    { value: "shiny", text: "Shiny" },
    { value: "wood", text: "Wood" },
    { value: "metallic", text: "Metallic" },
    { value: "glass", text: "Glass" },
  ].forEach(function (o) {
    var opt = document.createElement("option");
    opt.value = o.value;
    opt.textContent = o.text;
    if (o.value === state.materialType) opt.selected = true;
    matSelect.appendChild(opt);
  });
  matSelect.addEventListener("change", function () {
    state.materialType = matSelect.value;
    push();
  });

  matLabel.appendChild(matSelect);
  panel.appendChild(matLabel);
  panel.appendChild(document.createElement("br"));

  // ── White color ───────────────────────────────────────────────────────────
  var whiteLabel = document.createElement("label");
  whiteLabel.textContent = "White: ";
  var whiteInput = document.createElement("input");
  whiteInput.type = "color";
  whiteInput.value = state.whiteColor;
  whiteInput.addEventListener("input", function () {
    state.whiteColor = whiteInput.value;
    push();
  });
  whiteLabel.appendChild(whiteInput);
  panel.appendChild(whiteLabel);
  panel.appendChild(document.createElement("br"));

  // ── Black color ───────────────────────────────────────────────────────────
  var blackLabel = document.createElement("label");
  blackLabel.textContent = "Black: ";
  var blackInput = document.createElement("input");
  blackInput.type = "color";
  blackInput.value = state.blackColor;
  blackInput.addEventListener("input", function () {
    state.blackColor = blackInput.value;
    push();
  });
  blackLabel.appendChild(blackInput);
  panel.appendChild(blackLabel);

  // ── Mount & initial render ────────────────────────────────────────────────
  (document.getElementById("menu") || document.body).appendChild(panel);
  push();
})();
