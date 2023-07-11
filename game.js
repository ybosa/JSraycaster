let TICK = 30; //currently, both physics and graphics run from this tick
let world = new World()
let map = world.map
let player = new Player(CELL_SIZE * 1.5,CELL_SIZE * 2,toRadians(0),0,world)
let viewer = new view()
let controller = new Controller(player,viewer.canvas)

function gameLoop() {
    player.movePlayer();
    viewer.redraw();
    // displayFPS()
}

setInterval(gameLoop,TICK);

let time = Date.now()
let count = 0

function displayFPS(){
    count++
    if(Date.now() - time > 1000){
        console.log("fps: "+count)
        count = 0
        time = Date.now()
    }
}