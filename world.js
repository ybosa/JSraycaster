class World{
    map;
    lightMap; // contains an object of {colour value , [array of light sources]}
    sky = "sky.png"
    entities = new Set();

    //TODO IMPLEMENT ENTITY COLLISION
    collides(x,y){
        let mapX = Math.floor(x / CELL_SIZE)
        let mapY = Math.floor(y / CELL_SIZE)

        //check entity collision
        if(this.getEntities(mapX,mapY)) {
            for (let i = 0; i < this.getEntities(mapX, mapY).length; i++) {
                let entity = this.getEntities(mapX, mapY)[i]
                if ((Math.pow(entity.x - x, 2) + Math.pow(entity.y - y, 2)) <= entity.width * entity.width)
                    return true
            }
        }

        return this.outOfMapBounds(mapX,mapY) || !this.map[mapY][mapX].passable
    }

    outOfMapBounds(mapX, mapY) {
        return mapX < 0 || mapX >= this.map[0].length || mapY < 0 || mapY >= this.map.length;
    }

    genMap(x = 25,y=25){
        let block = new Block()
        block.imageName = "wall.png"
        let glass= new Glass()

        let floor = new FloorAndCeiling()
        floor.ceiling = true
        floor.floor = true

        let air = new Air()
        // air.invisible = false //FIXME

        let newMap = [];
        for(let i = 0; i < y; i++){
            let line = [];
            for(let j = 0; j < x; j++){
                if(i <= 5 || j <= 5){
                    line.push(air)
                }
                else if(i === 6 && j===6 ){
                    line.push(block)
                }
                else if (i % 4 === 0 && j % 4 ===0) {
                    (Math.random() > 0.25) ?
                        line.push((j * i % 2 === 0) ? glass : floor) :
                        line.push(block)
                }
                else line.push(floor)
            }
            newMap.push(line)
        }
        return newMap
    }

    genLightMap(map){
        // if(!this.map && !this.map.length && !this.map[0].length) return null
        let lenY = map.length
        let lenX = map[0].length

        let lightMap = [];
        for (let i = 0; i<lenY;i++){
            let xArray = []
            for (let j = 0; j<lenX;j++){
                xArray.push(null) //TODO decide if null or black should be the default
            }
            lightMap.push(xArray)
        }
        return lightMap;
    }

    placeLight(light){
        this.placeLightHelper(light,Math.floor(light.x/CELL_SIZE),Math.floor(light.y/CELL_SIZE),0)
    }

    placeLightHelper(light,mapX,mapY,i){
        if(!light || i > Math.floor(light.radius/ CELL_SIZE) || this.outOfMapBounds(mapX,mapY) || !this.map[mapY][mapX].transparent ||(this.lightMap[mapY][mapX] && this.lightMap[mapY][mapX].lights.includes(light)) )return
        if(!this.lightMap[mapY][mapX]) {
            let colour = light.colour;
            let lights = []
            lights.push(light)
            this.lightMap[mapY][mapX] = {colour,lights}
        }
        else {
            let lights =this.lightMap[mapY][mapX].lights
            lights.push(light)
            let colour = light.averageColourValues(lights,(mapX+0.5)*CELL_SIZE,(mapY+0.5)*CELL_SIZE)
            this.lightMap[mapY][mapX] = {colour,lights}
        }

        this.placeLightHelper(light,mapX,mapY+1,i++)
        this.placeLightHelper(light,mapX,mapY-1,i++)
        this.placeLightHelper(light,mapX+1,mapY,i++)
        this.placeLightHelper(light,mapX-1,mapY,i++)
    }

    getLightColour(mapX,mapY){
        if(this.lightMap[mapY][mapX]) return this.lightMap[mapY][mapX].colour
        else return null
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
    }

    putEntityCoords(entity, mapX,mapY){

        if(!this.entities[mapX+","+mapY]){
            this.entities[mapX+","+mapY] = []
        }
        this.entities[mapX+","+mapY].push(entity)
    }

    genEntities(){
        let lenY = this.map.length
        let lenX = this.map[0].length
        for(let i = 0; i < lenY; i++){
            for(let j = 0; j < lenX; j++){
                if((this.map)[i][j].passable && (this.map)[i][j].ceiling  &&(this.map)[i][j].transparent && Math.random() < 0.05 ){
                    this.placeLight(new Light((j+0.5)*CELL_SIZE, (i+0.5)*CELL_SIZE, 10*CELL_SIZE, [255,125,125,0.25],0.1))
                }
            }
        }
    }

    constructor() {
        this.map = this.genMap()
        this.lightMap = this.genLightMap(this.map)
        this.genEntities()
    }
}