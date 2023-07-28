class Sprite extends Entity{
    sprite = true //caster and renderer treat sprites as 2d objects not blocks
    imageName = "missing.png"
    width  = 2 //[m] physical width of sprite
    height = 2 //[m] physical height of sprite
    passable = false

    placeSprite(world){
        //works with proportions (0 to 1) because it is easier
        let xDeci = this.x/CELL_SIZE - Math.floor(this.x/CELL_SIZE)
        let yDeci = this.y/CELL_SIZE - Math.floor(this.y/CELL_SIZE)
        let propHW = this.width/ (CELL_SIZE * 2) //proportional half width
        let overlap = this.width > CELL_SIZE || xDeci + propHW > 1 || xDeci - propHW <0 || yDeci + propHW > 1 || yDeci - propHW <0
        if(overlap){
            let mapX = Math.floor(this.x/CELL_SIZE)
            let mapY = Math.floor(this.y/CELL_SIZE)
            let cellRadius = Math.floor (propHW) +1 //radius of circle described by entity
            let cellRadius2 = (cellRadius-1) * (cellRadius-1) //radius^2 of circle described by entity
            for (let y = -cellRadius; y <= cellRadius; y++){
                for (let x = -cellRadius; x <= cellRadius; x++){
                    if(world.outOfMapBounds(mapX+x,mapY+y) || (x) * (x) + (y)*(y) >= cellRadius2 ) {}
                    world.putEntityCoords(this,mapX+x,mapY+y)


                }
            }

        }
        else
            world.putEntity(this)
    }
}