"use strict";
import Sprite from "./sprite.js";
import {ABYSS, Air, FloorAndCeiling, Glass, oldBlock} from "./exampleblocks.js"
import {CELL_SIZE} from "./config.js";
import {Light} from "./light.js";

function generateDemoMap(world){
    world.entities = new Set()
    world.map = world.genMap(50,50)
    world.lightMap = world.genLightMap(world.map)
    const map = world.map


    const air = new Air()
    let stoneWall = new oldBlock({wallImageName:"wall.png"})
    // stoneWall.ceiling = true //fixme causes glitch block on side not rendering when going through a narrow gap
    // stoneWall.floor = true //fixme causes glitch block on side not rendering when going through a narrow gap
    let rubble = new oldBlock({wallImageName:"rubble.png"})

    let stoneFloorRoofW = new FloorAndCeiling({
        floorColour :[200,200,200,1],
        ceilingColour : [200,200,200,1],
        wallImageName:"white.png"
    })

    let stoneFloorRoofB = new FloorAndCeiling({
        floorColour :[200,200,200,1],
        ceilingColour : [50,50,50,1],
        wallImageName:"black.png"
    })

    let bars = new Glass({
        floorColour :[166,152,143,1],
        ceilingColour : [125,123,112,1],
        wallImageName:"bars.png"
    })

    fillArea(map,air,0,49,0,49)

    //prison
    fillAreaWithFunc(map,()=>{
        const delta = 10
        return new FloorAndCeiling({
            floorColour: [166 - delta / 2 + Math.random() * delta, 152 - delta / 2 + Math.random() * delta, 143 - delta / 2 + Math.random() * delta, 1],
            ceilingColour: [125 - delta / 2 + Math.random() * delta, 123 - delta / 2 + Math.random() * delta, 112 - delta / 2 + Math.random() * delta, 1],
            wallImageName: "rubble.png",
            passable: true,
            transparent: true,
        })

    },7,19,3,9)
    drawPerim(map,rubble,7,19,3,9)

    drawRow(map,bars,5,8,18)
    drawCol(map,rubble,10,4,5)
    drawCol(map,rubble,13,4,5)
    drawCol(map,rubble,16,4,5)
    new bed(8.5*CELL_SIZE,4.5*CELL_SIZE,world)
    new bed(11.5*CELL_SIZE,4.5*CELL_SIZE,world)
    new bed(14.5*CELL_SIZE,4.5*CELL_SIZE,world)
    new bed(17.5*CELL_SIZE,4.5*CELL_SIZE,world)

    world.placeLight(new Light(13*CELL_SIZE,7*CELL_SIZE,20*CELL_SIZE,[0,0,0,0.75],0))
    world.placeLight(new Light(13*CELL_SIZE,8*CELL_SIZE,4*CELL_SIZE,[255,255,255,0.05],2))

    //garden
    fillAreaWithFunc(map,()=>{
        const delta = 25
        return new FloorAndCeiling({
            ceiling: false,
            floorColour: [155 - delta / 2 + Math.random() * delta, 155 - delta / 2 + Math.random() * delta, 155 - delta / 2 + Math.random() * delta, 1],
            wallImageName: "gravel.png",
            passable: true,
            transparent: true,
        })

    },5,21,23,34)
    let gravelFloor = new FloorAndCeiling({
        ceiling: false,
        floorColour: [155 ,155,155,1],
        wallImageName: "gravel.png",
        passable: true,
        transparent: true,
    })

    fillArea(map,gravelFloor,7,19,25,32)


    let pillar = new oldBlock({wallImageName:"pillar.png"})

    drawPerim(map,ABYSS,4,22,20,35)
    map[21][5] = stoneWall; map[21][21] = stoneWall;
    fillAltArea(map,null,pillar,8,18,22,22)

    let leaves = new oldBlock(
        {wallImageName:"leaves.png",
        wall:true,
        transparent: true
        }
    )
    drawPerim(map,leaves,7,19,25,32)
    drawCol(map,leaves,9,27,30)
    drawCol(map,leaves,13,27,30)
    drawCol(map,leaves,15,30,31)
    drawCol(map,leaves,17,27,28)
    map[26][11] = leaves
    map[26][15] = leaves
    drawRow(map,leaves,28,10,11)
    drawRow(map,leaves,28,13,17)
    drawRow(map,leaves,30,10,13)
    drawRow(map,leaves,30,15,17)

    map[25][13] = gravelFloor
    map[32][13] =gravelFloor
    map[22][13] =gravelFloor


        //main hall
    fillAltArea(map,stoneFloorRoofW,stoneFloorRoofB,6,20,11,21)
    drawPerim(map,stoneWall,6,20,11,21)

    fillAltArea(map,pillar,null,8,18,13,13)
    fillAltArea(map,pillar,null,8,18,19,19)

    //disco room
    let white = new oldBlock({wallImageName:"white.png"})

    let whiteFloor = new FloorAndCeiling({
        wallImageName:"white.png",
        ceilingColour : [255,255,255,1],
        floorColour : [255,255,255,1],
        passable: true,
        transparent: true,
    })
    fillArea(map,whiteFloor,22,30,12,20)
    drawPerim(map,white,22,30,12,20)

    world.placeLight(new Light(24*CELL_SIZE,14*CELL_SIZE,8*CELL_SIZE,[200,0,0,0.5],2))
    world.placeLight(new Light(25*CELL_SIZE,19*CELL_SIZE,8*CELL_SIZE,[0,200,0,0.35],2))
    world.placeLight(new Light(28*CELL_SIZE,16*CELL_SIZE,8*CELL_SIZE,[0,0,200,0.25],2))

    //starting area
    drawRow(map,ABYSS,9,1,5)
    drawRow(map,ABYSS,20,0,5)
    drawCol(map,ABYSS,5,9,20)
    let stoneTile = new FloorAndCeiling(
        {ceiling : false, floorColour: [155,155,155,1]}
    )

    drawCol(map,stoneTile,2,12,16)
    drawRow(map,stoneTile,16,2,5)

    new tree(0.5*CELL_SIZE,19.5*CELL_SIZE,world)
    new tree(2.5*CELL_SIZE,18.5*CELL_SIZE,world)
    new tree(0.5*CELL_SIZE,11.5*CELL_SIZE,world)
    new tree(3.5*CELL_SIZE,10.5*CELL_SIZE,world)


    //start-hall entry
    fillAltArea(map,stoneFloorRoofW,stoneFloorRoofB,5,6,16,16)
    drawRow(map,stoneWall,15,5,6)
    drawRow(map,stoneWall,17,5,6)

    //prison entry
    drawRow(map,stoneWall,10,12,14)
    fillAltArea(map,stoneFloorRoofW,stoneFloorRoofB,13,13,9,11)
    fillAreaWithFunc(map,()=>{
        const delta = 10
        return new FloorAndCeiling({
            floorColour: [166 - delta / 2 + Math.random() * delta, 152 - delta / 2 + Math.random() * delta, 143 - delta / 2 + Math.random() * delta, 1],
            ceilingColour: [125 - delta / 2 + Math.random() * delta, 123 - delta / 2 + Math.random() * delta, 112 - delta / 2 + Math.random() * delta, 1],
            wallImageName: "rubble.png"
        })
    },13,13,9,9)
    world.placeLight(new Light(13*CELL_SIZE,9*CELL_SIZE,CELL_SIZE,[0,0,0,0.5],0))
    world.placeLight(new Light(13*CELL_SIZE,10*CELL_SIZE,CELL_SIZE,[0,0,0,0.33],0))
    world.placeLight(new Light(13*CELL_SIZE,11*CELL_SIZE,CELL_SIZE,[0,0,0,0.25],0))

    //disco room entry
    fillAltArea(map,stoneFloorRoofW,stoneFloorRoofB,20,22,16,16)
    drawRow(map,stoneWall,15,20,21)
    drawRow(map,stoneWall,17,20,21)

    //garden entry
    fillAltArea(map,stoneFloorRoofW,stoneFloorRoofB,13,13,21,21)
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

function fillAreaWithFunc(map,func,colStart,colStop,rowStart,rowStop) {
    for(let i = colStart; i <= colStop; i++){
        for(let j = rowStart; j <= rowStop; j++){
            map[j][i] = func()
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
        this.width = CELL_SIZE
        this.height =2.25 * CELL_SIZE
        this.imageName = "tree.png"
        this.placeSprite(world)
    }
}


export default generateDemoMap;