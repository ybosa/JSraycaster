class Player{
    x;
    y;
    angle;
    speed;
    world

    movePlayer() {
        let x = this.x + Math.cos(this.angle) * this.speed;
        let y = this.y + Math.sin(this.angle) * this.speed;

        if(!this.world.collides(x,y)){
            this.x = x
            this.y = y
        }
    }


    constructor(x, y, angle, speed, world) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.world = world;
    }
}