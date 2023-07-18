class Block{
    static = true; //static blocks are always identical, so only 1 of its kind need to be crated
    invisible = false; //invisible blocks are not drawn
    transparent = false;//if block is transparent ray will draw it and blocks behind
    imageName = "missing.png";

    passable = false;
}

class Floor extends Block{
    static = true;
    floorImageName = "floor.png";
    passable = true;
    transparent = true;
}
