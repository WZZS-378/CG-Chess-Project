// Piece Colours
let currentWhitePieceColor = 0xfaf0dc;
let currentBlackPieceColor = 0x222222;

// Game mode — 'local' or 'cpu' (human always White vs Black AI).
window.gameMode = window.gameMode || 'local';
window.aiDifficulty = window.aiDifficulty || 'medium';

// Game State
let gameState = createInitialState();

// AI Web Worker (engine + minimax run off the main thread)
let aiWorker = null;
let cpuSearchId = 0;

function getAiWorker() {
    if (!aiWorker) {
        aiWorker = new Worker('src/chess-ai.worker.js');
        aiWorker.onerror = function (err) {
            console.error('AI worker error:', err);
        };
    }
    return aiWorker;
}

function terminateAiWorker() {
    if (aiWorker) {
        aiWorker.terminate();
        aiWorker = null;
    }
}

function cloneStateForWorker(state) {
    return JSON.parse(JSON.stringify(state));
}

// 3D Sync
// Rebuilds the piece group from scratch to match the current engine state.
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
        mesh.position.set(3.5 - c, 0.1, r - 3.5);
        mesh.rotation.y = p.color === 'white' ? Math.PI : 0;
        mesh.userData.boardIndex = i;
        mesh.userData.type = 'piece';
        piecesGroup.add(mesh);
    }

    scene.add(piecesGroup);
    if (typeof disablePieceRaycast === 'function') disablePieceRaycast();

    if (typeof controls !== 'undefined' && controls && controls.update) controls.update();
    if (typeof renderer !== 'undefined' && renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

let isCpuThinking = false;

function setCpuThinking(on) {
    isCpuThinking = !!on;
    const el = document.getElementById('status');
    if (!el) return;
    if (on) {
        el.textContent = 'CPU is thinking\u2026';
    } else {
        updateStatusDisplay(getGameStatus(gameState));
    }
}

// Game Flow
function startGame() {
    terminateAiWorker();
    cpuSearchId++;
    isCpuThinking = false;

    gameState = createInitialState();
    refreshBoard3D();
    updateStatusDisplay();
    renderer.domElement.removeEventListener('click', onBoardClick);
    renderer.domElement.addEventListener('click', onBoardClick);
}

function executeCpuMove() {
    if (window.gameMode !== 'cpu' || gameState.turn !== 'black') {
        setCpuThinking(false);
        return;
    }

    const searchId = ++cpuSearchId;

    const worker = getAiWorker();
    const payload = {
        type: 'search',
        searchId: searchId,
        state: cloneStateForWorker(gameState),
        difficulty: window.aiDifficulty,
    };

    function onMessage(e) {
        if (!e.data || e.data.searchId !== searchId) return;

        setCpuThinking(false);

        if (window.gameMode !== 'cpu' || gameState.turn !== 'black') return;

        if (e.data.error) {
            console.error('AI search failed:', e.data.error);
            updateStatusDisplay(getGameStatus(gameState));
            return;
        }

        const aiMove = e.data.move;
        if (aiMove) {
            gameState = applyMove(gameState, aiMove);
            refreshBoard3D();
        }
        const status = getGameStatus(gameState);
        updateStatusDisplay(status);
        if (status !== 'playing') {
            renderer.domElement.removeEventListener('click', onBoardClick);
        }
    }

    worker.addEventListener('message', onMessage, { once: true });
    worker.postMessage(payload);
}

// Called by interaction.js after every move is applied.
function onMoveComplete() {
    const status = getGameStatus(gameState);
    if (status !== 'playing') {
        setCpuThinking(false);
        updateStatusDisplay(status);
        renderer.domElement.removeEventListener('click', onBoardClick);
        return;
    }

    if (window.gameMode === 'cpu' && gameState.turn === 'black') {
        setCpuThinking(true);
        requestAnimationFrame(function () {
            requestAnimationFrame(executeCpuMove);
        });
        return;
    }

    updateStatusDisplay(status);
}

// Status Display
function updateStatusDisplay(status) {
    const el = document.getElementById('status');
    if (!el) return;
    if (isCpuThinking) return;

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
