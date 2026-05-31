// =============================================================
//  pieces.js
//  - MATERIAL_PRESETS: overrides colorizeModel from build.js
//  - PIECE_STYLES: procedural Three.js geometry per style
//  - THEMES: color + board presets
//  - applyPieceStyle(): swaps modelCache with procedural meshes
//  - applyTheme(), applyMaterialPreset(): public API
// =============================================================

// ── Active keys ───────────────────────────────────────────────
var _activeMaterialKey = "solid";
var _activePieceStyle = "classic";

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

// ── Procedural geometry builders ──────────────────────────────
// Each builder returns a THREE.Group with Y=0 at base, scaled to
// fit within ~1 unit. refreshBoard3D then scales by 0.18 on top.
// We build at ~5-6 units tall so after 0.18 scale = ~1 unit on board.

function makeLatheMesh(points, segs) {
  var pts = points.map(function (p) {
    return new THREE.Vector2(p[0], p[1]);
  });
  return new THREE.LatheGeometry(pts, segs || 16);
}

function wrapGeo(geo) {
  // Returns a Group containing a Mesh — matches the wrapper pattern build.js expects
  var mesh = new THREE.Mesh(
    geo,
    new THREE.MeshPhongMaterial({ color: 0xffffff }),
  );
  var wrapper = new THREE.Group();
  wrapper.add(mesh);
  return wrapper;
}

function addGeo(group, geo, x, y, z) {
  var mesh = new THREE.Mesh(
    geo,
    new THREE.MeshPhongMaterial({ color: 0xffffff }),
  );
  mesh.position.set(x || 0, y || 0, z || 0);
  group.add(mesh);
}

// ── CLASSIC style (lathe — traditional chess silhouettes) ──────

var CLASSIC_PROFILES = {
  pawn: [
    [0, 0],
    [1.4, 0],
    [1.5, 0.2],
    [1.1, 1.5],
    [0.8, 2.0],
    [1.1, 2.5],
    [1.1, 3.0],
    [0.7, 3.3],
    [0.9, 3.7],
    [1.3, 4.3],
    [0.9, 4.9],
    [0.3, 5.4],
    [0, 5.6],
  ],
  rook: [
    [0, 0],
    [1.6, 0],
    [1.7, 0.2],
    [1.3, 1.0],
    [1.1, 1.5],
    [1.1, 4.8],
    [1.4, 4.8],
    [1.4, 6.0],
    [0, 6.0],
  ],
  knight: [
    [0, 0],
    [1.6, 0],
    [1.7, 0.2],
    [1.3, 1.0],
    [1.1, 1.5],
    [1.0, 3.0],
    [0.9, 3.5],
    [0.7, 4.5],
    [1.0, 5.0],
    [1.0, 5.5],
    [0.8, 6.2],
    [0.4, 6.7],
    [0, 6.9],
  ],
  bishop: [
    [0, 0],
    [1.6, 0],
    [1.7, 0.2],
    [1.3, 1.0],
    [1.1, 1.5],
    [0.7, 3.0],
    [0.5, 4.0],
    [0.7, 4.5],
    [0.7, 5.0],
    [0.4, 5.5],
    [0.5, 6.0],
    [0.3, 6.8],
    [0.15, 7.3],
    [0, 7.5],
  ],
  queen: [
    [0, 0],
    [1.8, 0],
    [1.9, 0.2],
    [1.5, 1.0],
    [1.2, 1.5],
    [1.0, 3.0],
    [0.8, 4.0],
    [1.0, 4.5],
    [1.1, 5.0],
    [0.9, 5.3],
    [0.7, 5.8],
    [0.9, 6.3],
    [1.0, 6.8],
    [0.8, 7.0],
    [0.6, 7.3],
    [0.4, 7.6],
    [0.2, 7.8],
    [0, 8.0],
  ],
  king: [
    [0, 0],
    [1.8, 0],
    [1.9, 0.2],
    [1.5, 1.0],
    [1.2, 1.5],
    [1.0, 3.0],
    [0.8, 4.0],
    [1.1, 4.5],
    [1.2, 5.0],
    [1.0, 5.5],
    [0.8, 6.0],
    [1.0, 6.5],
    [1.1, 7.0],
    [0.9, 7.5],
    [0.5, 8.0],
    [0.3, 8.3],
    [0, 8.5],
  ],
};

function buildClassicPiece(type) {
  var profile = CLASSIC_PROFILES[type];
  var group = new THREE.Group();
  var geo = makeLatheMesh(profile, 20);
  var mesh = new THREE.Mesh(
    geo,
    new THREE.MeshPhongMaterial({ color: 0xffffff }),
  );
  group.add(mesh);

  // King cross
  if (type === "king") {
    addGeo(group, new THREE.BoxGeometry(0.25, 1.8, 0.25), 0, 9.3, 0);
    addGeo(group, new THREE.BoxGeometry(1.1, 0.25, 0.25), 0, 10.0, 0);
  }
  // Bishop ball
  if (type === "bishop") {
    addGeo(group, new THREE.SphereGeometry(0.35, 10, 10), 0, 7.85, 0);
  }
  // Rook battlements
  if (type === "rook") {
    [-0.6, 0, 0.6].forEach(function (x) {
      addGeo(group, new THREE.BoxGeometry(0.5, 0.8, 0.5), x, 6.4, 0);
    });
  }
  return group;
}

