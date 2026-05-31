// game.js

// Piece colours
let currentWhitePieceColor = 0xfaf0dc;
let currentBlackPieceColor = 0x222222;

// Game mode — 'local' or 'cpu'
window.gameMode = window.gameMode || "local";
window.aiDifficulty = window.aiDifficulty || "medium";

// Game state
let gameState = createInitialState();

// Captured pieces
let capturedWhiteList = [];
let capturedBlackList = [];

function pieceTakenByMove(state, move) {
  var mover = state.board[move.from];
  if (!mover) return null;
  var victim = state.board[move.to];
  if (victim && victim.color !== mover.color) {
    return { type: victim.type, color: victim.color };
  }
  if (mover.type === "pawn" && move.to === state.enPassantSquare) {
    var dir = mover.color === "white" ? 1 : -1;
    var capIdx = move.to - dir * 8;
    var ep = state.board[capIdx];
    if (ep) return { type: ep.type, color: ep.color };
  }
  return null;
}

function applyGameMove(move) {
  const san = moveToSAN(gameState, move);
  var taken = pieceTakenByMove(gameState, move);
  gameState = applyMove(gameState, move);
  gameState.moveHistory[gameState.moveHistory.length - 1].san = san;

  if (taken) {
    if (taken.color === "white") capturedWhiteList.push({ type: taken.type });
    else capturedBlackList.push({ type: taken.type });
  }

  refreshBoard3D();
  addMoveToHistory(san);
}

function resetCapturedLists() {
  capturedWhiteList = [];
  capturedBlackList = [];
}

// ── AI Web Worker ──────────────────────────────────────────────────────────────

let aiWorker = null;
let cpuSearchId = 0;

