const raycaster = new THREE.Raycaster();
const mouse     = new THREE.Vector2();

// Selection State
let selectedSquare     = null;
let highlightedSquares = [];

const HIGHLIGHT_SELECTED = 0xffcc00;  // gold  — the square of the selected piece
const HIGHLIGHT_MOVE     = 0x44aa44;  // green — valid move (empty square)
const HIGHLIGHT_CAPTURE  = 0xdd3333;  // red   — valid capture (enemy piece)

// Highlight Helpers
function highlightSquares(moveTargets, selectedIdx) {
    clearHighlights();

    if (selectedIdx !== undefined) {
        const mesh = squareMeshByIndex[selectedIdx];
        if (mesh) {
            const isBlack = (sqRow(selectedIdx) + sqCol(selectedIdx)) % 2 === 0;
            const base = new THREE.Color(isBlack ? blackSquareColor : whiteSquareColor);
            base.lerp(new THREE.Color(HIGHLIGHT_SELECTED), 0.55);
            mesh.material.color.copy(base);
            highlightedSquares.push(selectedIdx);
        }
    }

    for (const idx of moveTargets) {
        const mesh = squareMeshByIndex[idx];
        if (!mesh) continue;
        const isBlack   = (sqRow(idx) + sqCol(idx)) % 2 === 0;
        const isCapture = gameState.board[idx] !== null;
        const tint      = isCapture ? HIGHLIGHT_CAPTURE : HIGHLIGHT_MOVE;
        const base      = new THREE.Color(isBlack ? blackSquareColor : whiteSquareColor);
        base.lerp(new THREE.Color(tint), 0.55);
        mesh.material.color.copy(base);
        highlightedSquares.push(idx);
    }
}

function clearHighlights() {
    for (const idx of highlightedSquares) {
        const mesh = squareMeshByIndex[idx];
        if (!mesh) continue;
        // Restore the square's original colour from the board pattern.
        // sqRow / sqCol are helpers defined in engine.js.
        const isBlack = (sqRow(idx) + sqCol(idx)) % 2 === 0;
        mesh.material.color.setHex(isBlack ? blackSquareColor : whiteSquareColor);
    }
    highlightedSquares = [];
}

// Raycasting
// Returns the boardIndex of the square under the cursor, or null if none.
function getClickedSquare(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x =  ((event.clientX - rect.left) / rect.width)  * 2 - 1;
    mouse.y = -((event.clientY - rect.top)  / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(squareMeshes);
    return hits.length > 0 ? hits[0].object.userData.boardIndex : null;
}

// Click Handler
function onBoardClick(event) {
    const square = getClickedSquare(event);

    if (square === null) {
        clearHighlights();
        selectedSquare = null;
        return;
    }

    if (selectedSquare === null) {
        // First click — select a friendly piece
        const p = gameState.board[square];
        if (p && p.color === gameState.turn) {
            selectedSquare = square;
            highlightSquares(getLegalMoves(gameState, square), square);
        }
    } else {
        const legal = getLegalMoves(gameState, selectedSquare);

        if (legal.includes(square)) {
            // Valid destination — execute the move
            gameState = applyMove(gameState, { from: selectedSquare, to: square });
            clearHighlights();
            selectedSquare = null;
            refreshBoard3D();
            onMoveComplete();
        } else {
            // Try re-selecting a different friendly piece, or deselect
            const p = gameState.board[square];
            if (p && p.color === gameState.turn) {
                selectedSquare = square;
                highlightSquares(getLegalMoves(gameState, square), square);
            } else {
                clearHighlights();
                selectedSquare = null;
            }
        }
    }
}

// Make Pieces Click-Through
// Overrides the raycast method on every piece mesh so clicks always reach the square beneath rather than being swallowed by a piece's geometry.
function disablePieceRaycast() {
    if (!piecesGroup) return;
    piecesGroup.traverse(function (child) {
        if (child.isMesh) child.raycast = function () {};
    });
}
