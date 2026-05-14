// skybox-ui.js
// Skybox and background color controls
// Must load AFTER setup.js (needs setSkybox, setBackgroundColor, SKYBOX_CONFIG)

(function () {
  var state = {
    skybox: "none",
    backgroundColor: "#5bb1cd",
  };

  function hexToInt(h) {
    return parseInt(h.replace("#", ""), 16);
  }

  function intToHex(i) {
    return "#" + ("000000" + i.toString(16)).slice(-6);
  }

  // Panel wrapper - positioned on top-left
  var panel = document.createElement("div");
  panel.style.cssText = [
    "position:fixed",
    "top:10px",
    "left:10px",
    "background:rgba(0,0,0,0.8)",
    "color:#fff",
    "padding:12px 16px",
    "font:12px sans-serif",
    "border-radius:8px",
    "line-height:1.8",
    "z-index:10",
    "border:1px solid rgba(255,255,255,0.1)",
    "min-width:160px",
  ].join(";");

  function makeRow(label, el) {
    var wrap = document.createElement("div");
    wrap.style.cssText = [
      "display:flex",
      "align-items:center",
      "justify-content:space-between",
      "gap:12px",
      "width:100%",
      "box-sizing:border-box",
      "margin-bottom:6px",
    ].join(";");
    var lbl = document.createElement("span");
    lbl.textContent = label.replace(/\u00a0/g, "").trim();
    lbl.style.cssText = "flex:0 1 auto";
    wrap.appendChild(lbl);
    el.style.flexShrink = "0";
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
    });
    return sel;
  }

  function makeColor(value, onChange) {
    var inp = document.createElement("input");
    inp.type = "color";
    inp.value = value;
    inp.style.cssText =
      "width:38px;height:22px;border:none;border-radius:3px;cursor:pointer;vertical-align:middle";
    inp.addEventListener("input", function () {
      onChange(inp.value);
    });
    return inp;
  }

  // Skybox dropdown — built from SKYBOX_CONFIG
  var skyboxOptions = {};
  Object.keys(SKYBOX_CONFIG).forEach(function (k) {
    skyboxOptions[k] = SKYBOX_CONFIG[k].label;
  });

  // Add header title
  var header = document.createElement("div");
  header.style.cssText = "font-weight:bold;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:4px";
  header.textContent = "Environment";
  panel.appendChild(header);

  panel.appendChild(
    makeRow(
      "Skybox:",
      makeSelect(skyboxOptions, state.skybox, function (v) {
        state.skybox = v;
        setSkybox(v);
      }),
    ),
  );

  // Background color picker
  panel.appendChild(
    makeRow(
      "BG Color:",
      makeColor(state.backgroundColor, function (value) {
        state.backgroundColor = value;
        setBackgroundColor(hexToInt(value));
      }),
    ),
  );

  // Mount
  (document.getElementById("menu") || document.body).appendChild(panel);
})();
