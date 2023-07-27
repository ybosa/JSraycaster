class Block{
    static = true; //static blocks are always identical, so only 1 of its kind need to be crated
    invisible = false; //invisible blocks are not drawn FIXME not handled correctly
    transparent = false;//if block is transparent ray will draw it and blocks behind
    imageName = "missing.png";
    passable = false;
    wall = true;
    floor = false;
    ceiling = false;

}

class FloorAndCeiling extends Block{
    floor = true;
    ceiling = true;
    wall = false;
    static = true;
    passable = true;
    transparent = true;

    floorColour = "white" //floors and ceilings drawn as solid colour blocks not textures due to performance cost
    ceilingColour = "gray"//floors and ceilings drawn as solid colour blocks not textures due to performance cost
}

class Glass extends FloorAndCeiling{
    wall = true;
    passable = false;
    imageName = "glass.png"
    ceilingColour = "black"
    floorColour = "blue"
}

const ABYSS = new Block() //placeholder block for out of bounds block logics

class Air extends Block{
    invisible = false; //invisible blocks are not drawn FIXME
    transparent = true;//if block is transparent ray will draw it and blocks behind
    passable = true;
    wall = false;
    floor = false;
    ceiling = false;
}
