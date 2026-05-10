var PIECE_STYLES = {
  // ── CLASSIC ──────────────────────────────────────────────────────────────
  classic: {
    label: "Classic",
    build: function (type, S) {
      switch (type) {
        case "pawn":
          return _latheGroup(
            [
              [0.3, 0.0],
              [0.3, 0.04],
              [0.22, 0.1],
              [0.16, 0.28],
              [0.12, 0.36],
              [0.16, 0.44],
              [0.18, 0.52],
              [0.14, 0.6],
              [0.0, 0.6],
            ],
            S,
            16,
          );
        case "rook":
          return _addBattlement(
            _latheGroup(
              [
                [0.26, 0.0],
                [0.26, 0.04],
                [0.18, 0.1],
                [0.14, 0.22],
                [0.12, 0.75],
                [0.2, 0.78],
                [0.2, 0.9],
              ],
              S,
              16,
            ),
            S,
            0.2,
            0.9,
          );
        case "knight":
          return _classicKnight(S);
        case "bishop":
          return _addBall(
            _latheGroup(
              [
                [0.26, 0.0],
                [0.26, 0.04],
                [0.18, 0.1],
                [0.13, 0.22],
                [0.08, 0.5],
                [0.05, 0.72],
                [0.07, 0.82],
                [0.04, 0.9],
                [0.0, 0.92],
              ],
              S,
              16,
            ),
            S * 0.06,
            0.92 * S,
          );
        case "queen":
          return _addCrown(
            _latheGroup(
              [
                [0.28, 0.0],
                [0.28, 0.04],
                [0.2, 0.1],
                [0.14, 0.22],
                [0.09, 0.52],
                [0.07, 0.72],
                [0.11, 0.82],
                [0.13, 0.92],
                [0.09, 0.98],
                [0.0, 1.0],
              ],
              S,
              16,
            ),
            S,
            1.0 * S,
            5,
          );
        case "king":
          return _addCross(
            _latheGroup(
              [
                [0.28, 0.0],
                [0.28, 0.04],
                [0.2, 0.1],
                [0.14, 0.22],
                [0.09, 0.52],
                [0.07, 0.72],
                [0.11, 0.82],
                [0.13, 0.94],
                [0.07, 1.0],
                [0.0, 1.02],
              ],
              S,
              16,
            ),
            S,
            1.02 * S,
          );
      }
    },
  },

  // ── LOW POLY ─────────────────────────────────────────────────────────────
  lowpoly: {
    label: "Low Poly",
    build: function (type, S) {
      switch (type) {
        case "pawn":
          return _lpPawn(S);
        case "rook":
          return _lpRook(S);
        case "knight":
          return _lpKnight(S);
        case "bishop":
          return _lpBishop(S);
        case "queen":
          return _lpQueen(S);
        case "king":
          return _lpKing(S);
      }
    },
  },

  // ── MILITARY ─────────────────────────────────────────────────────────────
  military: {
    label: "Military",
    build: function (type, S) {
      switch (type) {
        case "pawn":
          return _milPawn(S);
        case "rook":
          return _milRook(S);
        case "knight":
          return _milKnight(S);
        case "bishop":
          return _milBishop(S);
        case "queen":
          return _milQueen(S);
        case "king":
          return _milKing(S);
      }
    },
  },
};

// ---------------------------------------------------------------------------
// MATERIAL PRESETS
// key must match what controls.js sends as config.materialType
// ---------------------------------------------------------------------------
var MATERIAL_PRESETS = {
  flat: {
    label: "Flat",
    make: function (c) {
      return new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide });
    },
  },
  matte: {
    label: "Matte",
    make: function (c) {
      return new THREE.MeshLambertMaterial({
        color: c,
        side: THREE.DoubleSide,
      });
    },
  },
  shiny: {
    label: "Shiny",
    make: function (c) {
      return new THREE.MeshPhongMaterial({
        color: c,
        shininess: 80,
        side: THREE.DoubleSide,
      });
    },
  },
  wood: {
    label: "Wood",
    make: function (c) {
      return new THREE.MeshPhongMaterial({
        color: c,
        shininess: 20,
        side: THREE.DoubleSide,
      });
    },
  },
  metallic: {
    label: "Metallic",
    make: function (c) {
      return new THREE.MeshPhongMaterial({
        color: c,
        shininess: 240,
        specular: 0xffffff,
        side: THREE.DoubleSide,
      });
    },
  },
  glass: {
    label: "Glass",
    make: function (c) {
      return new THREE.MeshPhongMaterial({
        color: c,
        shininess: 200,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
    },
  },
};

// ---------------------------------------------------------------------------
// SHARED HELPERS
// ---------------------------------------------------------------------------

// Build a LatheGeometry group from fraction pairs [r, y] scaled by S
function _latheGroup(raw, S, segs) {
  var pts = raw.map(function (p) {
    return new THREE.Vector2(p[0] * S, p[1] * S);
  });
  var geo = new THREE.LatheGeometry(pts, segs || 12);
  var g = new THREE.Group();
  g.add(new THREE.Mesh(geo));
  return g;
}

// Add a capped sphere on top of a group
function _addBall(g, r, topY) {
  var m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8));
  m.position.y = topY + r;
  g.add(m);
  return g;
}

