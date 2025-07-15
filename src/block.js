"use strict";
//Template Block class is not intended to be used directly in game, if you do it will always be non-static to allow for many different instantiations of individual blocks!
class Block {
    static #staticBlockClassesMap = new Map()

    #invisible = false; //invisible blocks are not drawn FIXME not handled correctly
    #drawBackgroundImgInstead = false // terminates draw and draws the background image where the wall would be

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
    static isStatic(BlockClass){return this.#staticBlockClassesMap.has(BlockClass)}
    isInvisible() {return this.#invisible}
    isTransparent(){ return this.#transparent;}
    isPassable(){ return this.#passable}
    isWall(){ return this.#wall;}
    isFloor() { return this.#floor}
    isCeiling(){ return this.#ceiling}
    isDrawBackgroundImgInstead(){return this.#drawBackgroundImgInstead}

    //get properties
    static getStaticInstance(BlockClass){return this.#staticBlockClassesMap.get(BlockClass)}
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

    constructor(blockData = {}) {
        // if static block is not defined in blockData, default to true
        if(!blockData.hasOwnProperty("staticBlock")){
            blockData.staticBlock = true
        }
        const BlockClass = new.target;
        if(!BlockClass){
            throw new Error("Cannot instantiate an unknown block class!")
        }
        if(!BlockClass instanceof Block ){
            throw new Error("Cannot instantiate an non block class as a block!")
        }
        if(BlockClass === Block){
            blockData.staticBlock = false; //all instantiations of the block class are non-static so they can allow for custom blocks!
        }


        //correct for non static declaration of static blocks
        if(!blockData.staticBlock && Block.isStatic(BlockClass)) {
            let msg = "Cannot create a non static block from a static class!"
            msg = "Invalid construction of "+BlockClass + " "+ msg + "\n Creating block as a static block!"
            console.warn(msg)
            blockData.staticBlock=true;
        }
        // deal with the first instantiation of a static block
        if(blockData.staticBlock && !Block.isStatic(BlockClass)) {
            Block.#staticBlockClassesMap.set(BlockClass,null)
            const blockStaticInstance = new BlockClass(blockData);
            Block.#staticBlockClassesMap.set(BlockClass,blockStaticInstance)
            return blockStaticInstance;
        }

        //construct the block object using blockData object
        if(Block.isStatic(BlockClass) && Block.getStaticInstance(BlockClass)) return (Block.getStaticInstance(BlockClass));
        else {
            this.#invisible = (blockData.hasOwnProperty("invisible")) ? blockData.invisible : this.#invisible;
            this.#transparent = (blockData.hasOwnProperty("transparent")) ? blockData.transparent : this.#transparent;
            this.#passable = (blockData.hasOwnProperty("passable")) ? blockData.passable : this.#passable;

            this.#wall =  (blockData.hasOwnProperty("wall")) ? blockData.wall : this.#wall;
            this.#wallImageName = (blockData.hasOwnProperty("wallImageName"))  ? blockData.wallImageName : this.#wallImageName;

            this.#floor = (blockData.hasOwnProperty("floor")) ? blockData.floor : this.#floor;
            this.#floorColour = (blockData.hasOwnProperty("floorColour")) ? blockData.floorColour : this.#floorColour;
            this.#floorImageName = (blockData.hasOwnProperty("floorImageName")) ? blockData.floorImageName : this.#floorImageName;

            this.#ceiling = (blockData.hasOwnProperty("ceiling")) ? blockData.ceiling : this.#ceiling;
            this.#ceilingImageName = (blockData.hasOwnProperty("ceilingImageName")) ? blockData.ceilingImageName : this.#ceilingImageName;
            this.#ceilingColour = (blockData.hasOwnProperty("ceilingColour")) ? blockData.ceilingColour : this.#ceilingColour;
            this.#drawBackgroundImgInstead = (blockData.hasOwnProperty("drawBackgroundImgInstead")) ? blockData.drawBackgroundImgInstead : this.#drawBackgroundImgInstead;
        }
    }
}

export default Block;
