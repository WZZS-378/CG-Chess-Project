function run() {
    setScene();
    addShapes(); // This now loads pieces with placePieces()
    window.addEventListener("resize", resizeScene);
    renderer.render(scene, camera);
    animate();
}
run();