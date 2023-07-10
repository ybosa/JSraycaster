const TICK = 30;
const world = new World()
const map = world.map
const player = new Player(CELL_SIZE * 1.5,CELL_SIZE * 2,toRadians(0),0,world)
const viewer = new view()
const controller = new Controller(player,viewer.canvas)

function gameLoop() {
    player.movePlayer();
    viewer.redraw();
}

setInterval(gameLoop, TICK);