// ── MEDIEVAL style (blocky, architectural) ─────────────────────

function buildMedievalPiece(type) {
  var group = new THREE.Group();

  // Shared base: flat cylinder
  addGeo(group, new THREE.CylinderGeometry(1.6, 1.8, 0.4, 8), 0, 0.2, 0);
  addGeo(group, new THREE.CylinderGeometry(1.2, 1.6, 0.3, 8), 0, 0.55, 0);

  if (type === "pawn") {
    addGeo(group, new THREE.CylinderGeometry(0.9, 1.2, 2.5, 8), 0, 1.95, 0);
    addGeo(group, new THREE.SphereGeometry(1.0, 8, 8), 0, 3.7, 0);
  } else if (type === "rook") {
    // Castle tower
    addGeo(group, new THREE.CylinderGeometry(1.3, 1.3, 4.0, 4), 0, 2.7, 0);
    // Four battlements on corners
    [
      [-1, 0, -1],
      [1, 0, -1],
      [-1, 0, 1],
      [1, 0, 1],
    ].forEach(function (p) {
      addGeo(group, new THREE.BoxGeometry(0.7, 1.0, 0.7), p[0], 5.2, p[2]);
    });
  } else if (type === "knight") {
    addGeo(group, new THREE.CylinderGeometry(1.0, 1.3, 3.0, 6), 0, 2.2, 0);
    addGeo(group, new THREE.BoxGeometry(1.4, 2.2, 1.0), 0, 4.7, 0.3);
    addGeo(group, new THREE.BoxGeometry(0.8, 0.6, 1.4), 0.3, 5.9, 0); // snout
  } else if (type === "bishop") {
    // Tall pointed tower with pointed top
    addGeo(group, new THREE.CylinderGeometry(1.1, 1.3, 4.5, 6), 0, 3.0, 0);
    addGeo(group, new THREE.ConeGeometry(1.1, 2.2, 6), 0, 6.4, 0);
  } else if (type === "queen") {
    addGeo(group, new THREE.CylinderGeometry(1.3, 1.5, 4.5, 8), 0, 3.0, 0);
    // Crown ring
    addGeo(group, new THREE.TorusGeometry(1.1, 0.25, 6, 12), 0, 5.5, 0);
    // Crown points
    for (var i = 0; i < 5; i++) {
      var a = (i / 5) * Math.PI * 2;
      addGeo(
        group,
        new THREE.ConeGeometry(0.25, 1.0, 5),
        Math.cos(a) * 1.1,
        6.3,
        Math.sin(a) * 1.1,
      );
    }
  } else if (type === "king") {
    addGeo(group, new THREE.CylinderGeometry(1.4, 1.6, 4.8, 8), 0, 3.1, 0);
    addGeo(group, new THREE.CylinderGeometry(1.5, 1.4, 0.4, 8), 0, 5.7, 0);
    // Cross on top
    addGeo(group, new THREE.BoxGeometry(0.35, 2.2, 0.35), 0, 7.1, 0);
    addGeo(group, new THREE.BoxGeometry(1.4, 0.35, 0.35), 0, 7.9, 0);
  }

  return group;
}

// ── FUTURISTIC style (angular, sci-fi) ────────────────────────

function buildFuturisticPiece(type) {
  var group = new THREE.Group();

  // Shared hexagonal base
  addGeo(group, new THREE.CylinderGeometry(1.7, 1.9, 0.3, 6), 0, 0.15, 0);
  addGeo(group, new THREE.CylinderGeometry(1.1, 1.7, 0.25, 6), 0, 0.48, 0);

  if (type === "pawn") {
    addGeo(group, new THREE.CylinderGeometry(0.6, 1.1, 2.2, 6), 0, 1.7, 0);
    addGeo(group, new THREE.OctahedronGeometry(0.9), 0, 3.4, 0);
  } else if (type === "rook") {
    addGeo(group, new THREE.BoxGeometry(2.0, 4.0, 2.0), 0, 2.6, 0);
    addGeo(group, new THREE.BoxGeometry(2.4, 0.4, 2.4), 0, 4.8, 0);
    // Antenna
    addGeo(group, new THREE.CylinderGeometry(0.15, 0.15, 1.5, 6), 0, 5.75, 0);
  } else if (type === "knight") {
    addGeo(group, new THREE.CylinderGeometry(0.9, 1.1, 2.8, 6), 0, 1.9, 0);
    // Angular head
    addGeo(group, new THREE.BoxGeometry(1.6, 1.6, 1.0), 0, 3.9, 0);
    addGeo(group, new THREE.BoxGeometry(1.0, 0.8, 1.6), 0.4, 4.8, 0.2);
    addGeo(group, new THREE.TetrahedronGeometry(0.5), 0, 5.6, 0);
  } else if (type === "bishop") {
    addGeo(group, new THREE.CylinderGeometry(0.5, 1.1, 4.5, 6), 0, 2.9, 0);
    addGeo(group, new THREE.OctahedronGeometry(0.8), 0, 5.5, 0);
    addGeo(group, new THREE.CylinderGeometry(0.15, 0.15, 1.2, 6), 0, 6.7, 0);
  } else if (type === "queen") {
    addGeo(group, new THREE.CylinderGeometry(0.7, 1.2, 4.8, 6), 0, 3.1, 0);
    addGeo(group, new THREE.OctahedronGeometry(1.2), 0, 5.9, 0);
    // Spikes
    for (var i = 0; i < 6; i++) {
      var a = (i / 6) * Math.PI * 2;
      addGeo(
        group,
        new THREE.ConeGeometry(0.2, 1.2, 4),
        Math.cos(a) * 1.0,
        6.8,
        Math.sin(a) * 1.0,
      );
    }
  } else if (type === "king") {
    addGeo(group, new THREE.CylinderGeometry(0.8, 1.3, 5.0, 6), 0, 3.2, 0);
    addGeo(group, new THREE.BoxGeometry(1.8, 0.4, 1.8), 0, 6.0, 0);
    addGeo(group, new THREE.BoxGeometry(0.4, 2.5, 0.4), 0, 7.25, 0);
    addGeo(group, new THREE.BoxGeometry(1.6, 0.4, 0.4), 0, 8.0, 0);
  }

  return group;
}

