function run() {
    setScene();
    // addShapes(); // This now loads pieces with placePieces()
    loadAllModels().then(function () {
        showMainMenu();
    });
    window.addEventListener("resize", resizeScene);
    renderer.render(scene, camera);
    animate();
}
run();