// Add battlement cubes around rim of a group (rook top)
function _addBattlement(g, S, rimR, topY) {
  var tY = topY * S;
  var w = S * 0.09,
    h = S * 0.11;
  // 4 merlons at corners
  [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ].forEach(function (d) {
    var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w));
    b.position.set(d[0] * rimR * S, tY + h / 2, d[1] * rimR * S);
    g.add(b);
  });
  // Flat disc to close the top
  var cap = new THREE.Mesh(
    new THREE.CylinderGeometry(rimR * S, rimR * S, S * 0.01, 16),
  );
  cap.position.y = tY;
  g.add(cap);
  return g;
}

// Add crown balls around top
function _addCrown(g, S, topY, count) {
  var r = S * 0.055;
  for (var i = 0; i < count; i++) {
    var a = (i / count) * Math.PI * 2;
    var b = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 6));
    b.position.set(Math.cos(a) * S * 0.09, topY + r, Math.sin(a) * S * 0.09);
    g.add(b);
  }
  return g;
}

// Add a cross on top (king)
function _addCross(g, S, topY) {
  var vH = S * 0.16,
    th = S * 0.034;
  var vBar = new THREE.Mesh(new THREE.BoxGeometry(th, vH, th));
  vBar.position.y = topY + vH / 2;
  g.add(vBar);
  var hBar = new THREE.Mesh(new THREE.BoxGeometry(S * 0.12, th, th));
  hBar.position.y = topY + vH * 0.6;
  g.add(hBar);
  return g;
}

// Classic knight: lathe base + box head
function _classicKnight(S) {
  var g = _latheGroup(
    [
      [0.26, 0.0],
      [0.26, 0.04],
      [0.18, 0.1],
      [0.13, 0.22],
      [0.0, 0.22],
    ],
    S,
    12,
  );
  var neck = new THREE.Mesh(
    new THREE.BoxGeometry(S * 0.13, S * 0.28, S * 0.17),
  );
  neck.position.set(0, S * 0.36, 0);
  g.add(neck);
  var head = new THREE.Mesh(new THREE.BoxGeometry(S * 0.2, S * 0.2, S * 0.26));
  head.position.set(S * 0.04, S * 0.57, 0);
  g.add(head);
  var snout = new THREE.Mesh(
    new THREE.BoxGeometry(S * 0.13, S * 0.09, S * 0.16),
  );
  snout.position.set(S * 0.1, S * 0.49, 0);
  g.add(snout);
  return g;
}

// ---------------------------------------------------------------------------
// LOW POLY HELPERS
// Uses 5–6 sided cylinders and boxes for a flat angular look
// ---------------------------------------------------------------------------
function _lpCylBase(S, r) {
  var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.18, S * 0.07, 5));
  m.position.y = S * 0.035;
  return m;
}

function _lpPawn(S) {
  var g = new THREE.Group();
  g.add(_lpCylBase(S, S * 0.2));
  var stem = new THREE.Mesh(
    new THREE.CylinderGeometry(S * 0.08, S * 0.15, S * 0.3, 5),
  );
  stem.position.y = S * 0.22;
  g.add(stem);
  var head = new THREE.Mesh(new THREE.SphereGeometry(S * 0.13, 5, 4));
  head.position.y = S * 0.49;
  g.add(head);
  return g;
}

