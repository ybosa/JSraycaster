class Block{
    static = true; //static blocks are always identical, so only 1 of its kind need to be crated
    invisible = false; //invisible blocks are not drawn
    wall = true; //walls occupy the square they are in
    floor = false;//ceilings are floors below the square they are in.
    ceiling = false;//ceilings are roofs over the square they are in.
    imageName = "missing.png";
}