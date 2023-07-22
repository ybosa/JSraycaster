class World{
    map = this.regenMap()
    sky = "sky.png"

    collides(x,y){
        x = Math.floor(x / CELL_SIZE)
        y = Math.floor(y / CELL_SIZE)
        return this.outOfMapBounds(x,y) || !this.map[y][x].passable
    }

    outOfMapBounds(x, y) {
        return x < 0 || x >= this.map[0].length || y < 0 || y >= this.map.length;
    }

    regenMap(x = 25,y=25){
        let block = new Block()
        block.imageName = "wall.png"
        let floor = new Floor()
        let floor2 = new Floor()
        floor2.floorColour = "black"

        let newMap = [];
        for(let i = 0; i < y; i++){
            let line = [];
            for(let j = 0; j < x; j++){
                (Math.random() > 0.25) ?
                line.push( (j*i%2 ===0)  ? floor : floor2)
                    : line.push(block)
            }
            newMap.push(line)
        }
        return newMap
    }
}