function _lpRook(S) {
  var g = new THREE.Group();
  g.add(_lpCylBase(S, S * 0.22));
  var body = new THREE.Mesh(
    new THREE.CylinderGeometry(S * 0.15, S * 0.19, S * 0.52, 6),
  );
  body.position.y = S * 0.33;
  g.add(body);
  // Closed top slab
  var slab = new THREE.Mesh(new THREE.BoxGeometry(S * 0.38, S * 0.1, S * 0.38));
  slab.position.y = S * 0.63;
  g.add(slab);
  // 4 corner merlons
  [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ].forEach(function (d) {
    var b = new THREE.Mesh(new THREE.BoxGeometry(S * 0.11, S * 0.13, S * 0.11));
    b.position.set(d[0] * S * 0.14, S * 0.76, d[1] * S * 0.14);
    g.add(b);
  });
  return g;
}

function _lpKnight(S) {
  var g = new THREE.Group();
  g.add(_lpCylBase(S, S * 0.2));
  var body = new THREE.Mesh(
    new THREE.CylinderGeometry(S * 0.1, S * 0.16, S * 0.28, 5),
  );
  body.position.y = S * 0.21;
  g.add(body);
  var neck = new THREE.Mesh(
    new THREE.BoxGeometry(S * 0.13, S * 0.24, S * 0.17),
  );
  neck.position.set(0, S * 0.45, 0);
  g.add(neck);
  var head = new THREE.Mesh(
    new THREE.BoxGeometry(S * 0.21, S * 0.17, S * 0.25),
  );
  head.position.set(S * 0.05, S * 0.64, 0);
  g.add(head);
  return g;
}

function _lpBishop(S) {
  var g = new THREE.Group();
  g.add(_lpCylBase(S, S * 0.2));
  var body = new THREE.Mesh(
    new THREE.CylinderGeometry(S * 0.07, S * 0.16, S * 0.5, 5),
  );
  body.position.y = S * 0.32;
  g.add(body);
  var tip = new THREE.Mesh(new THREE.ConeGeometry(S * 0.07, S * 0.18, 5));
  tip.position.y = S * 0.66;
  g.add(tip);
  return g;
}

function _lpQueen(S) {
  var g = new THREE.Group();
  g.add(_lpCylBase(S, S * 0.24));
  var body = new THREE.Mesh(
    new THREE.CylinderGeometry(S * 0.09, S * 0.2, S * 0.57, 5),
  );
  body.position.y = S * 0.36;
  g.add(body);
  var crown = new THREE.Mesh(
    new THREE.CylinderGeometry(S * 0.18, S * 0.11, S * 0.12, 5),
  );
  crown.position.y = S * 0.71;
  g.add(crown);
  for (var i = 0; i < 5; i++) {
    var a = (i / 5) * Math.PI * 2;
    var pt = new THREE.Mesh(new THREE.ConeGeometry(S * 0.034, S * 0.11, 4));
    pt.position.set(Math.cos(a) * S * 0.13, S * 0.86, Math.sin(a) * S * 0.13);
    g.add(pt);
  }
  return g;
}

function _lpKing(S) {
  var g = new THREE.Group();
  g.add(_lpCylBase(S, S * 0.24));
  var body = new THREE.Mesh(
    new THREE.CylinderGeometry(S * 0.09, S * 0.2, S * 0.57, 5),
  );
  body.position.y = S * 0.36;
  g.add(body);
  var top = new THREE.Mesh(
    new THREE.CylinderGeometry(S * 0.13, S * 0.11, S * 0.09, 5),
  );
  top.position.y = S * 0.69;
  g.add(top);
  var vBar = new THREE.Mesh(
    new THREE.BoxGeometry(S * 0.055, S * 0.2, S * 0.055),
  );
  vBar.position.y = S * 0.84;
  g.add(vBar);
  var hBar = new THREE.Mesh(
    new THREE.BoxGeometry(S * 0.15, S * 0.055, S * 0.055),
  );
  hBar.position.y = S * 0.91;
  g.add(hBar);
  return g;
}

// ---------------------------------------------------------------------------
// MILITARY HELPERS
// ---------------------------------------------------------------------------
function _milBase(S) {
  var b = new THREE.Mesh(new THREE.BoxGeometry(S * 0.46, S * 0.06, S * 0.46));
  b.position.y = S * 0.03;
  return b;
}

function _milPawn(S) {
  var g = new THREE.Group();
  g.add(_milBase(S));
  var body = new THREE.Mesh(
    new THREE.CylinderGeometry(S * 0.13, S * 0.17, S * 0.36, 8),
  );
  body.position.y = S * 0.24;
  g.add(body);
  // Helmet dome (closed sphere top half)
  var dome = new THREE.Mesh(
    new THREE.SphereGeometry(S * 0.15, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55),
  );
  dome.position.y = S * 0.49;
  g.add(dome);
  return g;
}

