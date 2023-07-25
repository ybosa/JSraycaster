class Controller{

    constructor(player, canvas) {
        canvas.addEventListener("click", () => {
            canvas.requestPointerLock();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "ArrowUp") {
                player.speed = 2*CELL_SIZE;
            }
            if (e.key === "ArrowDown") {
                player.speed = -2*CELL_SIZE;
            }
            if (e.key === "ArrowRight") {
                player.sidewaysSpeed = 2*CELL_SIZE;
            }
            if (e.key === "ArrowLeft") {
                player.sidewaysSpeed = -2*CELL_SIZE;
            }
        });

        document.addEventListener("keyup", (e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                player.speed = 0;
            }
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                player.sidewaysSpeed = 0;
            }
        });

        document.addEventListener("mousemove", function (event) {
            player.angle += toRadians(event.movementX / 10);
        });

    }
}
