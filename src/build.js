
// Define the chess board parameters
let boardSize = 8, squareSize = 1;


function createChessBoard(squareColor, boardColor) {
    let chessBoard = new THREE.Group();
    
    //Create the chess board base
    var boardGeometry = new THREE.BoxGeometry(boardSize + 3, 0.01, boardSize + 3);
    var boardMaterial = new THREE.MeshBasicMaterial({ 
        color: boardColor 
    });

    var board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.set(0, -0.12, 0);
    chessBoard.add(board);

    // Create the chess board squares
    for (let x = 0; x < boardSize; x++) {
        for (let z = 0; z < boardSize; z++) {
            let isBlackSquare = (x + z) % 2 === 1;
            var squareGeometry = new THREE.BoxGeometry(squareSize, 0.2, squareSize);
            var squareMaterial = new THREE.MeshBasicMaterial({ 
                color: isBlackSquare ? squareColor : 0xffffff
            });
            
            var square = new THREE.Mesh(squareGeometry, squareMaterial);
            square.position.set(x - 3.5, 0, z - 3.5);
            chessBoard.add(square);
        }
    }
    scene.add(chessBoard);
}


// Define the add shapes function
function addShapes(){
    createChessBoard(0x000000, 0x8B4513);
}