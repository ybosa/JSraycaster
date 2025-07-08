"use strict";
import {FloorAndCeiling,Glass,Air, ABYSS,oldBlock} from "./block.js";
import {CELL_SIZE} from "./config.js";
import LIGHT, {Light} from "./light.js";

class World{
    map;
    lightMap; // contains an object of {colour value , [array of light sources]}
    sky = "sky.png"
    entities = new Set();

    //TODO IMPLEMENT ENTITY COLLISION
    collides(x,y,player){
        let mapX = Math.floor(x / CELL_SIZE)
        let mapY = Math.floor(y / CELL_SIZE)

        //check entity collision
        if(this.getEntities(mapX,mapY,player)) {
            for (let i = 0; i < this.getEntities(mapX, mapY,player).length; i++) {
                let entity = this.getEntities(mapX, mapY,player)[i]
                if (!entity.passable && (Math.pow(entity.x - x, 2) + Math.pow(entity.y - y, 2)) <= entity.width * entity.width)
                    return true
            }
        }

        return this.outOfMapBounds(mapX,mapY) || !this.map[mapY][mapX].passable
    }

    outOfMapBounds(mapX, mapY) {
        return mapX < 0 || mapX >= this.map[0].length || mapY < 0 || mapY >= this.map.length;
    }

    genMap(x = 25,y=25){
        let block = new oldBlock()
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
                        line.push(floor)
                }
                else if(Math.random() > 0.25 ) line.push(floor)
                else line.push(block)
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
        this.placeLightHelper(light,Math.floor(light.x/CELL_SIZE),Math.floor(light.y/CELL_SIZE),Math.floor(light.radius/CELL_SIZE) , new Set())
    }

    placeLightHelper(light,mapX,mapY,i,visited){
        //FIXME DEBUG THE BOUNDARY AND STOPPING CONDITIONS
        if(!light || i < 0 || this.outOfMapBounds(mapX,mapY) ||
            !this.map[mapY][mapX].transparent  )return

        else if(!this.lightMap[mapY][mapX]) {
            let colour = light.calcColourAtDist(mapX*CELL_SIZE,mapY*CELL_SIZE);
            if(colour) {
                let lights = []
                lights.push(light)
                this.lightMap[mapY][mapX] = {colour, lights}
                visited[mapY + "," + mapX] = i
            }
        }
        else if(this.lightMap[mapY][mapX].lights.includes(light)){return;}
        else {
            let lights =this.lightMap[mapY][mapX].lights
            lights.push(light)
            let colour = LIGHT.averageColourValues(lights,(mapX+0.5)*CELL_SIZE,(mapY+0.5)*CELL_SIZE)
            this.lightMap[mapY][mapX] = {colour,lights}
            visited[ mapY+","+mapX] =i
        }
        this.placeLightHelper(light,mapX,mapY+1,i-1,visited)
        this.placeLightHelper(light,mapX,mapY-1,i-1,visited)
        this.placeLightHelper(light,mapX+1,mapY,i-1,visited)
        this.placeLightHelper(light,mapX-1,mapY,i-1,visited)
    }

    getLightColour(mapX,mapY){
        if(this.lightMap[mapY][mapX]) return this.lightMap[mapY][mapX].colour
        else return null
    }

    getEntities(mapX, mapY,player){
        let x = Math.floor(mapX)
        let y = Math.floor(mapY)
        if(this.entities[x+","+y] && this.entities[x+","+y].length > 1 ) {
            this.entities[mapX + "," + mapY].sort((a, b) => //FIXME WHY IS THIS HERE, IS IT NEEDED?
                ((player.x - a.x) * (player.x - a.x) + (player.y - a.y) * (player.y - a.y) )-
                ((player.x - b.x) * (player.x - b.x) + (player.y - b.y) * (player.y - b.y)))
        }
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
        this.placeLight(new Light((15+0.5)*CELL_SIZE, (15+0.5)*CELL_SIZE, 5*CELL_SIZE, [255,125,125,0.25],0))
        return

        let lenY = this.map.length
        let lenX = this.map[0].length
        for(let i = 0; i < lenY; i++){
            for(let j = 0; j < lenX; j++){
                if((this.map)[i][j].passable && (this.map)[i][j].ceiling  &&(this.map)[i][j].transparent && Math.random() < 0.05 ){
                    this.placeLight(new Light((j+0.5)*CELL_SIZE, (i+0.5)*CELL_SIZE, 10*CELL_SIZE, [255,125,125,0.25],0.25))
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


export default World