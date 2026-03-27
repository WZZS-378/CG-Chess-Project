function run() {
    setScene();
    addShapes();
    window.addEventListener("resize", resizeScene);
    renderer.render(scene, camera);
    animate();
}
run();