function getAiWorker() {
  if (!aiWorker) {
    aiWorker = new Worker("src/chess-ai.worker.js");
    aiWorker.onerror = function (err) {
      console.error("AI worker error:", err);
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

// ── 3D Sync ────────────────────────────────────────────────────────────────────

function refreshBoard3D() {
  if (piecesGroup) scene.remove(piecesGroup);
  piecesGroup = new THREE.Group();

  for (let i = 0; i < 64; i++) {
    const p = gameState.board[i];
    if (!p || !modelCache[p.type]) continue;

    const r = sqRow(i);
    const c = sqCol(i);
    const color =
      p.color === "white" ? currentWhitePieceColor : currentBlackPieceColor;

    const mesh = colorizeModel(modelCache[p.type], color);
    mesh.scale.set(0.18, 0.18, 0.18);
    mesh.position.set(3.5 - c, 0.1, r - 3.5);
    mesh.rotation.y = p.color === "white" ? Math.PI : 0;
    mesh.userData.boardIndex = i;
    mesh.userData.type = "piece";
    piecesGroup.add(mesh);
  }

  scene.add(piecesGroup);

  if (typeof disablePieceRaycast === "function") disablePieceRaycast();
  if (typeof controls !== "undefined" && controls && controls.update)
    controls.update();
  if (typeof renderer !== "undefined" && renderer && scene && camera) {
    renderer.render(scene, camera);
  }
  if (typeof refreshCaptured3D === "function") {
    refreshCaptured3D(
      capturedWhiteList,
      capturedBlackList,
      currentWhitePieceColor,
      currentBlackPieceColor,
    );
  }
}

// ── Status Bar ─────────────────────────────────────────────────────────────────

let isCpuThinking = false;

function setStatusBarTheme(theme) {
  const bar = document.getElementById("status-bar");
  if (!bar) return;
  bar.classList.remove(
    "status-bar--white-turn",
    "status-bar--black-turn",
    "status-bar--neutral",
  );
  if (theme === "white") bar.classList.add("status-bar--white-turn");
  else if (theme === "black") bar.classList.add("status-bar--black-turn");
  else bar.classList.add("status-bar--neutral");
}

function setCpuThinking(on) {
  isCpuThinking = !!on;
  const el = document.getElementById("status");
  if (!el) return;
  if (on) {
    el.textContent = "CPU is thinking\u2026";
    setStatusBarTheme("black");
  } else {
    updateStatusDisplay(getGameStatus(gameState));
  }
}

function showStatusBar() {
  const bar = document.getElementById("status-bar");
  if (!bar) return;
  bar.setAttribute("aria-hidden", "false");
  bar.classList.remove("status-bar--hidden");
  bar.classList.add("status-bar--visible");
}

function hideStatusBar() {
  const bar = document.getElementById("status-bar");
  if (!bar) return;
  bar.setAttribute("aria-hidden", "true");
  bar.classList.add("status-bar--hidden");
  bar.classList.remove(
    "status-bar--visible",
    "status-bar--white-turn",
    "status-bar--black-turn",
    "status-bar--neutral",
  );
}

// ── Game Flow ──────────────────────────────────────────────────────────────────

function startGame() {
  terminateAiWorker();
  cpuSearchId++;
  isCpuThinking = false;

  gameState = createInitialState();
  resetCapturedLists();
  createChessBoard(currentWhitePieceColor, currentBlackPieceColor, 0xbb4513);
  refreshBoard3D();
  showStatusBar();
  if (typeof showSettingsButton === "function") showSettingsButton();
  updateStatusDisplay();

  renderer.domElement.removeEventListener("click", onBoardClick);
  renderer.domElement.addEventListener("click", onBoardClick);

  // Start the clock when one has been initialised (local games only)
  if (typeof startClock === "function" && window.clockEnabled) {
    startClock();
  }
}

function executeCpuMove() {
  if (window.gameMode !== "cpu" || gameState.turn !== "black") {
    setCpuThinking(false);
    return;
  }

  const searchId = ++cpuSearchId;
  const worker = getAiWorker();
  const payload = {
    type: "search",
    searchId: searchId,
    state: cloneStateForWorker(gameState),
    difficulty: window.aiDifficulty,
  };

  function onMessage(e) {
    if (!e.data || e.data.searchId !== searchId) return;
    setCpuThinking(false);
    if (window.gameMode !== "cpu" || gameState.turn !== "black") return;

    if (e.data.error) {
      console.error("AI search failed:", e.data.error);
      updateStatusDisplay(getGameStatus(gameState));
      return;
    }

    const aiMove = e.data.move;
    if (aiMove) applyGameMove(aiMove);

    const status = getGameStatus(gameState);
    updateStatusDisplay(status);
    if (status !== "playing") {
      renderer.domElement.removeEventListener("click", onBoardClick);
      showEndScreenFromStatus(status);
    }
  }

  worker.addEventListener("message", onMessage, { once: true });
  worker.postMessage(payload);
}

// Called by interaction.js after every human move
function onMoveComplete() {
  const status = getGameStatus(gameState);

  // Game over — show end screen and stop everything
  if (status !== "playing") {
    setCpuThinking(false);
    if (typeof stopClock === "function") stopClock();
    updateStatusDisplay(status);
    renderer.domElement.removeEventListener("click", onBoardClick);
    showEndScreenFromStatus(status);
    return; // ← must return so we don't also trigger CPU move
  }

  // Hand off to CPU if applicable
  if (window.gameMode === "cpu" && gameState.turn === "black") {
    setCpuThinking(true);
    requestAnimationFrame(function () {
      requestAnimationFrame(executeCpuMove);
    });
    return;
  }

  // Local game: switch the clock after each human move
  if (
    typeof switchClock === "function" &&
    window.clockEnabled &&
    window.gameMode === "local"
  ) {
    switchClock();
  }

  updateStatusDisplay(status);
}

// ── Status Display ─────────────────────────────────────────────────────────────

function updateStatusDisplay(status) {
  const el = document.getElementById("status");
  if (!el) return;
  if (isCpuThinking) return;

  if (!status || status === "playing") {
    const checked = isInCheck(gameState.board, gameState.turn);
    el.textContent = checked
      ? cap(gameState.turn) + " to move \u2014 Check!"
      : cap(gameState.turn) + " to move";
    setStatusBarTheme(gameState.turn === "white" ? "white" : "black");
  } else if (status === "checkmate") {
    const winner = gameState.turn === "white" ? "Black" : "White";
    el.textContent = "Checkmate \u2014 " + winner + " wins!";
    setStatusBarTheme(gameState.turn === "white" ? "black" : "white");
  } else if (status === "stalemate") {
    el.textContent = "Stalemate \u2014 Draw!";
    setStatusBarTheme("neutral");
  } else if (status === "draw-50move") {
    el.textContent = "Draw by the 50-move rule.";
    setStatusBarTheme("neutral");
  }
}

function cap(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── SAN Helpers ────────────────────────────────────────────────────────────────

function parseSAN(state, san) {
  san = san.replace(/[+#]$/, "");

  if (san === "O-O" || san === "O-O-O") {
    const kingPos = state.board.findIndex(
      (p) => p && p.type === "king" && p.color === state.turn,
    );
    const legalMoves = getLegalMoves(state, kingPos);
    for (const to of legalMoves) {
      if (Math.abs(sqCol(to) - sqCol(kingPos)) !== 2) continue;
      if (
        (san === "O-O" && sqCol(to) === 6) ||
        (san === "O-O-O" && sqCol(to) === 2)
      ) {
        return { from: kingPos, to };
      }
    }
    return null;
  }

  const pieceMap = {
    N: "knight",
    B: "bishop",
    R: "rook",
    Q: "queen",
    K: "king",
  };
  let pieceType = "pawn";
  let i = 0;
  if (pieceMap[san[0]]) {
    pieceType = pieceMap[san[0]];
    i++;
  }

  const destFile = san[san.length - 2];
  const destRank = san[san.length - 1];
  const toCol = "abcdefgh".indexOf(destFile);
  const toRow = parseInt(destRank) - 1;
  const to = toRow * 8 + toCol;

  let disamb = san.slice(i, san.length - 2).replace("x", "");
  let fromFile = null;
  let fromRank = null;
  if (disamb.length === 1) {
    if (isNaN(disamb)) fromFile = "abcdefgh".indexOf(disamb);
    else fromRank = parseInt(disamb) - 1;
  } else if (disamb.length === 2) {
    fromFile = "abcdefgh".indexOf(disamb[0]);
    fromRank = parseInt(disamb[1]) - 1;
  }

  const candidates = [];
  for (let from = 0; from < 64; from++) {
    const p = state.board[from];
    if (!p || p.color !== state.turn || p.type !== pieceType) continue;
    if (fromFile !== null && sqCol(from) !== fromFile) continue;
    if (fromRank !== null && sqRow(from) !== fromRank) continue;
    const legalMoves = getLegalMoves(state, from);
    if (!legalMoves.includes(to)) continue;
    candidates.push({ from, to });
  }

  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) {
    for (const move of candidates) {
      if (moveToSAN(state, move) === san) return move;
    }
    console.warn("Still ambiguous SAN:", san, candidates);
    return candidates[0];
  }
  return null;
}

function moveToSAN(state, move) {
  const piece = state.board[move.from];
  const target = state.board[move.to];

  if (
    piece.type === "king" &&
    Math.abs(sqCol(move.to) - sqCol(move.from)) === 2
  ) {
    return sqCol(move.to) === 6 ? "O-O" : "O-O-O";
  }

  const pieceMap = {
    pawn: "",
    knight: "N",
    bishop: "B",
    rook: "R",
    queen: "Q",
    king: "K",
  };
  let notation = pieceMap[piece.type];

  const ambiguous = findAmbiguousMoves(state, move);
  if (ambiguous.file) notation += "abcdefgh"[sqCol(move.from)];
  if (ambiguous.rank) notation += sqRow(move.from) + 1;

  if (target || (piece.type === "pawn" && move.to === state.enPassantSquare)) {
    if (piece.type === "pawn") notation += "abcdefgh"[sqCol(move.from)];
    notation += "x";
  }

  notation += "abcdefgh"[sqCol(move.to)];
  notation += sqRow(move.to) + 1;

  if (move.promotion) notation += "=" + pieceMap[move.promotion];

  const next = applyMove(state, move);
  const status = getGameStatus(next);
  if (status === "checkmate") notation += "#";
  else if (isInCheck(next.board, next.turn)) notation += "+";

  return notation;
}

function findAmbiguousMoves(state, move) {
  const piece = state.board[move.from];
  const sameTypeMoves = [];

  for (let i = 0; i < 64; i++) {
    const p = state.board[i];
    if (
      !p ||
      p.type !== piece.type ||
      p.color !== piece.color ||
      i === move.from
    )
      continue;
    const moves = getLegalMoves(state, i);
    if (moves.includes(move.to)) sameTypeMoves.push(i);
  }

  let file = false,
    rank = false;
  for (const idx of sameTypeMoves) {
    if (sqCol(idx) === sqCol(move.from)) rank = true;
    if (sqRow(idx) === sqRow(move.from)) file = true;
  }
  return { file, rank };
}

// ── Move History ───────────────────────────────────────────────────────────────

let moveHistory = [];
let moveNumber = 1;

function addMoveToHistory(move) {
  const list = document.getElementById("moveList");
  if (!list) return;

  if (moveHistory.length % 2 === 0) {
    const row = document.createElement("div");
    row.innerText = moveNumber + ". " + move;
    row.id = "move-" + moveNumber;
    list.appendChild(row);
  } else {
    const row = document.getElementById("move-" + moveNumber);
    if (row) row.innerText += " " + move;
    moveNumber++;
  }

  moveHistory.push(move);
  list.scrollTop = list.scrollHeight;
}

function clearHistory() {
  const list = document.getElementById("moveList");
  if (list) list.innerHTML = "";
  moveHistory = [];
  moveNumber = 1;
}
