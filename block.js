"use strict";
class Block{
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

class FloorAndCeiling extends Block{
    floor = true;
    ceiling = true;
    wall = false;
    static = true;
    passable = true;
    transparent = true;

    floorColour = [255,255,255,1] //floors and ceilings drawn as solid colour blocks, not textures due to performance cost
    ceilingColour = [125,125,125,1]//floors and ceilings drawn as solid colour blocks, not textures due to performance cost
}

class Glass extends FloorAndCeiling{
    wall = true;
    passable = false;
    imageName = "glass.png"
    ceilingColour = [0,0,0,1]
    floorColour = [0,0,255,1]
}

const ABYSS = new Block() //placeholder block for out-of-bounds block logics

class Air extends Block{
    invisible = false; //invisible blocks are not drawn FIXME
    transparent = true;//if block is transparent, ray will draw it and blocks behind
    passable = true;
    wall = false;
    floor = false;
    ceiling = false;
}

export {Block,FloorAndCeiling,Glass,Air, ABYSS};

export default Block;
