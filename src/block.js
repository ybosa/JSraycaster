"use strict";
//abstract block class is not intended to be used directly in game
class Block {
    static staticBlock = true; //static blocks are always identical, so only 1 of its kind need to be crated
    static staticInstance = null;

    #invisible = false; //invisible blocks are not drawn FIXME not handled correctly
    #transparent = false;//if block is transparent, ray will draw it and blocks behind

    #passable = false;// block allows entities / players to move through it


    #wall = true; //has a wall to draw
    #wallImageName = "missing.png"; //debug texture
    #floor = false; //has a floor to draw
    #floorColour = "[150,0,150,1]"  //approx average of debug texture colour
    #floorImageName = "missing.png"; //debug texture
    #ceiling = false; //has a floor to draw
    #ceilingImageName = "missing.png"; //debug texture
    #ceilingColour = "[150,0,150,1]" //approx average of debug texture colour


    //boolean getters
    static isStatic(){return this.staticBlock}
    isInvisible() {return this.#invisible}
    isTransparent(){ return this.#transparent;}
    isPassable(){ return this.#passable}
    isWall(){ return this.#wall;}

    //get properties
    static getStaticInstance(){return this.staticInstance}
    getFloorColour(){return this.#floorColour}
    getCeilingColour(){return this.#ceilingColour}

    //get image properties
    getWallImageName(angle,time){
        if(!this.#wall) return null;
        //todo implement support for angle based textures and time based animations!
        return this.#wallImageName;

    }
    getFloorImageName(angle,time){
        if(!this.#floor) return null;
        //todo implement support for angle based textures and time based animations!
        return this.#floorImageName;

    }
    getCeilingImageName(angle,time){
        if(!this.#ceiling) return null;
        //todo implement support for angle based textures and time based animations!
        return this.#ceilingImageName
    }

    //TODO custom ray collision math => allows for complex wall shapes

    constructor(blockData) {
        const BlockClass = new.target;
        if(!BlockClass){
            throw new Error("Cannot instantiate an unknown block class!")
        }
        if(!BlockClass instanceof Block ){
            throw new Error("Cannot instantiate an non block class as a block!")
        }

        //correct for static non static blocks
        if(blockData.staticBlock !== BlockClass.staticBlock) {
            let msg = "Cannot create a static block from non static class!";
            if(blockData.staticBlock) {msg = "Cannot create a non static block from a static class!"}

            console.warn("Invalid construction of "+BlockClass + " "+ msg + "\n Creating block as a "+(BlockClass.staticBlock)? "static" : "non static" + " block!")
            blockData.staticBlock=BlockClass.staticBlock;

        }
        //deal with the first instantiation of a static block
        if(BlockClass.staticBlock && !BlockClass.staticInstance) {
            BlockClass.staticInstance = true;
            const blockStaticInstance = new BlockClass(blockData);
            BlockClass.staticInstance = blockStaticInstance;
            return blockStaticInstance;
        }

        //construct the block object using blockData object
        if(BlockClass.staticBlock && BlockClass.staticInstance) return BlockClass.staticInstance;
        else if(blockData) {
            this.#invisible = (blockData.invisible) ? blockData.invisible : this.#invisible;
            this.#transparent = (blockData.transparent) ? blockData.transparent : this.#transparent;
            this.#passable = (blockData.passable) ? blockData.passable : this.#passable;

            this.#wall =  (blockData.wall) ? blockData.wall : this.#wall;
            this.#wallImageName = (blockData.wallImageName)  ? blockData.wallImageName : this.#wallImageName;

            this.#floor = (blockData.floor) ? blockData.floor : this.#floor;
            this.#floorColour = (blockData.floorColour) ? blockData.floorColour : this.#floorColour;
            this.#floorImageName = (blockData.floorImageName) ? blockData.floorImageName : this.#floorImageName;

            this.#ceiling = (blockData.ceiling) ? blockData.ceiling : this.#ceiling;
            this.#ceilingImageName = (blockData.ceilingImageName) ? blockData.ceilingImageName : this.#ceilingImageName;
            this.#ceilingColour = (blockData.ceilingColour) ? blockData.ceilingColour : this.#ceilingColour;
        }
    }
}


class oldBlock{
    static = true; //static blocks are always identical, so only 1 of its kind need to be crated
    invisible = false; //invisible blocks are not drawn FIXME not handled correctly
    transparent = false;//if block is transparent, ray will draw it and blocks behind
    imageName = "missing.png";
    passable = false;
    wall = true;
    floor = false;
    ceiling = false;
    block = true;
}

class FloorAndCeiling extends oldBlock{
    floor = true;
    ceiling = true;
    wall = false;
    static = true;
    passable = true;
    transparent = true;

    floorColour = [255,255,255,1] //floors and ceilings drawn as solid colour blocks, not textures due to performance cost
    ceilingColour = [125,125,125,1]//floors and ceilings drawn as solid colour blocks, not textures due to performance cost
}

class Glass extends oldBlock{
    wall = true;
    passable = false;
    transparent = true;
    imageName = "glass.png"
    ceilingColour = [0,0,0,1]
    floorColour = [0,0,255,1]
}

const ABYSS = new oldBlock() //placeholder block for out-of-bounds block logics

class Air extends oldBlock{
    invisible = false; //invisible blocks are not drawn FIXME
    transparent = true;//if block is transparent, ray will draw it and blocks behind
    passable = true;
    wall = false;
    floor = false;
    ceiling = false;
}

export {Block,FloorAndCeiling,Glass,Air, ABYSS,oldBlock};

export default Block;