// ── MINIMAL style (pure primitive shapes) ─────────────────────

function buildMinimalPiece(type) {
  var group = new THREE.Group();

  // All pieces share a disc base
  addGeo(group, new THREE.CylinderGeometry(1.5, 1.5, 0.25, 32), 0, 0.13, 0);

  if (type === "pawn") {
    addGeo(group, new THREE.CylinderGeometry(0.55, 0.9, 2.4, 32), 0, 1.45, 0);
    addGeo(group, new THREE.SphereGeometry(0.75, 16, 16), 0, 3.1, 0);
  } else if (type === "rook") {
    addGeo(group, new THREE.CylinderGeometry(0.9, 0.9, 4.2, 4), 0, 2.35, 0);
    addGeo(group, new THREE.CylinderGeometry(1.1, 0.9, 0.4, 4), 0, 4.65, 0);
  } else if (type === "knight") {
    addGeo(group, new THREE.CylinderGeometry(0.7, 0.9, 3.0, 32), 0, 1.75, 0);
    addGeo(group, new THREE.BoxGeometry(1.1, 1.8, 0.7), 0, 3.9, 0);
  } else if (type === "bishop") {
    addGeo(group, new THREE.CylinderGeometry(0.3, 0.9, 4.8, 32), 0, 2.65, 0);
    addGeo(group, new THREE.SphereGeometry(0.45, 16, 16), 0, 5.3, 0);
  } else if (type === "queen") {
    addGeo(group, new THREE.CylinderGeometry(0.55, 1.0, 5.2, 32), 0, 2.85, 0);
    addGeo(group, new THREE.TorusGeometry(0.65, 0.22, 8, 20), 0, 5.6, 0);
    addGeo(group, new THREE.SphereGeometry(0.4, 16, 16), 0, 6.2, 0);
  } else if (type === "king") {
    addGeo(group, new THREE.CylinderGeometry(0.6, 1.0, 5.5, 32), 0, 3.0, 0);
    addGeo(group, new THREE.BoxGeometry(0.3, 2.0, 0.3), 0, 6.7, 0);
    addGeo(group, new THREE.BoxGeometry(1.2, 0.3, 0.3), 0, 7.4, 0);
  }

  return group;
}

// ── MILITARY style (army/war themed) ──────────────────────────
// Pawn = soldier with helmet, Rook = tank, Knight = jeep/humvee,
// Bishop = sniper/rifle, Queen = commander, King = general

