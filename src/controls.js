// src/controls.js
// dat.GUI controls for real-time parameter adjustment

// Default parameters for terrain and structures
const params = {
    rows: 8,
    cols: 8,
    spacing: 3.0,
    baseSize: 3,
    minHeight: 0.5,
    maxHeight: 1,
    housesChance: 0.4,
    castlesChance: 0.05,
    regenerate: function() {
        // Remove all objects except camera/lights (assumes scene is global)
        for (let i = scene.children.length - 1; i >= 0; i--) {
            let obj = scene.children[i];
            if (!(obj.isCamera || obj.isLight)) {
                scene.remove(obj);
            }
        }
        // Rebuild terrain
        generateTerrainGrid(
            params.rows,
            params.cols,
            params.spacing,
            params.baseSize,
            params.minHeight,
            params.maxHeight,
            params.housesChance,
            params.castlesChance
        );
    }
};

// Initialize dat.GUI
window.addEventListener('DOMContentLoaded', function() {
    if (typeof dat === 'undefined') return;
    let gui = new dat.GUI({ autoPlace: false });
    document.getElementById('menu').appendChild(gui.domElement);
// Add controls for parameters
    gui.add(params, 'rows', 2, 30, 1).onFinishChange(params.regenerate);
    gui.add(params, 'cols', 2, 30, 1).onFinishChange(params.regenerate);
    gui.add(params, 'baseSize', 1, 10, 0.1).onFinishChange(params.regenerate);
    gui.add(params, 'minHeight', 0.1, 2, 0.1).onFinishChange(params.regenerate);
    gui.add(params, 'maxHeight', 0.2, 2, 0.1).onFinishChange(params.regenerate);
    gui.add(params, 'housesChance', 0, 1, 0.01).onFinishChange(params.regenerate);
    gui.add(params, 'castlesChance', 0, 1, 0.01).onFinishChange(params.regenerate);
    gui.add(params, 'regenerate').name('Regenerate Terrain');

    // Initial build
    params.regenerate();
});
