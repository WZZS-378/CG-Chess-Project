var scene;
var camera;
var renderer;
var controls;   

function setScene() {
    scene = new THREE.Scene(); 
    var ratio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(45, ratio, 0.1, 1000);
    camera.position.set(200, 200, 300);
    camera.lookAt(0, 0, 0);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio); 
    renderer.setSize(window.innerWidth, window.innerHeight); 
    renderer.setClearColor(0x5bb1cd, 1);
    document.body.appendChild(renderer.domElement); 

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true; 
    controls.minDistance = 2; 
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