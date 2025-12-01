"use strict";
import {FloorAndCeiling,Glass,Air, oldBlock} from "./exampleblocks.js";
import {CELL_SIZE} from "./config.js";
import Entity from "./entity.js";

class World{
    #map;
    #lightMap; // contains an object of {colour value , [array of light sources]}
    #sky = "sky.png"
    #entities = new Set();

    //TODO IMPLEMENT ENTITY COLLISION
    collides(x,y,player){
        let mapX = Math.floor(x / CELL_SIZE)
        let mapY = Math.floor(y / CELL_SIZE)

        //check entity collision
        if(this.getEntities(mapX,mapY,player)) {
            for (let i = 0; i < this.getEntities(mapX, mapY,player).length; i++) {
                let entity = this.getEntities(mapX, mapY,player)[i]
                if (!entity.isPassable() && (Math.pow(entity.getX() - x, 2) + Math.pow(entity.getY() - y, 2)) <= entity.getWidth() * entity.getHeight())
                    return true
            }
        }

        return this.outOfMapBounds(mapX,mapY) || !this.#map[mapY][mapX].isPassable()
    }

    outOfMapBounds(mapX, mapY) {
        return mapX < 0 || mapX >= this.#map[0].length || mapY < 0 || mapY >= this.#map.length;
    }

    genMap(x ,y){
        let block = new oldBlock({wallImageName:"wall.png"})

        let glass= new Glass()

        let floor = new FloorAndCeiling({ceiling:false})

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
        // if(!this.#map && !this.#map.length && !this.#map[0].length) return null
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
    placeNewLight(x,y,light){
        const entity = new Entity(x,y,0,0,null,light,true);
        this.putEntity(entity);
    }

    #placeLight(entity){
        this.#placeLightHelper(entity,Math.floor(entity.getX()/CELL_SIZE),Math.floor(entity.getY()/CELL_SIZE),Math.floor(entity.getLight().getRadius()/CELL_SIZE) , new Set())
    }

    #placeLightHelper(entity,mapX,mapY,i,visited){
        const entityX = entity.getX();
        const entityY = entity.getY();

        const light = entity.getLight()
        //FIXME DEBUG THE BOUNDARY AND STOPPING CONDITIONS
        if(!light || i < 0 || this.outOfMapBounds(mapX,mapY) ||
            !this.#map[mapY][mapX].isTransparent()  )return

        else if(!this.#lightMap[mapY][mapX]) {
            let colour = light.calcColourAtDist(entityX,entityY, mapX*CELL_SIZE,mapY*CELL_SIZE);
            if(colour) {
                let lightEntities = []
                lightEntities.push(entity)
                this.#lightMap[mapY][mapX] = {colour, lightEntities: lightEntities}
                visited[mapY + "," + mapX] = i
            }
        }
        else if(this.#lightMap[mapY][mapX].lightEntities.includes(entity)){return;}
        else {
            let lightEntities =this.#lightMap[mapY][mapX].lightEntities
            lightEntities.push(entity)
            let colour = entity.getLight().averageColourValues(lightEntities,(mapX+0.5)*CELL_SIZE,(mapY+0.5)*CELL_SIZE)
            this.#lightMap[mapY][mapX] = {colour,lightEntities}
            visited[ mapY+","+mapX] =i
        }
        this.#placeLightHelper(entity,mapX,mapY+1,i-1,visited)
        this.#placeLightHelper(entity,mapX,mapY-1,i-1,visited)
        this.#placeLightHelper(entity,mapX+1,mapY,i-1,visited)
        this.#placeLightHelper(entity,mapX-1,mapY,i-1,visited)
    }

    getLightColour(mapX,mapY){
        if(this.#lightMap[mapY][mapX]) return this.#lightMap[mapY][mapX].colour
        else return null
    }

    getEntities(mapX, mapY,player){
        let x = Math.floor(mapX)
        let y = Math.floor(mapY)
        if(this.#entities[x+","+y] && this.#entities[x+","+y].length > 1 && player) {
            this.#entities[mapX + "," + mapY].sort((a, b) =>
                ((player.getX() - a.getX()) * (player.getX() - a.getX()) + (player.getY() - a.getY()) * (player.getY() - a.getY()) )-
                ((player.getX() - b.getX()) * (player.getX() - b.getX()) + (player.getY() - b.getY()) * (player.getY() - b.getY())))
        }
        return this.#entities[x+","+y]
    }

    putEntity(entity){
        let x = Math.floor(entity.getX() / CELL_SIZE)
        let y = Math.floor(entity.getY() / CELL_SIZE)

        this.putEntityCoords(entity,x,y)
        if(entity.hasLight()){
            this.#placeLight(entity)
        }
        if(entity.hasSprite())
            this.#placeSprite(entity)
    }

    #placeSprite(entity){
        //works with proportions (0 to 1) because it is easier
        let xDeci = entity.getX()/CELL_SIZE - Math.floor(entity.getX()/CELL_SIZE)
        let yDeci = entity.getY()/CELL_SIZE - Math.floor(entity.getY()/CELL_SIZE)
        let propHW = entity.getWidth()/ (CELL_SIZE * 2) //proportional half width
        let overlap = entity.getWidth() > CELL_SIZE || xDeci + propHW > 1 || xDeci - propHW <0 || yDeci + propHW > 1 || yDeci - propHW <0
        if(overlap){
            let mapX = Math.floor(entity.getX()/CELL_SIZE)
            let mapY = Math.floor(entity.getY()/CELL_SIZE)
            let cellRadius = Math.floor (propHW) +1 //radius of circle described by entity
            let cellRadius2 = (cellRadius-1) * (cellRadius-1) //radius^2 of circle described by entity
            for (let y = -cellRadius; y <= cellRadius; y++){
                for (let x = -cellRadius; x <= cellRadius; x++){
                    if(this.outOfMapBounds(mapX+x,mapY+y) || (x) * (x) + (y)*(y) >= cellRadius2 ) {} //fixme potential bug? unused if
                    this.putEntityCoords(entity,mapX+x,mapY+y)

                }
            }

        }
    }

    putEntityCoords(entity, mapX,mapY){
        if(!this.#entities[mapX+","+mapY]){
            this.#entities[mapX+","+mapY] = []
        }
        this.#entities[mapX+","+mapY].push(entity)
    }

    getMap(){return this.#map}

    getLightMap(){return this.#lightMap}

    getSky(){return this.#sky}

    constructor(x,y) {
        this.#entities = new Set()
        this.#map = this.genMap(x,y)
        this.#lightMap = this.genLightMap(this.#map)
    }
}


export default World