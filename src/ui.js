// ui.js — Piece theme + material controls
// Appends rows to the panel controls.js already built inside #menu.
// Calls applyTheme() and applyMaterialPreset() from pieces.js.

(function () {
  function init() {
    // Wait until controls.js panel and pieces.js globals are ready
    var menu = document.getElementById("menu");
    if (
      !menu ||
      !menu.firstChild ||
      typeof THEMES === "undefined" ||
      typeof MATERIAL_PRESETS === "undefined"
    ) {
      setTimeout(init, 100);
      return;
    }

    var panel = menu.firstChild;

    // ── Divider ───────────────────────────────────────────────
    var hr = document.createElement("hr");
    hr.style.cssText = "border:none;border-top:1px solid #bbb;margin:8px 0";
    panel.appendChild(hr);

    // ── Helper ────────────────────────────────────────────────
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
      // options: array of { value, label }
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

    // ── Theme dropdown ────────────────────────────────────────
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

    // ── Material dropdown ─────────────────────────────────────
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

  init();
})();
