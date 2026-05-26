// ── Active material key ───────────────────────────────────────
var _activeMaterialKey = "solid";

// ── Material presets ──────────────────────────────────────────
var MATERIAL_PRESETS = {
  solid: {
    label: "Solid",
    apply: function (color) {
      return new THREE.MeshPhongMaterial({ color: color, shininess: 60 });
    },
  },
  shiny: {
    label: "Shiny",
    apply: function (color) {
      return new THREE.MeshPhongMaterial({
        color: color,
        shininess: 220,
        specular: 0xffffff,
      });
    },
  },
  matte: {
    label: "Matte",
    apply: function (color) {
      return new THREE.MeshLambertMaterial({ color: color });
    },
  },
  metallic: {
    label: "Metallic",
    apply: function (color) {
      return new THREE.MeshPhongMaterial({
        color: color,
        shininess: 255,
        specular: 0xaaaaaa,
      });
    },
  },
  glass: {
    label: "Glass",
    apply: function (color) {
      return new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: 0.75,
        shininess: 200,
        specular: 0xffffff,
      });
    },
  },
  wireframe: {
    label: "Wireframe",
    apply: function (color) {
      return new THREE.MeshBasicMaterial({ color: color, wireframe: true });
    },
  },
};

// ── Override colorizeModel ────────────────────────────────────
colorizeModel = function (object, color) {
  var cloned = object.clone();
  var preset = MATERIAL_PRESETS[_activeMaterialKey] || MATERIAL_PRESETS.solid;
  var mat = preset.apply(color);
  cloned.traverse(function (child) {
    if (child.isMesh) child.material = mat.clone();
  });
  return cloned;
};

// ── Themes ────────────────────────────────────────────────────
var THEMES = {
  classic: {
    label: "Classic",
    whiteColor: 0xfaf0dc,
    blackColor: 0x222222,
    whiteSq: 0xffffff,
    blackSq: 0x222222,
    boardCol: 0x8b4513,
  },
  marble: {
    label: "Marble",
    whiteColor: 0xf5f5f0,
    blackColor: 0x2c2c2c,
    whiteSq: 0xe8e0d0,
    blackSq: 0x5a5a6a,
    boardCol: 0x3a3040,
  },
  forest: {
    label: "Forest",
    whiteColor: 0xd4e8c2,
    blackColor: 0x2d4a1e,
    whiteSq: 0xa8c880,
    blackSq: 0x3a5c28,
    boardCol: 0x5c3d1a,
  },
  lava: {
    label: "Lava",
    whiteColor: 0xffe0b0,
    blackColor: 0x330000,
    whiteSq: 0xffaa44,
    blackSq: 0x660000,
    boardCol: 0x1a0a00,
  },
  ocean: {
    label: "Ocean",
    whiteColor: 0xd0f0ff,
    blackColor: 0x0a2a4a,
    whiteSq: 0x88ccee,
    blackSq: 0x0d3a5c,
    boardCol: 0x052030,
  },
  gold: {
    label: "Gold",
    whiteColor: 0xfff4b0,
    blackColor: 0x5a3a00,
    whiteSq: 0xf0c040,
    blackSq: 0x8b5e00,
    boardCol: 0x3a2000,
  },
};

// Kept so ui.js doesn't crash (it iterates PIECE_STYLES for a dropdown)
var PIECE_STYLES = {
  default: { label: "Default" },
};

// ── Public API ────────────────────────────────────────────────

function applyTheme(themeKey) {
  var t = THEMES[themeKey];
  if (!t) return;
  currentWhitePieceColor = t.whiteColor;
  currentBlackPieceColor = t.blackColor;
  createChessBoard(t.whiteSq, t.blackSq, t.boardCol);
  refreshBoard3D();
}

function applyMaterialPreset(matKey) {
  if (!MATERIAL_PRESETS[matKey]) return;
  _activeMaterialKey = matKey;
  refreshBoard3D();
}