function buildMilitaryPiece(type) {
  var group = new THREE.Group();

  // Shared base plate (dog-tag style flat rectangle base)
  addGeo(group, new THREE.BoxGeometry(2.8, 0.2, 2.8), 0, 0.1, 0);
  addGeo(group, new THREE.BoxGeometry(2.2, 0.15, 2.2), 0, 0.28, 0);

  if (type === "pawn") {
    // Soldier — cylindrical body, helmet on top
    addGeo(group, new THREE.CylinderGeometry(0.7, 0.9, 2.2, 8), 0, 1.5, 0);
    // Torso detail — slight shoulder flare
    addGeo(group, new THREE.CylinderGeometry(0.9, 0.7, 0.3, 8), 0, 2.75, 0);
    // Neck
    addGeo(group, new THREE.CylinderGeometry(0.4, 0.5, 0.4, 8), 0, 3.1, 0);
    // Helmet — dome with flat brim
    addGeo(
      group,
      new THREE.SphereGeometry(0.75, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
      0,
      3.55,
      0,
    );
    addGeo(group, new THREE.CylinderGeometry(0.9, 0.85, 0.12, 12), 0, 3.38, 0);
  } else if (type === "rook") {
    // Tank — wide low hull, turret on top, barrel sticking out
    // Hull
    addGeo(group, new THREE.BoxGeometry(2.6, 1.0, 2.2), 0, 0.85, 0);
    // Upper hull slope
    addGeo(group, new THREE.BoxGeometry(2.2, 0.5, 1.8), 0, 1.6, 0);
    // Turret dome
    addGeo(group, new THREE.CylinderGeometry(1.0, 1.1, 0.7, 10), 0, 2.15, 0);
    addGeo(
      group,
      new THREE.SphereGeometry(1.0, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5),
      0,
      2.5,
      0,
    );
    // Gun barrel
    addGeo(group, new THREE.CylinderGeometry(0.18, 0.22, 2.8, 8), 0, 2.5, 1.4);
    // Barrel tip cap
    addGeo(group, new THREE.CylinderGeometry(0.28, 0.18, 0.2, 8), 0, 2.5, 2.9);
    // Track bumps (left/right side details)
    addGeo(group, new THREE.BoxGeometry(0.3, 0.6, 2.2), -1.35, 0.65, 0);
    addGeo(group, new THREE.BoxGeometry(0.3, 0.6, 2.2), 1.35, 0.65, 0);
  } else if (type === "knight") {
    // Jeep / Humvee — boxy body, windscreen, wheels suggested
    // Chassis
    addGeo(group, new THREE.BoxGeometry(2.4, 0.5, 2.0), 0, 0.65, 0);
    // Body
    addGeo(group, new THREE.BoxGeometry(2.2, 0.9, 1.8), 0, 1.3, 0);
    // Cab / rollcage top
    addGeo(group, new THREE.BoxGeometry(1.6, 0.7, 1.5), 0, 2.15, -0.1);
    // Windscreen angle (thin flat box tilted)
    var wscreen = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.05, 0.8),
      new THREE.MeshPhongMaterial({ color: 0xffffff }),
    );
    wscreen.position.set(0, 1.9, 0.75);
    wscreen.rotation.x = -0.6;
    group.add(wscreen);
    // Hood front
    addGeo(group, new THREE.BoxGeometry(2.0, 0.6, 0.7), 0, 1.1, 1.1);
    // Wheels (4 cylinders)
    [
      [-1.1, 0.5, 0.8],
      [1.1, 0.5, 0.8],
      [-1.1, 0.5, -0.8],
      [1.1, 0.5, -0.8],
    ].forEach(function (p) {
      var wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.28, 10),
        new THREE.MeshPhongMaterial({ color: 0xffffff }),
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(p[0], p[1], p[2]);
      group.add(wheel);
    });
    // Spare wheel on back
    var spare = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.22, 10),
      new THREE.MeshPhongMaterial({ color: 0xffffff }),
    );
    spare.rotation.x = Math.PI / 2;
    spare.position.set(0, 1.3, -1.1);
    group.add(spare);
  } else if (type === "bishop") {
    // Sniper — thin tall body, long rifle barrel angled up
    addGeo(group, new THREE.CylinderGeometry(0.6, 0.85, 2.8, 8), 0, 1.7, 0);
    // Shoulders
    addGeo(group, new THREE.BoxGeometry(1.8, 0.3, 0.8), 0, 3.2, 0);
    // Head
    addGeo(group, new THREE.SphereGeometry(0.55, 8, 8), 0, 3.85, 0);
    // Sniper helmet / beret
    addGeo(group, new THREE.CylinderGeometry(0.62, 0.58, 0.22, 10), 0, 4.25, 0);
    // Rifle — long barrel angled up at 30 deg
    var rifle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.13, 3.5, 6),
      new THREE.MeshPhongMaterial({ color: 0xffffff }),
    );
    rifle.rotation.z = -Math.PI / 6;
    rifle.position.set(0.7, 3.0, 0);
    group.add(rifle);
    // Scope on rifle
    var scope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.8, 6),
      new THREE.MeshPhongMaterial({ color: 0xffffff }),
    );
    scope.rotation.z = -Math.PI / 6;
    scope.position.set(0.5, 3.3, 0);
    group.add(scope);
    // Stock
    addGeo(group, new THREE.BoxGeometry(0.2, 0.3, 0.5), -0.2, 2.6, 0);
  } else if (type === "queen") {
    // Commander — tall, medals on chest, peaked cap
    addGeo(group, new THREE.CylinderGeometry(0.8, 1.0, 3.2, 8), 0, 1.95, 0);
    // Belt / sash detail
    addGeo(group, new THREE.CylinderGeometry(0.82, 0.82, 0.18, 8), 0, 2.0, 0);
    // Chest medals row
    [-0.4, 0, 0.4].forEach(function (x) {
      addGeo(
        group,
        new THREE.CylinderGeometry(0.12, 0.12, 0.08, 6),
        x,
        2.8,
        0.78,
      );
    });
    // Shoulders (epaulettes)
    addGeo(group, new THREE.BoxGeometry(2.4, 0.22, 0.7), 0, 3.6, 0);
    addGeo(group, new THREE.CylinderGeometry(0.3, 0.3, 0.5, 6), -1.1, 3.45, 0);
    addGeo(group, new THREE.CylinderGeometry(0.3, 0.3, 0.5, 6), 1.1, 3.45, 0);
    // Neck
    addGeo(group, new THREE.CylinderGeometry(0.38, 0.45, 0.4, 8), 0, 3.95, 0);
    // Head
    addGeo(group, new THREE.SphereGeometry(0.6, 10, 8), 0, 4.65, 0);
    // Peaked cap — brim + dome
    addGeo(group, new THREE.CylinderGeometry(0.65, 0.62, 0.45, 10), 0, 5.17, 0);
    addGeo(group, new THREE.CylinderGeometry(0.88, 0.65, 0.12, 12), 0, 5.0, 0);
    // Cap peak (visor)
    var visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.08, 0.4),
      new THREE.MeshPhongMaterial({ color: 0xffffff }),
    );
    visor.position.set(0, 5.0, 0.7);
    visor.rotation.x = 0.25;
    group.add(visor);
    // Star badge on cap
    addGeo(group, new THREE.OctahedronGeometry(0.18), 0, 5.5, 0);
  } else if (type === "king") {
    // General — biggest, full dress uniform, 4-star cap, baton
    addGeo(group, new THREE.CylinderGeometry(0.9, 1.15, 3.5, 8), 0, 2.1, 0);
    // Belt
    addGeo(group, new THREE.CylinderGeometry(0.92, 0.92, 0.2, 8), 0, 2.1, 0);
    // Chest medals (two rows)
    [-0.5, 0, 0.5].forEach(function (x) {
      addGeo(
        group,
        new THREE.CylinderGeometry(0.13, 0.13, 0.08, 6),
        x,
        3.0,
        0.84,
      );
      addGeo(
        group,
        new THREE.CylinderGeometry(0.13, 0.13, 0.08, 6),
        x,
        2.6,
        0.84,
      );
    });
    // Epaulettes (wide general-grade)
    addGeo(group, new THREE.BoxGeometry(2.8, 0.25, 0.9), 0, 3.95, 0);
    addGeo(
      group,
      new THREE.CylinderGeometry(0.38, 0.38, 0.55, 6),
      -1.35,
      3.75,
      0,
    );
    addGeo(
      group,
      new THREE.CylinderGeometry(0.38, 0.38, 0.55, 6),
      1.35,
      3.75,
      0,
    );
    // Neck
    addGeo(group, new THREE.CylinderGeometry(0.42, 0.5, 0.45, 8), 0, 4.35, 0);
    // Head
    addGeo(group, new THREE.SphereGeometry(0.68, 10, 8), 0, 5.1, 0);
    // Peaked cap
    addGeo(group, new THREE.CylinderGeometry(0.72, 0.68, 0.5, 10), 0, 5.72, 0);
    addGeo(group, new THREE.CylinderGeometry(1.0, 0.72, 0.14, 12), 0, 5.53, 0);
    var visorK = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.09, 0.45),
      new THREE.MeshPhongMaterial({ color: 0xffffff }),
    );
    visorK.position.set(0, 5.53, 0.8);
    visorK.rotation.x = 0.25;
    group.add(visorK);
    // 4 stars on cap
    for (var s = 0; s < 4; s++) {
      var sa = (s / 4) * Math.PI * 2 + Math.PI / 8;
      addGeo(
        group,
        new THREE.OctahedronGeometry(0.14),
        Math.cos(sa) * 0.38,
        5.95,
        Math.sin(sa) * 0.38,
      );
    }
    // Baton (held to side)
    var baton = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 1.6, 6),
      new THREE.MeshPhongMaterial({ color: 0xffffff }),
    );
    baton.rotation.z = 0.5;
    baton.position.set(1.1, 2.5, 0.3);
    group.add(baton);
    addGeo(group, new THREE.SphereGeometry(0.16, 6, 6), 1.75, 2.85, 0.22);
  }

  return group;
}

