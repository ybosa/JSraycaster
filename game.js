let world = new World()
world.map[2][1] = new FloorAndCeiling()
let player = new Player(CELL_SIZE * 1.5,CELL_SIZE * 2,toRadians(90),0,world)
let entityyyyyyy = new Sprite()
entityyyyyyy.imageName = "debug.png"
entityyyyyyy.x = 15.5*CELL_SIZE
entityyyyyyy.y = 2.5*CELL_SIZE
let ent2 = new Sprite()
ent2.imageName = "glass.png"
ent2.x = 15.5*CELL_SIZE
ent2.y = 2.5*CELL_SIZE
ent2.width = 5.5
ent2.placeSprite(world)
world.putEntity(entityyyyyyy)
let viewer = new view(player)
let controller = new Controller(player,viewer.canvas)

function gameLoop() {
    player.movePlayer();
}

function displayLoop(){
    viewer.redraw();
    displayFPS()
    window.requestAnimationFrame(displayLoop)
}

setInterval(gameLoop,1000/GAME_TICK_RATE);
// setInterval(displayLoop,1000/SCREEN_TICK_RATE);
window.requestAnimationFrame(displayLoop)

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