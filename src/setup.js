var scene;
var camera;
var renderer;
var controls;   

function setScene() {
    scene = new THREE.Scene(); 
    var ratio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(45, ratio, 0.1, 1000);
    camera.position.set(15, 12, 15);
    camera.lookAt(0, 0, 0);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio); 
    renderer.setSize(window.innerWidth, window.innerHeight); 
    renderer.setClearColor(0x5bb1cd, 1);
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
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
}

var resizeScene = function() {
    var width = window.innerWidth; 
    var height = window.innerHeight; 
    renderer.setSize(width, height); 
    camera.aspect = width / height; 
    camera.updateProjectionMatrix(); 
    renderer.render(scene, camera);
};