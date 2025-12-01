"use strict";
import Block from "./block.js";

class oldBlock extends Block{


    constructor(blockdata = {}) {
        const defaultBlockData = {
            invisible : false, //invisible blocks are not drawn FIXME not handled correctly
            transparent : false,//if block is transparent, ray will draw it and blocks behind
            wallImageName : "missing.png",
            passable : false,
            wall : true,
            floor : false,
            ceiling : false,
        }
        const merged ={...defaultBlockData, ...blockdata};
        super(merged);
    }

}

class FloorAndCeiling extends oldBlock{
    constructor(blockdata = {}) {
        const defaultBlockData = {
            static: false,
            floor : true,
            ceiling : true,
            wall : false,
            passable : true,
            transparent : true,
            floorImageName : "wall.png",
            ceilingImageName : "wall.png",

        }
        const merged ={...defaultBlockData, ...blockdata};
        super(merged);
    }
}

class Glass extends oldBlock{

    constructor(blockdata = {}) {
        const defaultBlockData = {
            wall : true,
            passable : false,
            transparent : true,
            opacity: 0.125,
            wallImageName : "glass.png",
        }
        const merged ={...defaultBlockData, ...blockdata};
        super(merged);
    }
}


class Air extends oldBlock{
    constructor(blockdata = {}) {
        const defaultBlockData = {
            invisible : false, //invisible blocks are not drawn FIXME
            transparent : true,//if block is transparent, ray will draw it and blocks behind
            passable : true,
            wall : false,
            floor : false,
            ceiling : false,
        }
        const merged ={...defaultBlockData, ...blockdata};
        super(merged);
    }


}

class Abyss extends Block{
    constructor() {
        super({drawBackgroundImgInstead:true});
    }
}

const ABYSS = new Abyss()

export {FloorAndCeiling,Glass,Air, ABYSS,oldBlock};