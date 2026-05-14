// Define the chess board parameters
let boardSize = 8, squareSize = 1;
let boardColor = 0x8B4513; // Default board color (brown)
let whiteSquareColor = 0xffffff;
let blackSquareColor = 0x222222; // Now same variable as black piece color
let chessboardGroup = null;

// Flat array of all 64 square meshes — used by Raycaster in interaction.js
let squareMeshes = [];
// boardIndex → mesh lookup — used by the highlight system in interaction.js
let squareMeshByIndex = {};

function createChessBoard(whiteCol, blackCol, boardCol) {
    // Remove old board if exists
    if (chessboardGroup) {
        scene.remove(chessboardGroup);
    }
    
    chessboardGroup = new THREE.Group();
    
    // Store colors globally
    whiteSquareColor = whiteCol;
    blackSquareColor = blackCol;
    boardColor = boardCol;
    
    // Create the chess board base
    var boardGeometry = new THREE.BoxGeometry(boardSize + 3, 0.01, boardSize + 3);
    var boardMaterial = new THREE.MeshBasicMaterial({ color: boardCol });

    var board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.set(0, -0.12, 0);
    chessboardGroup.add(board);

    // Create the chess board squares
    squareMeshes = [];
    squareMeshByIndex = {};
    for (let x = 0; x < boardSize; x++) {
        for (let z = 0; z < boardSize; z++) {
            let isBlackSquare = (x + z) % 2 === 0;
            var squareGeometry = new THREE.BoxGeometry(squareSize, 0.2, squareSize);
            var squareMaterial = new THREE.MeshBasicMaterial({ 
                color: isBlackSquare ? blackCol : whiteCol
            });
            
            var square = new THREE.Mesh(squareGeometry, squareMaterial);
            square.position.set(3.5 - x, 0, z - 3.5);

            // Tag each square so the raycaster and highlight system can identify it.
            // boardIndex = row * 8 + col  (row = z, col = x — matches engine.js layout)
            const boardIdx = z * 8 + x;
            square.userData.boardIndex = boardIdx;
            square.userData.type = 'square';
            squareMeshes.push(square);
            squareMeshByIndex[boardIdx] = square;

            chessboardGroup.add(square);
        }
    }
    scene.add(chessboardGroup);
}

// Global cache for loaded piece models
let modelCache = {};
let piecesGroup = null;

// Load individual piece models with caching
function loadPieceModel(pieceType, path) {
    return new Promise((resolve, reject) => {
        if (modelCache[pieceType]) {
            resolve(modelCache[pieceType]);
            return;
        }

        const objLoader = new THREE.OBJLoader();

        function loadObj() {
            objLoader.load(
                path + ".obj",
                function (object) {
                    // Rotate upright (models exported Z-up / lying flat)
                    object.rotation.x = -Math.PI / 2;
                    object.updateMatrixWorld(true);

                    // Compute bounding box in the rotated orientation and
                    // shift so the piece is centred in X/Z with its base at Y=0
                    const box = new THREE.Box3().setFromObject(object);
                    const center = box.getCenter(new THREE.Vector3());
                    object.position.set(-center.x, -box.min.y, -center.z);

                    // Wrap in a Group so colorizeModel's clone preserves the offset
                    const wrapper = new THREE.Group();
                    wrapper.add(object);
                    modelCache[pieceType] = wrapper;
                    resolve(wrapper);
                },
                undefined,
                reject
            );
        }

        const mtlLoader = new THREE.MTLLoader();
        mtlLoader.load(
            path + ".mtl",
            function (materials) {
                materials.preload();
                objLoader.setMaterials(materials);
                loadObj();
            },
            undefined,
            function () {
                // No .mtl file — load OBJ with default materials
                loadObj();
            }
        );
    });
}

// Apply color to cloned model
function colorizeModel(object, color) {
    const cloned = object.clone();
    cloned.traverse(function (child) {
        if (child.isMesh) {
            child.material = new THREE.MeshPhongMaterial({ color: color });
        }
    });
    return cloned;
}

// Captured pieces displayed beside the board (tilted 90°). White pieces taken by Black sit on Black's side (+Z); Black pieces taken by White on White's side (−Z).
let capturedPiecesGroup = null;

const CAPTURE_SORT_ORDER = ['queen', 'rook', 'bishop', 'knight', 'pawn'];

function sortCapturedForDisplay(arr) {
    return arr.slice().sort(function (a, b) {
        return CAPTURE_SORT_ORDER.indexOf(a.type) - CAPTURE_SORT_ORDER.indexOf(b.type);
    });
}

function refreshCaptured3D(capturedWhite, capturedBlack, whiteHex, blackHex) {
    if (capturedPiecesGroup) scene.remove(capturedPiecesGroup);
    capturedPiecesGroup = new THREE.Group();

    var scale = 0.1;
    var spacing = 0.5;
    var zBlackSide = 4.5;
    var zWhiteSide = -4.5;
    var baseY = -0.06;

    var wList = sortCapturedForDisplay(capturedWhite || []);
    var bList = sortCapturedForDisplay(capturedBlack || []);

    // Square column 0 (a-file) sits at world X = 3.5; rows grow toward −X (h-file).
    // Start each capture row at that left edge and step inward along the rank.
    var leftStartX = 3.6;

    var i;
    for (i = 0; i < wList.length; i++) {
        var pw = wList[i];
        if (!modelCache[pw.type]) continue;
        var mw = colorizeModel(modelCache[pw.type], whiteHex);
        mw.scale.set(scale, scale, scale);
        mw.position.set(leftStartX - i * spacing, baseY, zBlackSide);
        capturedPiecesGroup.add(mw);
    }

    for (i = 0; i < bList.length; i++) {
        var pb = bList[i];
        if (!modelCache[pb.type]) continue;
        var mb = colorizeModel(modelCache[pb.type], blackHex);
        mb.scale.set(scale, scale, scale);
        mb.position.set(leftStartX - i * spacing, baseY, zWhiteSide);
        capturedPiecesGroup.add(mb);
    }

    scene.add(capturedPiecesGroup);

    if (capturedPiecesGroup) {
        capturedPiecesGroup.traverse(function (child) {
            if (child.isMesh) child.raycast = function () {};
        });
    }
}

// Loads all six piece types into modelCache.
// Called once on startup; subsequent calls return immediately from the cache.
async function loadAllModels() {
    const pieces = [
        { type: "pawn",   path: "models/chess/pawn"   },
        { type: "rook",   path: "models/chess/rook"   },
        { type: "knight", path: "models/chess/knight" },
        { type: "bishop", path: "models/chess/bishop" },
        { type: "queen",  path: "models/chess/queen"  },
        { type: "king",   path: "models/chess/king"   },
    ];
    for (const p of pieces) {
        await loadPieceModel(p.type, p.path);
    }
}

// Define the add shapes function
function addShapes() {
    createChessBoard(0xffffff, 0x222222, 0x8B4513);

    if (typeof THREE.OBJLoader === "undefined" || typeof THREE.MTLLoader === "undefined") {
        console.error("OBJLoader or MTLLoader not loaded");
        return;
    }

    // Load all models
    loadAllModels().then(function () {
        if (typeof startGame === "function") startGame(); // To-Do: Implement startGame function
    });
}
