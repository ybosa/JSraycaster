const TICK = 30;
function gameLoop() {
    movePlayer();
    const rays = getRays();
    redraw(rays);
}

setInterval(gameLoop, TICK);