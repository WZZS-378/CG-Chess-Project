
// Define the chess board parameters
let boardSize = 8, squareSize = 1;
let boardColor = 0x8B4513; // Default board color (brown)
let whiteSquareColor = 0xffffff;
let blackSquareColor = 0x222222; // Now same variable as black piece color
let chessboardGroup = null;

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
    for (let x = 0; x < boardSize; x++) {
        for (let z = 0; z < boardSize; z++) {
            let isBlackSquare = (x + z) % 2 === 1;
            var squareGeometry = new THREE.BoxGeometry(squareSize, 0.2, squareSize);
            var squareMaterial = new THREE.MeshBasicMaterial({ 
                color: isBlackSquare ? blackCol : whiteCol
            });
            
            var square = new THREE.Mesh(squareGeometry, squareMaterial);
            square.position.set(x - 3.5, 0, z - 3.5);
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

        const mtlLoader = new THREE.MTLLoader();
        const objLoader = new THREE.OBJLoader();

        mtlLoader.load(
            path + ".mtl",
            function (materials) {
                materials.preload();
                objLoader.setMaterials(materials);
                objLoader.load(
                    path + ".obj",
                    function (object) {
                        modelCache[pieceType] = object;
                        resolve(object);
                    },
                    undefined,
                    reject
                );
            },
            undefined,
            reject
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

    // Piece order for a chess row
    const pieceOrder = [
        { type: "rook", path: "models/ChessRook/ChessRook" },
        { type: "knight", path: "models/ChessKnight/ChessKnight" },
        { type: "bishop", path: "models/ChessBishop/ChessBishop" },
        { type: "queen", path: "models/ChessQueen/ChessQueen" },
        { type: "king", path: "models/ChessKing/ChessKing" },
        { type: "bishop", path: "models/ChessBishop/ChessBishop" },
        { type: "knight", path: "models/ChessKnight/ChessKnight" },
        { type: "rook", path: "models/ChessRook/ChessRook" },
    ];

    // Load each unique piece type
    try {
        await loadPieceModel("pawn", "models/ChessPawn/ChessPawn");
        for (const piece of pieceOrder) {
            await loadPieceModel(piece.type, piece.path);
        }
    } catch (err) {
        console.error("Error loading piece models:", err);
        return;
    }

    // Place white pieces (bottom)
    for (let x = 0; x < 8; x++) {
        // Pawns (z=1)
        const pawn = colorizeModel(modelCache["pawn"], whitePieceColor);
        pawn.scale.set(0.18, 0.18, 0.18);
        pawn.position.set(x - 6.5, 0.12, -0.4);
        pawn.rotation.x = Math.PI / 2;
        pawn.rotation.y = Math.PI;
        piecesGroup.add(pawn);
    }

    // Place black pieces (top)
    for (let x = 0; x < 8; x++) {
        // Pawns (z=6)
        const pawn = colorizeModel(modelCache["pawn"], blackPieceColor);
        pawn.scale.set(0.18, 0.18, 0.18);
        pawn.position.set(x - 6.5, 0.12, 4.6);
        pawn.rotation.x = Math.PI / 2;
        pawn.rotation.y = Math.PI;
        piecesGroup.add(pawn);
    }

    const mainPieces = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];


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