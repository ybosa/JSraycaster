class Block{
    static = true; //static blocks are always identical, so only 1 of its kind need to be crated
    invisible = false; //invisible blocks are not drawn
    transparent = false;//if block is transparent ray will draw it and blocks behind
    imageName = "missing.png";
    passable = false;

    floor = false;
    ceiling = false;

}

class FloorAndCeiling extends Block{
    floor = true;
    ceiling = true;
    static = true;
    passable = true;
    transparent = true;

    floorColour = "white" //floors and ceilings drawn as solid colour blocks not textures due to performance cost
    ceilingColour = "gray"//floors and ceilings drawn as solid colour blocks not textures due to performance cost
}

const ABYSS = new Block() //placeholder block for out of bounds block logics
