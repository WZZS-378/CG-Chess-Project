// ui.js
// Plain controls panel. No fancy CSS.
// Must load AFTER pieces.js (needs PIECE_STYLES, MATERIAL_PRESETS, placePieces).

(function () {
  var state = {
    pieceStyle: "classic",
    material: "flat",
    whiteColor: "#faf0dc",
    blackColor: "#222222",
  };

  function hexToInt(h) {
    return parseInt(h.replace("#", ""), 16);
  }

  function push() {
    placePieces({
      pieceStyle: state.pieceStyle,
      material: state.material,
      whiteColor: hexToInt(state.whiteColor),
      blackColor: hexToInt(state.blackColor),
    });
  }

  // Panel wrapper
  var panel = document.createElement("div");
  panel.style.cssText = [
    "position:absolute",
    "top:10px",
    "left:10px",
    "background:rgba(0,0,0,0.72)",
    "color:#fff",
    "padding:10px 14px",
    "font:13px sans-serif",
    "border-radius:6px",
    "line-height:2.0",
    "z-index:10",
  ].join(";");

  function makeRow(label, el) {
    var wrap = document.createElement("div");
    var lbl = document.createElement("span");
    lbl.textContent = label + "\u00a0";
    wrap.appendChild(lbl);
    wrap.appendChild(el);
    return wrap;
  }

  function makeSelect(optionsObj, current, onChange) {
    var sel = document.createElement("select");
    sel.style.cssText =
      "background:#333;color:#fff;border:1px solid #666;padding:2px 4px;border-radius:3px";
    Object.keys(optionsObj).forEach(function (k) {
      var opt = document.createElement("option");
      opt.value = k;
      opt.textContent = optionsObj[k];
      if (k === current) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", function () {
      onChange(sel.value);
      push();
    });
    return sel;
  }

  function makeColor(value, key) {
    var inp = document.createElement("input");
    inp.type = "color";
    inp.value = value;
    inp.style.cssText =
      "width:38px;height:22px;border:none;border-radius:3px;cursor:pointer;vertical-align:middle";
    inp.addEventListener("input", function () {
      state[key] = inp.value;
      push();
    });
    return inp;
  }

  // Style dropdown — built from PIECE_STYLES
  var styleOptions = {};
  Object.keys(PIECE_STYLES).forEach(function (k) {
    styleOptions[k] = PIECE_STYLES[k].label;
  });
  panel.appendChild(
    makeRow(
      "Style:",
      makeSelect(styleOptions, state.pieceStyle, function (v) {
        state.pieceStyle = v;
      }),
    ),
  );

  // Material dropdown — built from MATERIAL_PRESETS
  var matOptions = {};
  Object.keys(MATERIAL_PRESETS).forEach(function (k) {
    matOptions[k] = MATERIAL_PRESETS[k].label;
  });
  panel.appendChild(
    makeRow(
      "Material:",
      makeSelect(matOptions, state.material, function (v) {
        state.material = v;
      }),
    ),
  );

  // Color pickers
  panel.appendChild(
    makeRow("White:", makeColor(state.whiteColor, "whiteColor")),
  );
  panel.appendChild(
    makeRow("Black:", makeColor(state.blackColor, "blackColor")),
  );

  // Mount
  (document.getElementById("menu") || document.body).appendChild(panel);

  // Initial placement
  push();
})();