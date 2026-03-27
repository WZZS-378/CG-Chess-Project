

function createCube(size, color) {
    var material = new THREE.MeshBasicMaterial();
    material.color = new THREE.Color(color);
    material.wireframe = false;
    var geometry = new THREE.BoxGeometry(size, size, size);
    var cube = new THREE.Mesh(geometry, material);
    return cube;
}

function createCilinder(size, color) {
    var material = new THREE.MeshBasicMaterial();
    material.color = new THREE.Color(color);
    material.wireframe = false;
    var geometry = new THREE.CylinderGeometry(size / 2, size / 2, size, 32);
    var cilinder = new THREE.Mesh(geometry, material);
    return cilinder;
}

function createVillage(numOfHouses, size) {
    let village = new THREE.Group();
    for (let i = 0; i < numOfHouses; i++) {
        let house = createCube(size, 0x8B4513); // brown houses
        village.add(house);
    }
    return village;
}

function createCastle(size) {
    // Create a castle using a single cube
    let castle = new THREE.Group();

    let base = createCube(size * 1.2, 0x808080); // gray base
    base.scale.y = size * 1.2; 
    castle.add(base);

    tower1 = createCilinder(size / 2, 0x696969); // darker gray towers
    tower1.position.set(-size / 2, 0, -size / 2);
    tower1.scale.y = size * 3.5;
    castle.add(tower1);

    tower2 = createCilinder(size / 2, 0x696969);    
    tower2.position.set(size / 2, 0, -size / 2);
    tower2.scale.y = size * 3.5;
    castle.add(tower2);

    tower3 = createCilinder(size / 2, 0x696969);
    tower3.position.set(-size / 2, 0, size / 2);
    tower3.scale.y = size * 3.5;
    castle.add(tower3);

    tower4 = createCilinder(size / 2, 0x696969);
    tower4.position.set(size / 2, 0, size / 2);
    tower4.scale.y = size * 3.5;
    castle.add(tower4);

    return castle;
}

// Generate a grid of cubes with random heights/colors for terrain
function generateTerrainGrid(rows, cols, spacing, baseSize, minHeight, maxHeight, housesChance, castlesChance) {
    spacing = baseSize * 1.05; // adjust spacing based on base size to prevent overlap
    
    // Loop through grid positions and create cubes with random heights and colors
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            var baseColor;

            // Compute x and z positions based on grid indices and spacing
            let x = (j - cols / 2) * spacing;
            let z = (i - rows / 2) * spacing;

            // Random height for terrain effect
            let height = minHeight + Math.random() * (maxHeight - minHeight);

            // Add different colors tone based on height
            if (height < minHeight + (maxHeight - minHeight) * 0.4){
                baseColor = 0x4ea24e;
            } else if (height < minHeight + (maxHeight - minHeight) * 0.7){
                baseColor = 0x389638;
            } else {
                baseColor = 0x228B22;
            }

            // Add random structures on some cubes
            if (Math.random() < housesChance && height < minHeight + (maxHeight - minHeight) * 0.4) { // chance to add a village on lower terrain
                let village = createVillage(3, baseSize / 2);
                village.position.set(x, height * baseSize, z);
                scene.add(village);

            } else if (Math.random() < castlesChance && height > minHeight + (maxHeight - minHeight) * 0.7) { // chance to add a castle on higher terrain
                let castle = createCastle(baseSize / 2);
                castle.position.set(x, height * baseSize, z);
                scene.add(castle);
            }

            // Create cube, scale by height, position on grid, and add to scene
            let cube = createCube(baseSize, baseColor);
            cube.scale.y = height;
            cube.position.set(x, (baseSize * height) / 2, z);
            scene.add(cube);
        }
    }
}

// Define the add shapes function
function addShapes(){
        generateTerrainGrid(8, 8, 3.0, 3, 0.5, 1, 0.4, 0.05);
}