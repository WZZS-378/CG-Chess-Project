// game-replays.js — Famous chess games viewer with playback controls

// Database of famous games
const FAMOUS_GAMES = {
    fools_mate: {
        name: "Fool's Mate",
        white: "Example",
        black: "Example",
        date: "Classic",
        result: "0-1",
        moves: "f3 e5 g4 Qh4#"
    },
    fischer_century: {
        name: "The Game of the Century",
        white: "Bobby Fischer",
        black: "Donald Byrne",
        date: "1956",
        result: "0-1",
        moves: "Nf3 Nf6 c4 g6 Nc3 Bg7 d4 O-O Bf4 d5 Qb3 dxc4 Qxc4 c6 e4 Nbd7 Rd1 Nb6 Qc5 Bg4 Bg5 Na4 Qa3 Nxc3 bxc3 Nxe4 Bxe7 Qb6 Bc4 Rfe8 O-O Bxf3 gxf3 Rxe7 fxe4 Rxe4 Qb3 Qc7 Rd3 b5 Bxb5 cxb5 Qxb5 Rae8 Qd5 Qf4 Kg2 h5 Rf3 Qg4+ Rg3 Qf4 Rf3 Qc7 Qb5 Qe7 Qd5 h4 h3 Bh6 Rb1 Bf4 Rb7 Qf6 Rxa7 Re1 Qd7 Qg5+ Qg4 Qxg4+ hxg4 g5 Rd3 Rc1 d5 Ree1 d6 Rg1+ Kf3 h3 d7 h2"
    },
    fischer_spassky: {
        name: "Fischer vs Spassky, Game 6",
        white: "Bobby Fischer",
        black: "Boris Spassky",
        date: "1972",
        result: "1-0",
        moves: "c4 e6 Nf3 d5 d4 Nf6 Nc3 Be7 Bg5 O-O e3 h6 Bh4 b6 cxd5 Nxd5 Bxe7 Qxe7 Nxd5 exd5 Rc1 Be6 Qa4 c5 Qa3 Rc8 Bb5 a6 dxc5 bxc5 O-O Ra7 Be2 Nd7 Nd4 Qf8 Nxe6 fxe6 e4 d4 f4 Qe7 e5 Rb8 Bc4 Kh8 Qh3 Nf8 b3 a5 f5 exf5 Rxf5 Nh7 Rcf1 Qd8 Qg3 Re7 h4 Rbb7 e6 Rbc7 Qe5 Qe8 a4 Qd8 R1f2 Qe8 R2f3 Qd8 Bd3 Qe8 Qe4 Nf6 Rxf6 gxf6 Rxf6 Kg8 Bc4 Kh8 Qf4"
    }
};

// Replay state
let currentReplay = null;
let replayState = null;
let replayMoveIndex = 0;
let isReplayMode = false;
let replayMovesList = [];

function parseMovesFromSAN(movesString) {
    // Simple parser: split by spaces and filter out move numbers
    return movesString.split(/\s+/)
        .filter(m => m && !/^\d+\.?$/.test(m)) // Remove move numbers like "1.", "42."
        .map(m => m.trim())
        .filter(m => m.length > 0);
}

function initializeReplay(gameKey) {
    const game = FAMOUS_GAMES[gameKey];
    if (!game) {
        console.error("Game not found:", gameKey);
        return false;
    }

    currentReplay = game;
    replayMovesList = parseMovesFromSAN(game.moves);
    replayMoveIndex = 0;

    // Create a fresh game state for the replay
    replayState = createInitialState();
    gameState = deepCloneState(replayState);
    isReplayMode = true;

    // Remove old panels if they exist
    const oldPanel = document.getElementById("moveHistoryPanel");
    if (oldPanel) {
        document.body.removeChild(oldPanel);
    }
    const oldGameInfo = document.getElementById("game-info-panel");
    if (oldGameInfo) {
        document.body.removeChild(oldGameInfo);
    }

    // Create replay UI FIRST (before clearHistory which depends on moveList element)
    if (typeof createMoveHistoryPanel === "function") {
        createMoveHistoryPanel();
    }

    // Clear the UI
    resetCapturedLists();
    clearHistory();

    // Rebuild the board
    addShapes();
    refreshBoard3D();

    // Create game info panel
    createReplayUI(game);
    showReplayControls();

    return true;
}

