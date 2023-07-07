const CELL_SIZE = 32;

class World{
    map = [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1],
    ];

    collides(x,y){
        x = Math.floor(x / CELL_SIZE)
        y = Math.floor(y / CELL_SIZE)
        return this.outOfMapBounds(x,y) || map[y][x] !== 0
    }

    outOfMapBounds(x, y) {
        return x < 0 || x >= map[0].length || y < 0 || y >= map.length;
    }
}