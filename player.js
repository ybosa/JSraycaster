class Player{
    x;
    y;
    angle;
    speed;
    sidewaysSpeed;
    world

    movePlayer() {
        let x = this.x + Math.cos(this.angle) * this.speed - Math.sin(this.angle) * this.sidewaysSpeed;
        let y = this.y + Math.sin(this.angle) * this.speed + Math.cos(this.angle) * this.sidewaysSpeed;

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
        this.sidewaysSpeed = 0;
    }
}