function applyReplayMove(moveIndex) {
    if (moveIndex < 0 || moveIndex >= replayMovesList.length) {
        console.error("Invalid move index:", moveIndex);
        return false;
    }

    // Reset to initial state
    replayState = createInitialState();
    gameState = deepCloneState(replayState);
    resetCapturedLists();
    clearHistory();

    // Apply all moves up to moveIndex
    for (let i = 0; i <= moveIndex; i++) {
        const sanMove = replayMovesList[i];
        const move = parseSAN(replayState, sanMove);
        
        if (!move) {
            console.error("Invalid move in replay:", sanMove);
            console.error("Normalized:", normalizeSan(sanMove));
            if (typeof getFEN === 'function') {
                console.error("FEN before move:", getFEN(replayState));
            } else if (typeof replayState.fen === 'function') {
                console.error("FEN before move:", replayState.fen());
            }
            if (typeof legalMoves === 'function') {
                console.error("Legal moves:", legalMoves(replayState));
                console.error("Moves to target square:", (legalMoves(replayState) || []).filter(m => m.to && m.to.endsWith(normalizeSan(sanMove).slice(-2))));
            }
            return false;
        }


        const taken = pieceTakenByMove(replayState, move);
        replayState = applyMove(replayState, move);
        replayState.moveHistory[replayState.moveHistory.length - 1].san = sanMove;

        if (taken) {
            if (taken.color === 'white') capturedWhiteList.push({ type: taken.type });
            else capturedBlackList.push({ type: taken.type });
        }

        addMoveToHistory(sanMove);
    }

    gameState = deepCloneState(replayState);
    replayMoveIndex = moveIndex;
    refreshBoard3D();
    updateReplayControls();

    return true;
}

function nextReplayMove() {
    if (replayMoveIndex + 1 < replayMovesList.length) {
        applyReplayMove(replayMoveIndex + 1);
    }
}

function prevReplayMove() {
    if (replayMoveIndex > 0) {
        applyReplayMove(replayMoveIndex - 1);
    } else if (replayMoveIndex === 0 && replayMovesList.length > 0) {
        // Reset to initial position
        replayMoveIndex = -1;
        replayState = createInitialState();
        gameState = deepCloneState(replayState);
        resetCapturedLists();
        clearHistory();
        refreshBoard3D();
        updateReplayControls();
    }
}

function firstReplayMove() {
    replayMoveIndex = -1;
    replayState = createInitialState();
    gameState = deepCloneState(replayState);
    resetCapturedLists();
    clearHistory();
    refreshBoard3D();
    updateReplayControls();
}

function lastReplayMove() {
    if (replayMovesList.length > 0) {
        applyReplayMove(replayMovesList.length - 1);
    }
}

function exitReplayMode() {
    isReplayMode = false;
    currentReplay = null;
    replayState = null;
    replayMoveIndex = 0;
    replayMovesList = [];

    // Remove replay UI panels
    const replayUI = document.getElementById("replay-controls");
    if (replayUI) {
        document.body.removeChild(replayUI);
    }
    const gameInfo = document.getElementById("game-info-panel");
    if (gameInfo) {
        document.body.removeChild(gameInfo);
    }
    const movePanel = document.getElementById("moveHistoryPanel");
    if (movePanel) {
        document.body.removeChild(movePanel);
    }

    // Return to main menu
    showMainMenu();
}

function createReplayUI(game) {
    const container = document.createElement("div");
    container.id = "game-info-panel";
    container.style.cssText = `
        position: absolute;
        top: 20px;
        left: 20px;
        background: rgba(255, 255, 255, 0.95);
        padding: 15px;
        border-radius: 8px;
        max-width: 300px;
        font-family: Arial, sans-serif;
        z-index: 100;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;

    const title = document.createElement("h3");
    title.innerText = game.name;
    title.style.margin = "0 0 8px 0";
    title.style.fontSize = "18px";

    const info = document.createElement("p");
    info.style.cssText = `
        margin: 4px 0;
        font-size: 13px;
        color: #666;
    `;
    info.innerText = `${game.white} vs ${game.black}\n${game.date}`;

    const result = document.createElement("p");
    result.style.cssText = `
        margin: 8px 0 0 0;
        font-size: 13px;
        font-weight: bold;
        color: #333;
    `;
    const resultText = game.result === '0-1' ? 'Black wins' : game.result === '1-0' ? 'White wins' : 'Draw';
    result.innerText = `Result: ${resultText}`;

    const moveCounter = document.createElement("p");
    moveCounter.id = "replay-move-counter";
    moveCounter.style.cssText = `
        margin: 8px 0 0 0;
        font-size: 12px;
        color: #555;
    `;
    moveCounter.innerText = `Move: 0 / ${replayMovesList.length}`;

    container.appendChild(title);
    container.appendChild(info);
    container.appendChild(result);
    container.appendChild(moveCounter);
    document.body.appendChild(container);
}

function showReplayControls() {
    const controls = document.createElement("div");
    controls.id = "replay-controls";
    controls.style.cssText = `
        position: absolute;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(50, 50, 50, 0.95);
        padding: 15px;
        border-radius: 8px;
        display: flex;
        gap: 10px;
        z-index: 100;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;

    const buttonStyle = `
        padding: 10px 14px;
        font-size: 14px;
        font-weight: bold;
        background: #2196F3;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s;
        user-select: none;
    `;

    const smallButtonStyle = `
        ${buttonStyle}
        padding: 10px 12px;
        font-size: 16px;
    `;

    // First move button
    const firstBtn = document.createElement("button");
    firstBtn.innerText = "⏮";
    firstBtn.title = "First move";
    firstBtn.style.cssText = smallButtonStyle;
    firstBtn.onmouseenter = () => firstBtn.style.background = "#1976D2";
    firstBtn.onmouseleave = () => firstBtn.style.background = "#2196F3";
    firstBtn.onclick = firstReplayMove;

    // Previous move button
    const prevBtn = document.createElement("button");
    prevBtn.innerText = "⏪";
    prevBtn.title = "Previous move";
    prevBtn.style.cssText = smallButtonStyle;
    prevBtn.onmouseenter = () => prevBtn.style.background = "#1976D2";
    prevBtn.onmouseleave = () => prevBtn.style.background = "#2196F3";
    prevBtn.onclick = prevReplayMove;

    // Next move button
    const nextBtn = document.createElement("button");
    nextBtn.innerText = "⏩";
    nextBtn.title = "Next move";
    nextBtn.style.cssText = smallButtonStyle;
    nextBtn.onmouseenter = () => nextBtn.style.background = "#1976D2";
    nextBtn.onmouseleave = () => nextBtn.style.background = "#2196F3";
    nextBtn.onclick = nextReplayMove;

    // Last move button
    const lastBtn = document.createElement("button");
    lastBtn.innerText = "⏭";
    lastBtn.title = "Last move";
    lastBtn.style.cssText = smallButtonStyle;
    lastBtn.onmouseenter = () => lastBtn.style.background = "#1976D2";
    lastBtn.onmouseleave = () => lastBtn.style.background = "#2196F3";
    lastBtn.onclick = lastReplayMove;

    // Exit button
    const exitBtn = document.createElement("button");
    exitBtn.innerText = "Exit";
    exitBtn.style.cssText = `
        ${buttonStyle}
        background: #f44336;
    `;
    exitBtn.onmouseenter = () => exitBtn.style.background = "#d32f2f";
    exitBtn.onmouseleave = () => exitBtn.style.background = "#f44336";
    exitBtn.onclick = exitReplayMode;

    controls.appendChild(firstBtn);
    controls.appendChild(prevBtn);
    controls.appendChild(nextBtn);
    controls.appendChild(lastBtn);
    controls.appendChild(exitBtn);
    document.body.appendChild(controls);
}

