class World{
    map = this.regenMap()
    sky = "sky.png"
    entities = new Set();

    //TODO IMPLEMENT ENTITY COLLISION
    collides(x,y){
        x = Math.floor(x / CELL_SIZE)
        y = Math.floor(y / CELL_SIZE)
        return this.outOfMapBounds(x,y) || !this.map[y][x].passable
    }

    outOfMapBounds(mapX, mapY) {
        return mapX < 0 || mapX >= this.map[0].length || mapY < 0 || mapY >= this.map.length;
    }

    regenMap(x = 25,y=25){
        let block = new Block()
        block.imageName = "wall.png"
        let glass= new Glass()

        let floor = new FloorAndCeiling()
        floor.ceiling = false
        floor.floor = false

        let newMap = [];
        for(let i = 0; i < y; i++){
            let line = [];
            for(let j = 0; j < x; j++){
                if(i <= 5 || j <= 5){
                    line.push(floor)
                }
                else if(i === 6 && j===6 ){
                    line.push(block)
                }
                else {
                    (Math.random() > 0.25) ?
                        line.push((j * i % 2 === 0) ? floor : glass) :
                        line.push(block)
                }
            }
            newMap.push(line)
        }
        return newMap
    }

    getEntities(mapX, mapY){
        let x = Math.floor(mapX)
        let y = Math.floor(mapY)

        return this.entities[x+","+y]
    }

    putEntity(entity){
        let x = Math.floor(entity.x / CELL_SIZE)
        let y = Math.floor(entity.y/CELL_SIZE)

        this.putEntityCoords(entity,x,y)
        console.log(this.entities)
    }

    putEntityCoords(entity, mapX,mapY){

        if(!this.entities[mapX+","+mapY]){
            this.entities[mapX+","+mapY] = []
        }
        this.entities[mapX+","+mapY].push(entity)
    }
}