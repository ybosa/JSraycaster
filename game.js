let world = new World()
let player = new Player(CELL_SIZE * 1.5,CELL_SIZE * 2,toRadians(90),0,world)
let viewer = new view(player)
let controller = new Controller(player,viewer.canvas)

function gameLoop() {
    player.movePlayer();
}

function displayLoop(){
    viewer.redraw();
    displayFPS()
}

setInterval(gameLoop,1000/GAME_TICK_RATE);
setInterval(displayLoop,1000/SCREEN_TICK_RATE);

//fps counter stuff
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