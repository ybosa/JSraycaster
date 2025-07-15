"use strict";
import {GAME_TICK_RATE} from "./config.js";

class Player{
    x; //[m] x pos
    y; //[m] y pos
    angle; //[rad] xy plane angle
    speed; //[m/s] normal speed
    sidewaysSpeed; //[m/s] perp speed
    world;

    movePlayer() {
        let x = this.x + (Math.cos(this.angle) * this.speed - Math.sin(this.angle) * this.sidewaysSpeed)/GAME_TICK_RATE;
        let y = this.y + (Math.sin(this.angle) * this.speed + Math.cos(this.angle) * this.sidewaysSpeed)/GAME_TICK_RATE;

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

export default Player