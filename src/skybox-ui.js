// skybox-ui.js
// Skybox and background color controls
// Must load AFTER setup.js (needs setSkybox, setBackgroundColor, SKYBOX_CONFIG)

console.log("environment controls loaded");

// This will be called from ui.js and passed the main panel
window.buildEnvironmentUI = function (panel) {
  var state = {
    skybox: "none",
    backgroundColor: "#5bb1cd",
  };

  function hexToInt(h) {
    return parseInt(h.replace("#", ""), 16);
  }

  // ── Helpers (match your ui.js style) ───────────────────────
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

  function makeSelect(optionsObj, current, onChange) {
    var sel = document.createElement("select");
    sel.style.cssText =
      "padding:3px 6px;border-radius:3px;border:1px solid #999;font-size:13px";

    Object.keys(optionsObj).forEach(function (k) {
      var opt = document.createElement("option");
      opt.value = k;
      opt.textContent = optionsObj[k];
      if (k === current) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.addEventListener("change", function () {
      onChange(sel.value);
    });

    return sel;
  }

  function makeColor(value, onChange) {
    var inp = document.createElement("input");
    inp.type = "color";
    inp.value = value;
    inp.style.cssText =
      "width:40px;height:25px;border:none;border-radius:3px;cursor:pointer";

    inp.addEventListener("input", function () {
      onChange(inp.value);
    });

    return inp;
  }

  // ── Divider ───────────────────────────────────────────────
  var hr = document.createElement("hr");
  hr.style.cssText = "border:none;border-top:1px solid #bbb;margin:8px 0";
  panel.appendChild(hr);

  // ── Section Title ─────────────────────────────────────────
  var header = document.createElement("div");
  header.textContent = "Environment";
  header.style.cssText =
    "font-weight:bold;margin-bottom:6px;font-size:14px";
  panel.appendChild(header);

  // ── Skybox dropdown ───────────────────────────────────────
  var skyboxOptions = {};
  if (typeof SKYBOX_CONFIG !== "undefined") {
    Object.keys(SKYBOX_CONFIG).forEach(function (k) {
      skyboxOptions[k] = SKYBOX_CONFIG[k].label;
    });
  }

  panel.appendChild(
    makeRow(
      "Skybox:",
      makeSelect(skyboxOptions, state.skybox, function (v) {
        state.skybox = v;
        if (typeof setSkybox === "function") {
          setSkybox(v);
        }
      })
    )
  );

  // ── Background color ──────────────────────────────────────
  panel.appendChild(
    makeRow(
      "BG Color:",
      makeColor(state.backgroundColor, function (value) {
        state.backgroundColor = value;
        if (typeof setBackgroundColor === "function") {
          setBackgroundColor(hexToInt(value));
        }
      })
    )
  );
};