let TICK = 30;
let world = new World()
let map = world.map
let player = new Player(CELL_SIZE * 1.5,CELL_SIZE * 2,toRadians(0),0,world)
let viewer = new view()
let controller = new Controller(player,viewer.canvas)

function gameLoop() {
    player.movePlayer();
    viewer.redraw();
}

setInterval(gameLoop, TICK);