// ── Fix voxel knight — hand-built horse head from boxes ────────
// The lathe profile approach just makes a generic rounded lump.
// This builds a recognisable side-view horse head from cuboids.
function buildVoxelKnight() {
  var group = new THREE.Group();
  var v = 0.55; // voxel unit

  function box(w, h, d, x, y, z) {
    addGeo(
      group,
      new THREE.BoxGeometry(w * v, h * v, d * v),
      x * v,
      y * v,
      z * v,
    );
  }

  // Base (matches other voxel pieces)
  box(4, 1, 4, 0, 0.5, 0);
  box(3, 1, 3, 0, 1.5, 0);

  // Neck — wide at bottom, narrows upward, leans slightly forward
  box(2, 2, 2, 0, 3, 0.3);
  box(2, 2, 2, 0, 5, 0.6);
  box(2, 1, 2, 0, 6.5, 0.8);

  // Jaw / lower head — extends forward
  box(2, 2, 3, 0, 7.5, -1.5);

  // Upper skull — sits back relative to jaw
  box(2, 2, 2.5, 0, 9, -0.8);

  // Muzzle / snout extending further forward
  box(2, 1, 2, 0, 7.2, -2.8);
  // Nostril bump
  box(1, 1, 1, 0, 7.0, -3.6);

  // Ear — small block on top-back of skull
  box(1, 2, 1, -0.5, 10.5, -0.2);
  box(1, 2, 1, 0.5, 10.5, -0.2);

  // Eye socket indent suggestion — a slightly raised brow block
  box(2, 1, 1, 0, 9.5, -1.5);

  // Mane — stack of thin blocks down the back of the neck
  box(1, 1, 1, 0, 10, 0.5);
  box(1, 1, 1, 0, 9, 0.8);
  box(1, 1, 1, 0, 8, 0.8);
  box(1, 1, 1, 0, 7, 0.6);
  box(1, 1, 1, 0, 6, 0.4);

  return group;
}
// Samples each classic profile at fixed Y slices and fills a square
// grid of cubes wherever the profile radius covers that cell.
// Result: the exact classic silhouette, but built from blocks.

