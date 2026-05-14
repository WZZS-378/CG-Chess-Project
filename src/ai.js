// AI opponent using minimax algorithm
const PIECE_VALUES = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };
const MATE_SCORE = 1e6;

// All legal moves for whoever is to move in `state`.
function getAllLegalMovesForTurn(state) {
    const moves = [];
    for (let i = 0; i < 64; i++) {
        const p = state.board[i];
        if (!p || p.color !== state.turn) continue;
        const leg = getLegalMoves(state, i);
        for (let j = 0; j < leg.length; j++) {
            moves.push({ from: i, to: leg[j] });
        }
    }
    return moves;
}

function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = arr[i];
        arr[i] = arr[j];
        arr[j] = t;
    }
    return arr;
}

// Positive = good for Black, negative = good for White (human).
function evaluateMaterial(state) {
    let score = 0;
    for (let i = 0; i < 64; i++) {
        const p = state.board[i];
        if (!p) continue;
        const v = PIECE_VALUES[p.type] || 0;
        score += p.color === 'black' ? v : -v;
    }
    return score;
}

function evaluateTerminalOrLeaf(state, depthRemaining) {
    const status = getGameStatus(state);
    if (status === 'checkmate') {
        // side to move is checkmated → previous mover won
        return state.turn === 'white' ? MATE_SCORE : -MATE_SCORE;
    }
    if (status !== 'playing') return 0;
    if (depthRemaining <= 0) return evaluateMaterial(state);
    return null;
}

function minimax(state, plies) {
    const terminal = evaluateTerminalOrLeaf(state, plies);
    if (terminal !== null) return terminal;

    const moves = getAllLegalMovesForTurn(state);
    const maximizing = state.turn === 'black';

    if (maximizing) {
        let best = -Infinity;
        for (let m = 0; m < moves.length; m++) {
            const child = applyMove(state, moves[m]);
            const s = minimax(child, plies - 1);
            if (s > best) best = s;
        }
        return best;
    }
    let best = Infinity;
    for (let m = 0; m < moves.length; m++) {
        const child = applyMove(state, moves[m]);
        const s = minimax(child, plies - 1);
        if (s < best) best = s;
    }
    return best;
}

function pickBestMoveAtRoot(state, plies) {
    const moves = getAllLegalMovesForTurn(state);
    if (moves.length === 0) return null;

    const maximizing = state.turn === 'black';
    let bestMove = moves[0];
    let bestScore = maximizing ? -Infinity : Infinity;

    for (let m = 0; m < moves.length; m++) {
        const mv = moves[m];
        const child = applyMove(state, mv);
        const s = minimax(child, plies - 1);
        if (maximizing) {
            if (s > bestScore) {
                bestScore = s;
                bestMove = mv;
            }
        } else if (s < bestScore) {
            bestScore = s;
            bestMove = mv;
        }
    }
    return bestMove;
}


function getAIMove(state, difficulty) {
    const moves = getAllLegalMovesForTurn(state);
    if (moves.length === 0) return null;

    if (difficulty === 'easy') {
        shuffleInPlace(moves);
        return moves[0];
    }
    if (difficulty === 'medium') return pickBestMoveAtRoot(state, 2);
    if (difficulty === 'hard') return pickBestMoveAtRoot(state, 3);
    return pickBestMoveAtRoot(state, 2);
}
