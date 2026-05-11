const EMPTY = null;
const pieces = (type, color) => ({ type, color, hasMoved: false });

const gameState = {
    board: createInitialBoard(),
    turn: 'white',
    castling: {
        white: {
            kingside: true, queenside: true,
        },
        black: {
            kingside: true, queenside: true,
        },
    },
    halfMoveClock: 0,
    moveHistory: [],
};

function createInitialBoard() {
    const b = Array(64).fill(EMPTY);

    const order = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

    for (let col = 0; col < 8; col++) {
        b[0 * 8 + col] = piece(order[col], 'white');
        b[7 * 8 + col] = piece(order[col], 'black');
        b[1 * 8 + col] = piece('pawn', 'white');
        b[6 * 8 + col] = piece('pawn', 'black');
    }
    
    return b;
}