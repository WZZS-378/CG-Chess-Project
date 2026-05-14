var scene;
var camera;
var renderer;
var controls;
var currentSkybox = null;
var skyboxMesh = null;
var textureLoader = new THREE.TextureLoader();
var currentBackgroundColor = 0x5bb1cd;

// HOW TO ADD NEW SKYBOXES:
// 1. Create a new folder in skyboxes/ with your texture files (e.g., skyboxes/my_skybox/)
// 2. Add an entry to SKYBOX_CONFIG below with this structure:
//    mysky: {
//      label: "Display Name",
//      type: "texture",
//      faces: {
//        right: "path/to/right.jpg",
//        left: "path/to/left.jpg",
//        top: "path/to/top.jpg",
//        bottom: "path/to/bottom.jpg",
//        front: "path/to/front.jpg",
//        back: "path/to/back.jpg"
//      }
//    }
// 3. The skybox will automatically appear in the UI dropdown

// Skybox configuration - defines available skyboxes
// Face order: right, left, top, bottom, front, back (matches BoxGeometry material order)
var SKYBOX_CONFIG = {
    none: { label: "Solid Color", type: "color" },
    harmony: {
        label: "Harmony",
        type: "texture",
        faces: {
            right: "skyboxes/harmony/harmony_lf.jpg",
            left: "skyboxes/harmony/harmony_rt.jpg",
            top: "skyboxes/harmony/harmony_up.jpg",
            bottom: "skyboxes/harmony/harmony_dn.jpg",
            front: "skyboxes/harmony/harmony_ft.jpg",
            back: "skyboxes/harmony/harmony_bk.jpg"
        }
    },
    night_sky: { 
        label: "Night Sky", 
        type: "texture",
        faces: {
            right: "skyboxes/night_sky/skybox_left.png",
            left: "skyboxes/night_sky/skybox_right.png",
            top: "skyboxes/night_sky/skybox_up.png",
            bottom: "skyboxes/night_sky/skybox_down.png",
            front: "skyboxes/night_sky/skybox_front.png",
            back: "skyboxes/night_sky/skybox_back.png"
        }
    },
    mystic: {
        label: "Mystic",
        type: "texture",
        faces: {
            right: "skyboxes/mystic/mystic_lf.jpg",
            left: "skyboxes/mystic/mystic_rt.jpg",
            top: "skyboxes/mystic/mystic_up.jpg",
            bottom: "skyboxes/mystic/mystic_dn.jpg",
            front: "skyboxes/mystic/mystic_ft.jpg",
            back: "skyboxes/mystic/mystic_bk.jpg"
        }
    },
    sun: {
        label: "Sun",
        type: "texture",
        faces: {
            right: "skyboxes/sun/sun_lf.jpg",
            left: "skyboxes/sun/sun_rt.jpg",
            top: "skyboxes/sun/sun_up.jpg",
            bottom: "skyboxes/sun/sun_dn.jpg",
            front: "skyboxes/sun/sun_ft.jpg",
            back: "skyboxes/sun/sun_bk.jpg"
        }
    },
    tropic: {
        label: "Tropic",
        type: "texture",
        faces: {
            right: "skyboxes/tropic/tropic_lf.jpg",
            left: "skyboxes/tropic/tropic_rt.jpg",
            top: "skyboxes/tropic/tropic_up.jpg",
            bottom: "skyboxes/tropic/tropic_dn.jpg",
            front: "skyboxes/tropic/tropic_ft.jpg",
            back: "skyboxes/tropic/tropic_bk.jpg"
        }
    },
    yonder: {
        label: "Yonder",
        type: "texture",
        faces: {
            right: "skyboxes/yonder/yonder_lf.jpg",
            left: "skyboxes/yonder/yonder_rt.jpg",
            top: "skyboxes/yonder/yonder_up.jpg",
            bottom: "skyboxes/yonder/yonder_dn.jpg",
            front: "skyboxes/yonder/yonder_ft.jpg",
            back: "skyboxes/yonder/yonder_bk.jpg"
        }
    }
};

function setScene() {
    scene = new THREE.Scene(); 
    var ratio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(45, ratio, 0.1, 1000);
    camera.position.set(15, 12, 15);
    camera.lookAt(0, 0, 0);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio); 
    renderer.setSize(window.innerWidth, window.innerHeight); 
    renderer.setClearColor(currentBackgroundColor, 1);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement); 

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true; 
    controls.minDistance = 5; 
    controls.maxDistance = 50;
    controls.enableDamping = true;
    controls.dampingFactor = 1;
    controls.enablePan = false;

    // Initialize with default skybox
    setSkybox("none");
}

// Set background to solid color
function setBackgroundColor(hexColor) {
    currentBackgroundColor = hexColor;
    renderer.setClearColor(hexColor, 1);
}

// Load and apply a textured skybox
function setSkybox(skyboxName) {
    currentSkybox = skyboxName;
    
    // Remove existing skybox mesh if present
    if (skyboxMesh) {
        scene.remove(skyboxMesh);
        skyboxMesh = null;
    }

    if (skyboxName === "none") {
        // Just use solid color background
        return;
    }

    var config = SKYBOX_CONFIG[skyboxName];
    if (!config) {
        console.warn("Skybox not found:", skyboxName);
        return;
    }

    if (config.type !== "texture") {
        console.warn("Unsupported skybox type:", config.type);
        return;
    }

    // Face order for BoxGeometry: right, left, top, bottom, front, back
    var faceOrder = ["right", "left", "top", "bottom", "front", "back"];
    var loadedTextures = {};
    var totalToLoad = faceOrder.length;
    var loadedCount = 0;

    // Load each texture and track by face name
    faceOrder.forEach(function(face) {
        var filePath = config.faces[face];
        if (!filePath) {
            console.error("Missing texture file for face:", face);
            return;
        }

        textureLoader.load(filePath, function(texture) {
            loadedTextures[face] = texture;
            loadedCount++;

            if (loadedCount === totalToLoad) {
                // All textures loaded, create skybox with correct order
                createSkyboxMesh(faceOrder, loadedTextures);
            }
        }, undefined, function(error) {
            console.error("Error loading skybox texture:", filePath, error);
        });
    });
}

// Create a skybox mesh from textures in correct face order
function createSkyboxMesh(faceOrder, loadedTextures) {
    // Build materials array in correct order: right, left, top, bottom, front, back
    var materials = faceOrder.map(function(face) {
        return new THREE.MeshBasicMaterial({ 
            map: loadedTextures[face],
            side: THREE.BackSide,
            toneMappingExposure: 1
        });
    });

    // Create a large cube geometry - static skybox positioned at origin
    var geometry = new THREE.BoxGeometry(200, 200, 200);
    skyboxMesh = new THREE.Mesh(geometry, materials);
    
    // Position at origin (0, 0, 0) - static, not following camera
    skyboxMesh.position.set(0, 0, 0);
    
    scene.add(skyboxMesh);
}

// Update skybox position to follow camera (call in animation loop)
function updateSkyboxPosition() {
    // Static skybox - no update needed
}

var resizeScene = function() {
    var width = window.innerWidth; 
    var height = window.innerHeight; 
    renderer.setSize(width, height); 
    camera.aspect = width / height; 
    camera.updateProjectionMatrix(); 
    renderer.render(scene, camera);
};