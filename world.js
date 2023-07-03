function movePlayer() {
    let x = player.x + Math.cos(player.angle) * player.speed;
    let y = player.y + Math.sin(player.angle) * player.speed;

    if(!collides(x,y)){
        player.x = x
        player.y = y
    }
}

function collides(x,y){
    x = Math.floor(x / CELL_SIZE)
    y = Math.floor(y / CELL_SIZE)
    return outOfMapBounds(x,y) || map[y][x] !== 0
}

const player = {
    x: CELL_SIZE * 1.5,
    y: CELL_SIZE * 2,
    angle: toRadians(0),
    speed: 0,
};


const map = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 0],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
];