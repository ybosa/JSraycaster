const TICK = 30;
const world = new World()
const map = world.map
const player = new Player(CELL_SIZE * 1.5,CELL_SIZE * 2,toRadians(0),0,world)

const controller = new Controller(player,canvas)

function gameLoop() {
    player.movePlayer();
    const rays = getRays();
    redraw(rays);
}

setInterval(gameLoop, TICK);