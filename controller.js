class Controller{

    constructor(player, canvas) {
        canvas.addEventListener("click", () => {
            canvas.requestPointerLock();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "ArrowUp") {
                player.speed = 2;
            }
            if (e.key === "ArrowDown") {
                player.speed = -2;
            }
        });

        document.addEventListener("keyup", (e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                player.speed = 0;
            }
        });

        document.addEventListener("mousemove", function (event) {
            player.angle += toRadians(event.movementX / 10);
        });

    }
}
