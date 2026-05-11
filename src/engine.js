// Constants

const EMPTY = null;

const piece = (type, color) => ({ type, color, hasMoved: false });

// Board State Functions
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

function createInitialState() {
    return {
        board: createInitialBoard(),
        turn: 'white',
        enPassantSquare: null,
        castling: {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true },
        },
        halfMoveClock: 0,
        moveHistory: [],
    };
}

function deepCloneState(state) {
    return {
        board: state.board.map(p => p ? { ...p } : EMPTY),
        turn: state.turn,
        enPassantSquare: state.enPassantSquare,
        castling: {
            white: { ...state.castling.white },
            black: { ...state.castling.black },
        },
        halfMoveClock: state.halfMoveClock,
        moveHistory: [...state.moveHistory],
    };
}

// Index Helper Functions
//   Board is a flat 64-element array, row-major.
//   index = row * 8 + col  (row 0 = white back rank, row 7 = black back rank)
const sqRow  = i  => Math.floor(i / 8);
const sqCol  = i  => i % 8;
const sqIdx  = (r, c) => r * 8 + c;
const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;


// Sliding Piece Helper Function
function slide(board, fromIdx, color, directions) {
    const moves = [];
    for (const [dr, dc] of directions) {
        let r = sqRow(fromIdx) + dr;
        let c = sqCol(fromIdx) + dc;
        while (inBounds(r, c)) {
            const target = sqIdx(r, c);
            if (board[target] === EMPTY) {
                moves.push(target);
            } else {
                if (board[target].color !== color) moves.push(target); // capture
                break;
            }
            r += dr;
            c += dc;
        }
    }
    return moves;
}

// Get Piece Moves
function getPawnMoves(board, state, fromIdx) {
    const moves = [];
    const p     = board[fromIdx];
    const dir   = p.color === 'white' ? 1 : -1;   // white moves up (increasing row)
    const startRow = p.color === 'white' ? 1 : 6;
    const r = sqRow(fromIdx);
    const c = sqCol(fromIdx);

    // Single push
    if (inBounds(r + dir, c)) {
        const oneStep = sqIdx(r + dir, c);
        if (board[oneStep] === EMPTY) {
            moves.push(oneStep);

            // Double push from the starting row
            const twoStep = sqIdx(r + dir * 2, c);
            if (r === startRow && board[twoStep] === EMPTY) {
                moves.push(twoStep);
            }
        }
    }

    // Diagonal captures and en passant
    for (const dc of [-1, 1]) {
        if (!inBounds(r + dir, c + dc)) continue;
        const target = sqIdx(r + dir, c + dc);
        const isCapture    = board[target] !== EMPTY && board[target].color !== p.color;
        const isEnPassant  = target === state.enPassantSquare;
        if (isCapture || isEnPassant) moves.push(target);
    }

    return moves;
}

function getKnightMoves(board, fromIdx, color) {
    const moves   = [];
    const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    const r = sqRow(fromIdx);
    const c = sqCol(fromIdx);

    for (const [dr, dc] of offsets) {
        if (!inBounds(r + dr, c + dc)) continue;
        const target = sqIdx(r + dr, c + dc);
        if (board[target] === EMPTY || board[target].color !== color) {
            moves.push(target);
        }
    }
    return moves;
}

function getRookMoves(board, fromIdx, color) {
    return slide(board, fromIdx, color, [[-1,0],[1,0],[0,-1],[0,1]]);
}

function getBishopMoves(board, fromIdx, color) {
    return slide(board, fromIdx, color, [[-1,-1],[-1,1],[1,-1],[1,1]]);
}

function getQueenMoves(board, fromIdx, color) {
    return [
        ...getRookMoves(board, fromIdx, color),
        ...getBishopMoves(board, fromIdx, color),
    ];
}

function getKingMoves(board, state, fromIdx, color) {
    const moves   = [];
    const offsets = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    const r = sqRow(fromIdx);
    const c = sqCol(fromIdx);

    for (const [dr, dc] of offsets) {
        if (!inBounds(r + dr, c + dc)) continue;
        const target = sqIdx(r + dr, c + dc);
        if (board[target] === EMPTY || board[target].color !== color) {
            moves.push(target);
        }
    }

    // Castling — squares between king and rook must all be empty, and the king must not have moved.
    const backRow = color === 'white' ? 0 : 7;
    const rights  = state.castling[color];

    if (fromIdx === sqIdx(backRow, 4) && !board[fromIdx].hasMoved) {
        if (rights.kingside &&
            board[sqIdx(backRow, 5)] === EMPTY &&
            board[sqIdx(backRow, 6)] === EMPTY) {
            moves.push(sqIdx(backRow, 6));
        }
        if (rights.queenside &&
            board[sqIdx(backRow, 1)] === EMPTY &&
            board[sqIdx(backRow, 2)] === EMPTY &&
            board[sqIdx(backRow, 3)] === EMPTY) {
            moves.push(sqIdx(backRow, 2));
        }
    }

    return moves;
}

function getCandidateMoves(board, state, fromIdx) {
    const p = board[fromIdx];
    if (!p) return [];
    switch (p.type) {
        case 'pawn':   return getPawnMoves(board, state, fromIdx);
        case 'knight': return getKnightMoves(board, fromIdx, p.color);
        case 'rook':   return getRookMoves(board, fromIdx, p.color);
        case 'bishop': return getBishopMoves(board, fromIdx, p.color);
        case 'queen':  return getQueenMoves(board, fromIdx, p.color);
        case 'king':   return getKingMoves(board, state, fromIdx, p.color);
        default:       return [];
    }
}