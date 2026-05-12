
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
    var boardMaterial = new THREE.MeshBasicMaterial({ 
        color: boardCol 
    });

    var board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.set(0, -0.12, 0);
    chessboardGroup.add(board);

    // Create the chess board squares - black squares use blackSquareColor
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

// Place all pieces on the board
async function placePieces(whitePieceColor, blackPieceColor) {
    // Remove old pieces
    if (piecesGroup) {
        scene.remove(piecesGroup);
    }
    piecesGroup = new THREE.Group();

    // Piece order for a chess back rank (a–h files)
    const pieceOrder = [
        { type: "rook",   path: "models/chess/rook" },
        { type: "knight", path: "models/chess/knight" },
        { type: "bishop", path: "models/chess/bishop" },
        { type: "queen",  path: "models/chess/queen" },
        { type: "king",   path: "models/chess/king" },
        { type: "bishop", path: "models/chess/bishop" },
        { type: "knight", path: "models/chess/knight" },
        { type: "rook",   path: "models/chess/rook" },
    ];

    // Load each unique piece type
    try {
        await loadPieceModel("pawn", "models/chess/pawn");
        for (const piece of pieceOrder) {
            await loadPieceModel(piece.type, piece.path);
        }
    } catch (err) {
        console.error("Error loading piece models:", err);
        return;
    }

    const mainPieces = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];

    // Single loop places all four rows (white back rank + pawns, black pawns + back rank).
    // Board squares sit at (col - 3.5, 0, row - 3.5) for col/row 0–7.
    // Rotation.x is baked into each wrapper; rotation.y faces pieces toward the opponent.
    for (let col = 0; col < 8; col++) {
        // White pawn — row 1
        const wPawn = colorizeModel(modelCache["pawn"], whitePieceColor);
        wPawn.scale.set(0.18, 0.18, 0.18);
        wPawn.position.set(col - 3.5, 0.1, -2.5);
        wPawn.rotation.y = Math.PI;
        piecesGroup.add(wPawn);

        // White back rank — row 0
        const wBack = colorizeModel(modelCache[mainPieces[col]], whitePieceColor);
        wBack.scale.set(0.18, 0.18, 0.18);
        wBack.position.set(col - 3.5, 0.1, -3.5);
        wBack.rotation.y = Math.PI;
        piecesGroup.add(wBack);

        // Black pawn — row 6
        const bPawn = colorizeModel(modelCache["pawn"], blackPieceColor);
        bPawn.scale.set(0.18, 0.18, 0.18);
        bPawn.position.set(col - 3.5, 0.1, 2.5);
        bPawn.rotation.y = 0;
        piecesGroup.add(bPawn);

        // Black back rank — row 7
        const bBack = colorizeModel(modelCache[mainPieces[col]], blackPieceColor);
        bBack.scale.set(0.18, 0.18, 0.18);
        bBack.position.set(col - 3.5, 0.1, 3.5);
        bBack.rotation.y = 0;
        piecesGroup.add(bBack);
    }

    scene.add(piecesGroup);
    console.log("Pieces placed:", piecesGroup.children.length);
}

// Define the add shapes function
function addShapes() {
    createChessBoard(0xffffff, 0x222222, 0x8B4513);
    
    if (typeof THREE.OBJLoader === "undefined" || typeof THREE.MTLLoader === "undefined") {
        console.error("OBJLoader or MTLLoader not loaded");
        return;
    }

    // Initial piece placement
    placePieces(0xfaf0dc, blackSquareColor);
}