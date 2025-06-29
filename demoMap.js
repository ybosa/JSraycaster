function generateDemoMap(world){
    world.entities = new Set()
    world.map = world.genMap(25,25)
    world.lightMap = world.genLightMap(world.map)
    const map = world.map


    const air = new Air()
    fillArea(map,air,0,24,0,24)
    let stoneFloorRoofW = new FloorAndCeiling()
    stoneFloorRoofW.ceilingColour =[200,200,200,1]
    stoneFloorRoofW.floorColour = [200,200,200,1]
    stoneFloorRoofW.imageName = "white.png"
    // stoneFloorRoofW.ceiling = false

    let stone = new Block()
    stone.imageName = "wall.png"

    let stoneFloorRoofB = new FloorAndCeiling()
    stoneFloorRoofB.ceilingColour = [50,50,50,1]
    stoneFloorRoofB.floorColour = [50,50,50,1]
    stoneFloorRoofB.imageName = "black.png"
    // stoneFloorRoofB.ceiling = false
     //main hall
    fillAltArea(map,stoneFloorRoofW,stoneFloorRoofB,0,24,0,24)
    // fillAltArea(map,stoneFloorRoofW,stoneFloorRoofB,0,24,0,24)
    // fillAltArea2(map,stone,0,24,0,24)
}

function drawRow(map,block,row,colStart,colStop){
    for(let i = colStart; i <= colStop; i++){
        map[row][i] = block
    }
}

function drawCol(map,block,col,rowStart,rowStop){
    for(let i = rowStart; i <= rowStop; i++){
        map[i][col] = block
    }
}

function fillArea(map,block,colStart,colStop,rowStart,rowStop) {
    for(let i = colStart; i <= colStop; i++){
        for(let j = rowStart; j <= rowStop; j++){
            map[j][i] = block
        }
    }
}

function fillAltArea(map,block1,block2,colStart,colStop,rowStart,rowStop) {
    for(let i = colStart; i <= colStop; i++){
        for(let j = rowStart; j <= rowStop; j++){
            if(!((i+j) % 2) && !block2) continue
            if(((i+j) % 2) && !block1) continue
            map[j][i] = ( (i+j) % 2) ? block1 : block2
        }
    }
}

function fillAltArea2(map,block1,colStart,colStop,rowStart,rowStop) {
    for(let i = colStart; i <= colStop; i++){
        for(let j = rowStart; j <= rowStop; j++){
            if(((i+j) % 2) && !block1) continue
            map[j][i] = ( (i+j) % 20) ?  map[j][i] : block1
        }
    }
}

function fillAreaWithFunc(map,func,colStart,colStop,rowStart,rowStop) {
    for(let i = colStart; i <= colStop; i++){
        for(let j = rowStart; j <= rowStop; j++){
            map[j][i] = func(i,j)
        }
    }
}

function drawPerim(map,block,colStart,colStop,rowStart,rowStop){
    drawRow(map,block,rowStart,colStart,colStop)
    drawRow(map,block,rowStop,colStart,colStop)
    drawCol(map,block,colStart,rowStart,rowStop)
    drawCol(map,block,colStop,rowStart,rowStop)
}


class bed extends Sprite{

    constructor(x, y, world) {
        super(x, y);
        this.imageName = "bed.png"
        this.placeSprite(world)
    }
}

class tree extends Sprite{
    constructor(x, y, world) {
        super(x, y);
        this.width = 2
        this.height = 4.5
        this.imageName = "tree.png"
        this.placeSprite(world)
    }
}