function buildVoxelPiece(type) {
  var profile = CLASSIC_PROFILES[type];
  var group = new THREE.Group();
  var voxel = 0.55; // cube size — smaller = more detail, larger = chunkier
  var totalH = profile[profile.length - 1][1];
  var rows = Math.ceil(totalH / voxel);

  // Linearly interpolate radius from the profile at a given Y
  function radiusAt(y) {
    if (y <= profile[0][1]) return profile[0][0];
    if (y >= profile[profile.length - 1][1])
      return profile[profile.length - 1][0];
    for (var i = 0; i < profile.length - 1; i++) {
      var y0 = profile[i][1],
        r0 = profile[i][0];
      var y1 = profile[i + 1][1],
        r1 = profile[i + 1][0];
      if (y >= y0 && y <= y1) {
        var t = (y - y0) / (y1 - y0);
        return r0 + (r1 - r0) * t;
      }
    }
    return 0;
  }

  // Collect translated geometries then merge into one mesh
  var geos = [];

  for (var row = 0; row < rows; row++) {
    var y = row * voxel + voxel * 0.5;
    var r = radiusAt(y);
    if (r <= 0) continue;
    var span = Math.ceil(r / voxel);

    for (var cx = -span; cx <= span; cx++) {
      for (var cz = -span; cz <= span; cz++) {
        var dist = Math.sqrt(cx * cx + cz * cz) * voxel;
        if (dist <= r) {
          var g = new THREE.BoxGeometry(voxel, voxel, voxel);
          g.translate(cx * voxel, y, cz * voxel);
          geos.push(g);
        }
      }
    }
  }

  // Merge into single geometry for performance
  var combined =
    typeof THREE.BufferGeometryUtils !== "undefined"
      ? THREE.BufferGeometryUtils.mergeBufferGeometries(geos)
      : null;

  if (combined) {
    group.add(
      new THREE.Mesh(
        combined,
        new THREE.MeshPhongMaterial({ color: 0xffffff }),
      ),
    );
  } else {
    // Fallback: individual meshes (no utils available)
    geos.forEach(function (g) {
      group.add(
        new THREE.Mesh(g, new THREE.MeshPhongMaterial({ color: 0xffffff })),
      );
    });
  }

  // Blocky king cross
  if (type === "king") {
    var topY = totalH + voxel;
    addGeo(
      group,
      new THREE.BoxGeometry(voxel, voxel * 3, voxel),
      0,
      topY + voxel * 1.5,
      0,
    );
    addGeo(
      group,
      new THREE.BoxGeometry(voxel * 3, voxel, voxel),
      0,
      topY + voxel * 2,
      0,
    );
  }

  return group;
}

var PIECE_STYLES = {
  classic: { label: "Classic", build: buildClassicPiece },
  futuristic: { label: "Futuristic", build: buildFuturisticPiece },
  minimal: { label: "Minimal", build: buildMinimalPiece },
  military: { label: "Military", build: buildMilitaryPiece },
  voxel: {
    label: "Voxel",
    build: function (type) {
      return type === "knight" ? buildVoxelKnight() : buildVoxelPiece(type);
    },
  },
};

// ── Swap modelCache with procedural meshes ────────────────────
// build.js's refreshBoard3D reads modelCache[type] and calls
// colorizeModel on it. We just replace those entries.
function applyPieceStyle(styleKey) {
  var style = PIECE_STYLES[styleKey];
  if (!style) return;
  _activePieceStyle = styleKey;

  var types = ["pawn", "rook", "knight", "bishop", "queen", "king"];
  types.forEach(function (type) {
    modelCache[type] = style.build(type);
  });

  refreshBoard3D();
}

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

// =============================================================
//  Captured Piece Graveyard
//  Overrides refreshCaptured3D from build.js.
//  Two stone platforms flank the board — white captures on the
//  far side (+Z), black captures on the near side (-Z).
//  Pieces stand upright in up to two rows per platform.
// =============================================================

