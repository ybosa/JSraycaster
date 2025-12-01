"use strict";
import {ABYSS, Air, FloorAndCeiling, Glass, oldBlock} from "./exampleblocks.js"
import {CELL_SIZE} from "./config.js";
import {Light} from "./light.js";
import Block from "./block.js";
import Entity from "./entity.js";

function generateDemoMap(world){
    world.entities = new Set()
    world.map = world.genMap(50,50)
    world.lightMap = world.genLightMap(world.map)
    const map = world.map

    const air = new Air()
    let stoneWall = new Block({wallImageName:"wall.png"})
    // stoneWall.ceiling = true //fixme causes glitch block on side not rendering when going through a narrow gap
    // stoneWall.floor = true //fixme causes glitch block on side not rendering when going through a narrow gap
    let rubble = new Block({wallImageName:"rubble.png"})

    let stoneFloorRoofW = new Block({
        passable: true,
        transparent:true,
        ceiling:true,
        floor:true,
        wall:false,

        floorColour :[200,200,200,1],
        ceilingColour : [200,200,200,1],
        ceilingImageName:"white.png",
        floorImageName:"white.png"
    })

    let stoneFloorRoofB = new Block({
        passable: true,
        transparent:true,
        ceiling:true,
        floor:true,
        wall:false,
        floorColour :[200,200,200,1],
        ceilingColour : [50,50,50,1],

        ceilingImageName:"white.png",
        floorImageName:"black.png"
    })

    let bars = new Block({
        transparent:true,
        ceiling:true,
        floor:true,
        floorColour :[166,152,143,1],
        ceilingColour : [125,123,112,1],
        wallImageName:"bars.png",
        ceilingImageName:"rubble.png",
        floorImageName:"rubble.png"
    })

    fillArea(map,air,0,49,0,49)

    //prison
    fillAreaWithFunc(map,()=>{
        const delta = 10
        return new Block({
            ceiling:true,
            floor:true,
            wall:false,

            floorColour: [166 - delta / 2 + Math.random() * delta, 152 - delta / 2 + Math.random() * delta, 143 - delta / 2 + Math.random() * delta, 1],
            ceilingColour: [125 - delta / 2 + Math.random() * delta, 123 - delta / 2 + Math.random() * delta, 112 - delta / 2 + Math.random() * delta, 1],
            passable: true,
            transparent: true,
            ceilingImageName:"rubble.png",
            floorImageName:"rubble.png"
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

    world.placeNewLight(13*CELL_SIZE,7*CELL_SIZE, new Light(20*CELL_SIZE,[0,0,0,0.75],0))
    world.placeNewLight(13*CELL_SIZE,8*CELL_SIZE, new Light(4*CELL_SIZE,[255,255,255,0.05],2))

    //garden
    fillAreaWithFunc(map,()=>{
        const delta = 25
        return new Block({
            floor:true,
            wall:false,
            ceiling: false,
            floorColour: [155 - delta / 2 + Math.random() * delta, 155 - delta / 2 + Math.random() * delta, 155 - delta / 2 + Math.random() * delta, 1],
            passable: true,
            transparent: true,
            ceilingImageName:"gravel.png",
            floorImageName:"gravel.png"
        })

    },5,21,23,34)
    let gravelFloor = new Block({
        floor:true,
        wall:false,
        ceiling: false,
        floorColour: [155 ,155,155,1],
        passable: true,
        transparent: true,
        ceilingImageName:"gravel.png",
        floorImageName:"gravel.png"
    })

    fillArea(map,gravelFloor,7,19,25,32)


    let pillar = new Block({wallImageName:"pillar.png"})

    drawPerim(map,ABYSS,4,22,20,35)
    map[21][5] = stoneWall; map[21][21] = stoneWall;
    fillAltArea(map,null,pillar,8,18,22,22)

    let leaves = new Block(
        {wallImageName:"leaves.png",
        wall:true,
        opacity: 0.33,
        transparent:true,
        ceiling:false,
        floor:true,
            ceilingImageName:"leaves.png",
            floorImageName:"gravel.png"
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
    let white = new Block({wallImageName:"white.png"})

    let whiteFloor = new Block({
        wall:false,
        ceiling:true,
        floor:true,
        wallImageName:"white.png",
        ceilingColour : [255,255,255,1],
        floorColour : [255,255,255,1],
        passable: true,
        transparent: true,
        ceilingImageName:"white.png",
        floorImageName:"white.png"
    })
    fillArea(map,whiteFloor,22,30,12,20)
    drawPerim(map,white,22,30,12,20)

    world.placeNewLight(24*CELL_SIZE,14*CELL_SIZE, new Light(8*CELL_SIZE,[200,0,0,0.5],2))
    world.placeNewLight(25*CELL_SIZE,19*CELL_SIZE, new Light(8*CELL_SIZE,[0,200,0,0.35],2))
    world.placeNewLight(28*CELL_SIZE,16*CELL_SIZE, new Light(8*CELL_SIZE,[0,0,200,0.25],2))

    //starting area
    drawRow(map,ABYSS,9,1,5)
    drawRow(map,ABYSS,20,0,5)
    drawCol(map,ABYSS,5,9,20)
    let stoneTile = new Block(
        {
            passable: true,
            transparent:true,
            floor:true,
            wall:false,
            ceiling : false,
            floorImageName:"gravel.png",
            floorColour: [155,155,155,1]}

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
        return new Block({
            floorColour: [166 - delta / 2 + Math.random() * delta, 152 - delta / 2 + Math.random() * delta, 143 - delta / 2 + Math.random() * delta, 1],
            ceilingColour: [125 - delta / 2 + Math.random() * delta, 123 - delta / 2 + Math.random() * delta, 112 - delta / 2 + Math.random() * delta, 1],
            wallImageName: "rubble.png",
            ceilingImageName:"rubble.png",
            floorImageName:"rubble.png",
            passable: true,
            transparent:true,
            ceiling:true,
            wall:false,
            floor:true,
        })
    },13,13,9,9)
    world.placeNewLight(13*CELL_SIZE,9*CELL_SIZE,new Light(CELL_SIZE,[0,0,0,0.5],0))
    world.placeNewLight(13*CELL_SIZE,10*CELL_SIZE,new Light(CELL_SIZE,[0,0,0,0.33],0))
    world.placeNewLight(13*CELL_SIZE,11*CELL_SIZE,new Light(CELL_SIZE,[0,0,0,0.25],0))

    //disco room entry
    fillAltArea(map,stoneFloorRoofW,stoneFloorRoofB,20,22,16,16)
    drawRow(map,stoneWall,15,20,21)
    drawRow(map,stoneWall,17,20,21)

    //garden entry
    fillAltArea(map,stoneFloorRoofW,stoneFloorRoofB,13,13,21,21)

    const debug = new Block({
        wall:true,
        floor:false,
        ceiling:false,
        transparent:true,
        opacity:1,
        wallImageName:"missing.png",
        wallImageIsScreenSpaceNotWorld:true
    })
    map[3][3] = debug
    map[3][4] = debug
    map[3][2] = debug
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


class bed extends Entity{
    constructor(x, y, world) {
        super(x, y,CELL_SIZE,CELL_SIZE,"bed.png",null,false);
        world.putEntity(this)
    }
}

class tree extends Entity{
    constructor(x, y, world) {
        super(x, y,CELL_SIZE*1.5,2.25 * CELL_SIZE,"tree.png",null,false);
        world.putEntity(this)
    }
}


export default generateDemoMap;