function updateReplayControls() {
    const counter = document.getElementById("replay-move-counter");
    if (counter) {
        const currentMove = replayMoveIndex + 1;
        counter.innerText = `Move: ${currentMove} / ${replayMovesList.length}`;
    }
}

function showGameSelection() {
    hideStatusBar();

    const menu = document.createElement("div");
    menu.style.position = "absolute";
    menu.style.top = "50%";
    menu.style.left = "50%";
    menu.style.transform = "translate(-50%, -50%)";
    menu.style.textAlign = "center";
    menu.style.zIndex = "1000";

    const title = document.createElement("h2");
    title.innerText = "Famous Games";
    title.style.fontSize = "32px";
    title.style.marginBottom = "30px";

    const gamesList = document.createElement("div");

    // Create button for each game
    for (const [key, game] of Object.entries(FAMOUS_GAMES)) {
        const gameBtn = document.createElement("button");
        gameBtn.innerText = `${game.name}\n${game.white} vs ${game.black} (${game.date})`;
        gameBtn.style.cssText = `
            display: block;
            width: 400px;
            padding: 16px;
            font-size: 16px;
            font-weight: bold;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            margin: 10px auto;
            transition: transform 0.1s ease, background 0.2s;
            white-space: pre-wrap;
        `;

        gameBtn.onmouseenter = () => gameBtn.style.background = "#45a049";
        gameBtn.onmouseleave = () => gameBtn.style.background = "#4CAF50";
        gameBtn.onmousedown = () => gameBtn.style.transform = "scale(0.95)";
        gameBtn.onmouseup = () => gameBtn.style.transform = "scale(1)";

        gameBtn.onclick = () => {
            document.body.removeChild(menu);
            if (initializeReplay(key)) {
                // Disable board interaction during replay
                renderer.domElement.style.pointerEvents = "none";
            }
        };

        gamesList.appendChild(gameBtn);
    }

    const backBtn = document.createElement("button");
    backBtn.innerText = "Back";
    backBtn.style.cssText = `
        padding: 14px 32px;
        font-size: 18px;
        font-weight: bold;
        background: #f44336;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        margin-top: 20px;
        transition: transform 0.1s ease, background 0.2s;
    `;

    backBtn.onmouseenter = () => backBtn.style.background = "#d32f2f";
    backBtn.onmouseleave = () => backBtn.style.background = "#f44336";
    backBtn.onmousedown = () => backBtn.style.transform = "scale(0.95)";
    backBtn.onmouseup = () => backBtn.style.transform = "scale(1)";

    backBtn.onclick = () => {
        document.body.removeChild(menu);
        showMainMenu();
    };

    menu.appendChild(title);
    menu.appendChild(gamesList);
    menu.appendChild(backBtn);
    document.body.appendChild(menu);
}