refreshCaptured3D = function (
  capturedWhite,
  capturedBlack,
  whiteHex,
  blackHex,
) {
  if (typeof capturedPiecesGroup !== "undefined" && capturedPiecesGroup) {
    scene.remove(capturedPiecesGroup);
  }
  capturedPiecesGroup = new THREE.Group();

  var SORT_ORDER = ["queen", "rook", "bishop", "knight", "pawn"];
  function sorted(arr) {
    return (arr || []).slice().sort(function (a, b) {
      return SORT_ORDER.indexOf(a.type) - SORT_ORDER.indexOf(b.type);
    });
  }

  // ── Platform builder ────────────────────────────────────────
  // Adds a stone-slab platform to the group at given Z position
  function addPlatform(group, zPos) {
    var slabGeo = new THREE.BoxGeometry(9.0, 0.18, 1.6);
    var slabMat = new THREE.MeshPhongMaterial({
      color: 0x888880,
      shininess: 20,
    });
    var slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.set(0, -0.09, zPos);
    slab.raycast = function () {};
    group.add(slab);

    // Thin trim edge facing the board
    var trimGeo = new THREE.BoxGeometry(9.0, 0.06, 0.08);
    var trimMat = new THREE.MeshPhongMaterial({ color: 0x666660 });
    var trim = new THREE.Mesh(trimGeo, trimMat);
    var boardEdge = zPos > 0 ? -0.76 : 0.76;
    trim.position.set(0, 0.06, zPos + boardEdge);
    trim.raycast = function () {};
    group.add(trim);
  }

  // ── Place pieces on a platform ──────────────────────────────
  // Up to 8 per row, max 2 rows, centered on the platform
  function placeCaptured(group, list, color, zCenter, facingDir) {
    if (!list.length) return;

    var pieceScale = 0.13;
    var spacing = 0.85;
    var rowCount = Math.min(list.length, 8);
    var startX = ((rowCount - 1) / 2) * spacing;

    list.forEach(function (p, i) {
      if (!modelCache[p.type]) return;

      var row = Math.floor(i / 8);
      var col = i % 8;
      var rowCount2 = Math.min(list.length - row * 8, 8);
      var startX2 = ((rowCount2 - 1) / 2) * spacing;

      var mesh = colorizeModel(modelCache[p.type], color);
      mesh.scale.set(pieceScale, pieceScale, pieceScale);

      var x = startX2 - col * spacing;
      // Row 0 closer to board, row 1 further away
      var zOffset = row === 0 ? facingDir * -0.35 : facingDir * 0.35;

      mesh.position.set(x, 0.09, zCenter + zOffset);
      mesh.rotation.y = facingDir > 0 ? Math.PI : 0;
      mesh.traverse(function (child) {
        if (child.isMesh) child.raycast = function () {};
      });
      group.add(mesh);
    });
  }

  var wList = sorted(capturedWhite);
  var bList = sorted(capturedBlack);

  // White pieces captured by black → shown on black's side (far, +Z)
  var zFar = 5.4;
  // Black pieces captured by white → shown on white's side (near, -Z)
  var zNear = -5.4;

  if (wList.length > 0) {
    addPlatform(capturedPiecesGroup, zFar);
    placeCaptured(capturedPiecesGroup, wList, whiteHex, zFar, 1);
  }
  if (bList.length > 0) {
    addPlatform(capturedPiecesGroup, zNear);
    placeCaptured(capturedPiecesGroup, bList, blackHex, zNear, -1);
  }

  scene.add(capturedPiecesGroup);
};

// =============================================================
//  Move Animation
//  Overrides applyGameMove from game.js.
//  Animates the moving piece in an arc, then calls the original
//  applyGameMove to update game state + rebuild the board.
//  No other files modified.
// =============================================================

var _origApplyGameMove = applyGameMove;

var _suppressRefresh = false;

var _origRefreshBoard3D = refreshBoard3D;
refreshBoard3D = function () {
  if (_suppressRefresh) return;
  _origRefreshBoard3D();
};

applyGameMove = function (move) {
  // 1. Grab mesh BEFORE state changes destroy piecesGroup
  var movingMesh = null;
  if (piecesGroup) {
    piecesGroup.traverse(function (child) {
      if (child.userData && child.userData.boardIndex === move.from)
        movingMesh = child;
    });
  }

  if (!movingMesh) {
    _origApplyGameMove(move);
    return;
  }

  var startX = movingMesh.position.x;
  var startY = movingMesh.position.y;
  var startZ = movingMesh.position.z;
  var destX = 3.5 - sqCol(move.to);
  var destY = 0.1;
  var destZ = sqRow(move.to) - 3.5;
  var dx = destX - startX,
    dz = destZ - startZ;
  var arcHeight = 0.6 + Math.sqrt(dx * dx + dz * dz) * 0.18;

  // 2. Update game state but suppress the board rebuild it triggers
  _suppressRefresh = true;
  _origApplyGameMove(move);
  _suppressRefresh = false;

  // 3. Detach mesh as visual overlay for the duration of the animation
  piecesGroup.remove(movingMesh);
  scene.add(movingMesh);

  var duration = 320,
    startTime = null;
  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    var t = Math.min((timestamp - startTime) / duration, 1);
    var e = easeInOut(t);
    movingMesh.position.x = startX + dx * e;
    movingMesh.position.z = startZ + dz * e;
    movingMesh.position.y =
      startY + (destY - startY) * e + arcHeight * Math.sin(Math.PI * t);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      // 4. Animation done — rebuild board once
      scene.remove(movingMesh);
      _origRefreshBoard3D();
    }
  }
  requestAnimationFrame(step);
};

// =============================================================
//  Board Themes
//  Overrides createChessBoard from build.js.
//  Changes board geometry while keeping all userData/raycaster
//  tagging identical so interaction.js keeps working.
// =============================================================

// ── Board material presets ────────────────────────────────────
// Applied to square meshes independently of board geometry style.

var BOARD_MATERIAL_PRESETS = {
  flat: {
    label: "Flat",
    apply: function (color) {
      return new THREE.MeshBasicMaterial({ color: color });
    },
  },
  matte: {
    label: "Matte",
    apply: function (color) {
      return new THREE.MeshLambertMaterial({ color: color });
    },
  },
  shiny: {
    label: "Shiny",
    apply: function (color) {
      return new THREE.MeshPhongMaterial({
        color: color,
        shininess: 120,
        specular: 0x444444,
      });
    },
  },
  glass: {
    label: "Glass",
    apply: function (color, isBlack) {
      return new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: isBlack ? 0.55 : 0.8,
        shininess: 200,
        specular: 0xffffff,
      });
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
  wireframe: {
    label: "Wireframe",
    wireframeBoard: true,
    apply: function (color) {
      return new THREE.MeshBasicMaterial({ color: color, wireframe: true });
    },
  },
};

var _activeBoardMaterial = "matte";