function _milRook(S) {
  // Tank/bunker
  var g = new THREE.Group();
  g.add(_milBase(S));
  var hull = new THREE.Mesh(
    new THREE.BoxGeometry(S * 0.38, S * 0.44, S * 0.38),
  );
  hull.position.y = S * 0.28;
  g.add(hull);
  // Close hull top with a slab
  var hullTop = new THREE.Mesh(
    new THREE.BoxGeometry(S * 0.38, S * 0.02, S * 0.38),
  );
  hullTop.position.y = S * 0.51;
  g.add(hullTop);
  var turret = new THREE.Mesh(
    new THREE.CylinderGeometry(S * 0.17, S * 0.19, S * 0.14, 8),
  );
  turret.position.y = S * 0.59;
  g.add(turret);
  // Close turret top
  var turretTop = new THREE.Mesh(
    new THREE.CylinderGeometry(S * 0.17, S * 0.17, S * 0.01, 8),
  );
  turretTop.position.y = S * 0.665;
  g.add(turretTop);
  // Barrel
  var barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(S * 0.035, S * 0.035, S * 0.28, 6),
  );
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(S * 0.23, S * 0.59, 0);
  g.add(barrel);
  return g;
}

function _milKnight(S) {
  // Armoured jeep silhouette
  var g = new THREE.Group();
  g.add(_milBase(S));
  var hull = new THREE.Mesh(
    new THREE.BoxGeometry(S * 0.36, S * 0.28, S * 0.44),
  );
  hull.position.y = S * 0.2;
  g.add(hull);
  var hullTop = new THREE.Mesh(
    new THREE.BoxGeometry(S * 0.36, S * 0.02, S * 0.44),
  );
  hullTop.position.y = S * 0.35;
  g.add(hullTop);
  var cab = new THREE.Mesh(new THREE.BoxGeometry(S * 0.28, S * 0.2, S * 0.32));
  cab.position.set(S * 0.04, S * 0.46, 0);
  g.add(cab);
  var cabTop = new THREE.Mesh(
    new THREE.BoxGeometry(S * 0.28, S * 0.02, S * 0.32),
  );
  cabTop.position.set(S * 0.04, S * 0.57, 0);
  g.add(cabTop);
  // Antenna
  var ant = new THREE.Mesh(
    new THREE.CylinderGeometry(S * 0.018, S * 0.018, S * 0.28, 4),
  );
  ant.position.set(-S * 0.1, S * 0.72, S * 0.08);
  g.add(ant);
  return g;
}

function _milBishop(S) {
  // Missile / rocket
  var g = new THREE.Group();
  g.add(_milBase(S));
  var body = new THREE.Mesh(
    new THREE.CylinderGeometry(S * 0.11, S * 0.13, S * 0.55, 8),
  );
  body.position.y = S * 0.33;
  g.add(body);
  var nose = new THREE.Mesh(new THREE.ConeGeometry(S * 0.11, S * 0.2, 8));
  nose.position.y = S * 0.71;
  g.add(nose);
  // Fins
  for (var i = 0; i < 4; i++) {
    var a = (i / 4) * Math.PI * 2;
    var fin = new THREE.Mesh(
      new THREE.BoxGeometry(S * 0.034, S * 0.14, S * 0.1),
    );
    fin.position.set(Math.cos(a) * S * 0.13, S * 0.15, Math.sin(a) * S * 0.13);
    fin.rotation.y = a;
    g.add(fin);
  }
  return g;
}

function _milQueen(S) {
  // Command tower with radar dish
  var g = new THREE.Group();
  g.add(_milBase(S));
  var tower = new THREE.Mesh(
    new THREE.CylinderGeometry(S * 0.15, S * 0.19, S * 0.6, 8),
  );
  tower.position.y = S * 0.36;
  g.add(tower);
  var platform = new THREE.Mesh(
    new THREE.CylinderGeometry(S * 0.22, S * 0.16, S * 0.07, 8),
  );
  platform.position.y = S * 0.7;
  g.add(platform);
  // Radar dish (inverted dome)
  var dish = new THREE.Mesh(
    new THREE.SphereGeometry(S * 0.15, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5),
  );
  dish.rotation.x = Math.PI;
  dish.position.y = S * 0.79;
  g.add(dish);
  var mast = new THREE.Mesh(
    new THREE.CylinderGeometry(S * 0.018, S * 0.018, S * 0.17, 4),
  );
  mast.position.y = S * 0.95;
  g.add(mast);
  return g;
}

