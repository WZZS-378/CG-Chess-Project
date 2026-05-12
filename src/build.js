
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
            let isBlackSquare = (x + z) % 2 === 1;
            var squareGeometry = new THREE.BoxGeometry(squareSize, 0.2, squareSize);
            var squareMaterial = new THREE.MeshBasicMaterial({ 
                color: isBlackSquare ? blackCol : whiteCol
            });
            
            var square = new THREE.Mesh(squareGeometry, squareMaterial);
            square.position.set(x - 3.5, 0, z - 3.5);

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