function applyBoardMaterial(matKey) {
  if (!BOARD_MATERIAL_PRESETS[matKey]) return;
  _activeBoardMaterial = matKey;
  createChessBoard(whiteSquareColor, blackSquareColor, boardColor);
}

// ── Board geometry styles ─────────────────────────────────────
// Only controls shape/geometry — material is applied separately above.

var BOARD_STYLES = {
  flat: {
    label: "Flat",
    squareSize: squareSize,
    squareHeight: 0.2,
    buildBase: function (group, boardCol) {
      var geo = new THREE.BoxGeometry(boardSize + 3, 0.12, boardSize + 3);
      var mat = new THREE.MeshPhongMaterial({ color: boardCol, shininess: 20 });
      var base = new THREE.Mesh(geo, mat);
      base.position.set(0, -0.18, 0);
      group.add(base);
    },
  },

  floating: {
    label: "Floating Tiles",
    squareSize: squareSize * 0.88,
    squareHeight: 0.18,
    buildBase: function (group, boardCol) {
      var geo = new THREE.BoxGeometry(boardSize + 3, 0.02, boardSize + 3);
      var mat = new THREE.MeshBasicMaterial({
        color: boardCol,
        transparent: true,
        opacity: 0.15,
      });
      var base = new THREE.Mesh(geo, mat);
      base.position.set(0, -0.5, 0);
      group.add(base);
    },
    squareYOffset: function (x, z) {
      return (x + z) % 2 === 0 ? 0 : 0.06;
    },
  },

  marble: {
    label: "Marble Slab",
    squareSize: squareSize * 0.98,
    squareHeight: 0.28,
    buildBase: function (group, boardCol) {
      var mat = new THREE.MeshPhongMaterial({
        color: boardCol,
        shininess: 80,
        specular: 0x555555,
      });
      var base = new THREE.Mesh(
        new THREE.BoxGeometry(boardSize + 2.6, 0.4, boardSize + 2.6),
        mat,
      );
      base.position.set(0, -0.32, 0);
      group.add(base);
      var borderMat = new THREE.MeshPhongMaterial({
        color: darken(boardCol, 0.7),
        shininess: 60,
      });
      [
        [boardSize + 2.6, 0.28, 0.22, 0, -0.18, boardSize / 2 + 0.11],
        [boardSize + 2.6, 0.28, 0.22, 0, -0.18, -(boardSize / 2) - 0.11],
        [0.22, 0.28, boardSize + 2.6, boardSize / 2 + 0.11, -0.18, 0],
        [0.22, 0.28, boardSize + 2.6, -(boardSize / 2) - 0.11, -0.18, 0],
      ].forEach(function (d) {
        var m = new THREE.Mesh(
          new THREE.BoxGeometry(d[0], d[1], d[2]),
          borderMat,
        );
        m.position.set(d[3], d[4], d[5]);
        group.add(m);
      });
    },
  },
};

var _activeBoardStyle = "flat";

function darken(hex, factor) {
  var r = Math.floor(((hex >> 16) & 255) * factor);
  var g = Math.floor(((hex >> 8) & 255) * factor);
  var b = Math.floor((hex & 255) * factor);
  return (r << 16) | (g << 8) | b;
}

function applyBoardStyle(styleKey) {
  if (!BOARD_STYLES[styleKey]) return;
  _activeBoardStyle = styleKey;
  createChessBoard(whiteSquareColor, blackSquareColor, boardColor);
}

// Override createChessBoard — keeps all userData/raycaster tagging identical
createChessBoard = function (whiteCol, blackCol, boardCol) {
  var style = BOARD_STYLES[_activeBoardStyle] || BOARD_STYLES.flat;
  var boardMat =
    BOARD_MATERIAL_PRESETS[_activeBoardMaterial] ||
    BOARD_MATERIAL_PRESETS.matte;

  if (chessboardGroup) scene.remove(chessboardGroup);
  chessboardGroup = new THREE.Group();

  whiteSquareColor = whiteCol;
  blackSquareColor = blackCol;
  boardColor = boardCol;

  style.buildBase(chessboardGroup, boardCol);

  // If wireframe board material is active, convert every base mesh to wireframe too
  if (boardMat.wireframeBoard) {
    chessboardGroup.traverse(function (child) {
      if (child.isMesh) {
        child.material = new THREE.MeshBasicMaterial({
          color: child.material.color,
          wireframe: true,
        });
      }
    });
  }

  squareMeshes = [];
  squareMeshByIndex = {};

  var sqSize = style.squareSize || squareSize;

  for (var x = 0; x < boardSize; x++) {
    for (var z = 0; z < boardSize; z++) {
      var isBlackSquare = (x + z) % 2 === 0;
      var color = isBlackSquare ? blackCol : whiteCol;

      var geo = new THREE.BoxGeometry(
        sqSize,
        style.squareHeight || 0.2,
        sqSize,
      );
      var mat = boardMat.apply(color, isBlackSquare);
      var square = new THREE.Mesh(geo, mat);

      var yOffset = style.squareYOffset ? style.squareYOffset(x, z) : 0;
      square.position.set(3.5 - x, yOffset, z - 3.5);

      var boardIdx = z * 8 + x;
      square.userData.boardIndex = boardIdx;
      square.userData.type = "square";
      squareMeshes.push(square);
      squareMeshByIndex[boardIdx] = square;

      chessboardGroup.add(square);
    }
  }

  scene.add(chessboardGroup);
};
