// Piece Colours
let currentWhitePieceColor = 0xfaf0dc;
let currentBlackPieceColor = 0x222222;

// Game State
let gameState = createInitialState();

// 3D Sync
// Rebuilds the piece group from scratch to match the current engine state.
// Called after every move and after colour changes from the controls panel.
function refreshBoard3D() {
    if (piecesGroup) scene.remove(piecesGroup);
    piecesGroup = new THREE.Group();

    for (let i = 0; i < 64; i++) {
        const p = gameState.board[i];
        if (!p || !modelCache[p.type]) continue;

        const r     = sqRow(i);
        const c     = sqCol(i);
        const color = p.color === 'white' ? currentWhitePieceColor : currentBlackPieceColor;

        const mesh = colorizeModel(modelCache[p.type], color);
        mesh.scale.set(0.18, 0.18, 0.18);
        mesh.position.set(c - 3.5, 0.1, r - 3.5);
        mesh.rotation.y = p.color === 'white' ? Math.PI : 0;
        mesh.userData.boardIndex = i;
        mesh.userData.type = 'piece';
        piecesGroup.add(mesh);
    }

    scene.add(piecesGroup);
    // Make pieces click-through so raycasts always reach the square beneath.
    if (typeof disablePieceRaycast === 'function') disablePieceRaycast();
}

// Game Flow
function startGame() {
    gameState = createInitialState();
    refreshBoard3D();
    updateStatusDisplay();
    renderer.domElement.addEventListener('click', onBoardClick);
}

// Called by interaction.js after every move is applied.
function onMoveComplete() {
    const status = getGameStatus(gameState);
    updateStatusDisplay(status);
    if (status !== 'playing') {
        // Remove click listener so the board is no longer interactive.
        renderer.domElement.removeEventListener('click', onBoardClick);
    }
}

// Status Display
function updateStatusDisplay(status) {
    const el = document.getElementById('status');
    if (!el) return;

    if (!status || status === 'playing') {
        const checked = isInCheck(gameState.board, gameState.turn);
        el.textContent = checked
            ? cap(gameState.turn) + ' to move \u2014 Check!'
            : cap(gameState.turn) + ' to move';
    } else if (status === 'checkmate') {
        const winner = gameState.turn === 'white' ? 'Black' : 'White';
        el.textContent = 'Checkmate \u2014 ' + winner + ' wins!';
    } else if (status === 'stalemate') {
        el.textContent = 'Stalemate \u2014 Draw!';
    } else if (status === 'draw-50move') {
        el.textContent = 'Draw by the 50-move rule.';
    }
}

function cap(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
