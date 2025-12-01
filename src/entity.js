"use strict";
export default class Entity {
    #x;
    #y; //coords of entity

    #passable = false

    #light
    #sprite = false
    #spriteImageName = "missing.png"
    #width  = 1 //[m] physical width of sprite
    #height = 1 //[m] physical height of sprite

    constructor(x, y,width,height,spriteImageName,light,passable) {
        this.#x = x;
        this.#y = y;
        this.#passable = passable;
        this.#light = light;
        if(spriteImageName) {this.#sprite = true}
        this.#spriteImageName = spriteImageName;
        this.#width  = width;
        this.#height = height;
    }

    getX() {
        return this.#x;
    }

    getY() {
        return this.#y;
    }

    getWidth() {return this.#width}
    getHeight() {return this.#height}

    isPassable() {
        return this.#passable
    }

    hasSprite() {
        if (this.#sprite) return true
        else return false
    }

    getSpriteImageName() {
        return this.#spriteImageName
    }

    hasLight(){
        if (this.#light) return true
        else return false
    }

    getLight(){return this.#light}

    setPassable(passable) {
        this.#passable = passable
    }

}
