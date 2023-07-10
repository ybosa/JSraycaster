const CELL_SIZE = 32;

class World{
    map = this.regenMap()

    collides(x,y){
        x = Math.floor(x / CELL_SIZE)
        y = Math.floor(y / CELL_SIZE)
        return this.outOfMapBounds(x,y) || this.map[y][x] !== 0
    }

    outOfMapBounds(x, y) {
        return x < 0 || x >= this.map[0].length || y < 0 || y >= this.map.length;
    }

    regenMap(x = 25,y=25){
        const newMap = [];
        for(let i = 0; i < y; i++){
            const line = [];
            for(let j = 0; j < x; j++){
                line.push((Math.random() > 0.25) ? 0 : 1)
            }
            newMap.push(line)
        }
        return newMap
    }
}