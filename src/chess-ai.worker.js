// Web Worker: loads the rules engine + AI (no DOM / no Three.js).
// importScripts URLs are resolved relative to this worker script.
importScripts('engine.js', 'ai.js');

self.onmessage = function (e) {
    var d = e.data;
    if (!d || d.type !== 'search') return;
    try {
        var move = getAIMove(d.state, d.difficulty);
        self.postMessage({ searchId: d.searchId, move: move });
    } catch (err) {
        self.postMessage({
            searchId: d.searchId,
            move: null,
            error: err && err.message ? err.message : String(err),
        });
    }
};