function _milKing(S) {
  // Command HQ building
  var g = new THREE.Group();
  g.add(_milBase(S));
  var body = new THREE.Mesh(new THREE.BoxGeometry(S * 0.4, S * 0.5, S * 0.4));
  body.position.y = S * 0.31;
  g.add(body);
  var roof = new THREE.Mesh(new THREE.BoxGeometry(S * 0.4, S * 0.02, S * 0.4));
  roof.position.y = S * 0.57;
  g.add(roof);
  var tower = new THREE.Mesh(
    new THREE.BoxGeometry(S * 0.16, S * 0.24, S * 0.16),
  );
  tower.position.y = S * 0.69;
  g.add(tower);
  var towerTop = new THREE.Mesh(
    new THREE.BoxGeometry(S * 0.16, S * 0.02, S * 0.16),
  );
  towerTop.position.y = S * 0.82;
  g.add(towerTop);
  var pole = new THREE.Mesh(
    new THREE.CylinderGeometry(S * 0.018, S * 0.018, S * 0.24, 4),
  );
  pole.position.y = S * 0.95;
  g.add(pole);
  var flag = new THREE.Mesh(
    new THREE.BoxGeometry(S * 0.16, S * 0.09, S * 0.02),
  );
  flag.position.set(S * 0.1, S * 1.01, 0);
  g.add(flag);
  return g;
}

// ---------------------------------------------------------------------------
// Apply material to every mesh inside a group
// ---------------------------------------------------------------------------
function _applyMat(group, mat) {
  group.traverse(function (obj) {
    if (obj.isMesh) obj.material = mat;
  });
}

// ---------------------------------------------------------------------------
// Lights — needed for anything other than MeshBasicMaterial (flat)
// ---------------------------------------------------------------------------
var _lights = [];
function _ensureLights() {
  if (_lights.length) return;
  var amb = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(amb);
  _lights.push(amb);
  var dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(4, 10, 5);
  scene.add(dir);
  _lights.push(dir);
  var dir2 = new THREE.DirectionalLight(0xffffff, 0.35);
  dir2.position.set(-5, 6, -4);
  scene.add(dir2);
  _lights.push(dir2);
}
function _removeLights() {
  _lights.forEach(function (l) {
    scene.remove(l);
  });
  _lights = [];
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------
var _groups = [];

function clearPieces() {
  _groups.forEach(function (g) {
    scene.remove(g);
  });
  _groups = [];
  _removeLights();
}

// config keys:
//   pieceStyle  — 'classic' | 'lowpoly' | 'military'
//   materialType — 'flat' | 'matte' | 'shiny' | 'wood' | 'metallic' | 'glass'
//   whiteColor, blackColor — hex integers e.g. 0xfaf0dc
function placePieces(config) {
  clearPieces();

  var c = config || {};
  var styleKey = c.pieceStyle || "classic";
  var matKey = c.materialType || "flat";
  var whiteColor = c.whiteColor !== undefined ? c.whiteColor : 0xfaf0dc;
  var blackColor = c.blackColor !== undefined ? c.blackColor : 0x222222;

  var style = PIECE_STYLES[styleKey] || PIECE_STYLES.classic;
  var matPreset = MATERIAL_PRESETS[matKey] || MATERIAL_PRESETS.flat;

  if (matKey !== "flat") _ensureLights();

  var S = squareSize;
  var half = boardSize / 2;
  var startX = -(half - S * 0.5);
  var backRow = [
    "rook",
    "knight",
    "bishop",
    "queen",
    "king",
    "bishop",
    "knight",
    "rook",
  ];

  var sides = [
    { color: whiteColor, backZ: -(half - S * 0.5), pawnZ: -(half - S * 1.5) },
    { color: blackColor, backZ: half - S * 0.5, pawnZ: half - S * 1.5 },
  ];

  sides.forEach(function (side) {
    var group = new THREE.Group();
    var mat = matPreset.make(side.color);

    backRow.forEach(function (type, col) {
      var piece = style.build(type, S);
      _applyMat(piece, mat);
      piece.position.set(startX + col * S, 0, side.backZ);
      group.add(piece);
    });

    for (var col = 0; col < 8; col++) {
      var pawn = style.build("pawn", S);
      _applyMat(pawn, mat);
      pawn.position.set(startX + col * S, 0, side.pawnZ);
      group.add(pawn);
    }

    scene.add(group);
    _groups.push(group);
  });
}
