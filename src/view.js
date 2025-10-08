"use strict"
import {
    CELL_SIZE,
    DEBUG_MODE,
    FLOOR_TEXTURED_DRAW_MAX_DIST,
    IMAGE_PATH,
    MAX_RAY_DEPTH,
    MAX_RAYS, MIN_TRANSPARENCY_ANY_BLOCKS, MIN_TRANSPARENCY_TRANSPARENT_BLOCKS,
    MINIMAP
} from "./config.js";
import Block from "./block.js";
import Light from "./light.js";

let COLORS = {
    floor: "#376707", // "#ff6361"
    ceiling: "#7ccecc", // "#012975",
    wall: "#8a8a8f", // "#58508d"
    wallDark: "#66686c", // "#003f5c"
    rays: "#ffa600",
};
let FOV = toRadians(75);

let imageSet = new Set();
let missingIMGSet = new Set();
let missingImgName = "missing.png"
initMissingIMG()

class view {

    SCREEN_WIDTH = Math.floor(window.innerWidth / 2) * 2;
    SCREEN_HEIGHT = Math.floor(window.innerHeight / 2) * 2;
    numberOfRays;
    canvas;
    context;

    player;
    world;
    map;

    constructor(player, Canvas = document.createElement("canvas")) {
        this.canvas = Canvas;
        this.canvas.setAttribute("width", this.SCREEN_WIDTH);
        this.canvas.setAttribute("height", this.SCREEN_HEIGHT);
        document.body.appendChild(this.canvas);
        this.context = this.canvas.getContext("2d");
        this.context.imageSmoothingEnabled = false;

        this.player = player;
        this.world = player.world;
        this.map = this.world.map;

        if (MAX_RAYS <= 0) this.numberOfRays = this.SCREEN_WIDTH
        else this.numberOfRays = MAX_RAYS

        this.distanceBetweenRaysOnScreen = 2*Math.tan(FOV/2) / this.numberOfRays //equal distance between rays on the screen, used to fix distortion


    }

    changeNumRays(number){
        this.numberOfRays = number
        this.distanceBetweenRaysOnScreen = 2*Math.tan(FOV/2) / this.numberOfRays
    }

    clearScreen() {
        this.context.fillStyle = COLORS.floor;
        this.context.fillRect(0, this.SCREEN_HEIGHT / 2, this.SCREEN_WIDTH, this.SCREEN_HEIGHT / 2);
        this.context.fillStyle = COLORS.ceiling;
        this.context.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT / 2);
    }

    renderMinimap(rays) {
        let posX = 0, posY = 0;
        let screenPortion = 1 / 4 //portion of the screen covered
        let scale = this.SCREEN_WIDTH / (this.map.length * CELL_SIZE) * screenPortion  //[px/m] meters to pixels
        let cellSize = scale * CELL_SIZE; //[px] pixels each cell takes up
        this.map.forEach((row, y) => {
            row.forEach((cell, x) => {
                if(!cell) return
                if(! (cell instanceof Block)){
                    console.error("cell is not a block: x" + x +", y" + y );
                    console.error(cell)
                    return;
                }

                if(cell.isFloor()){
                    this.context.fillStyle =Light.colourToRGBA( Light.applyLightColourToBlock(cell.getFloorColour(),this.world.getLightColour(x,y)))
                    this.context.fillRect(posX + x * cellSize, posY + y * cellSize, cellSize, cellSize);
                }
                else if(cell.isWall())
                    this.context.drawImage(getImage(cell.getWallImageName()), posX + x * cellSize, posY + y * cellSize, cellSize, cellSize)
            });
        });
        this.context.fillStyle = "blue";
        this.context.fillRect(
            posX + this.player.x * scale - 10 / 2,
            posY + this.player.y * scale - 10 / 2,
            10,
            10
        );

        this.context.strokeStyle = "blue";
        this.context.beginPath();
        this.context.moveTo(this.player.x * scale, this.player.y * scale);
        this.context.lineTo(
            (this.player.x + Math.cos(this.player.angle) * 20) * scale,
            (this.player.y + Math.sin(this.player.angle) * 20) * scale
        );
        this.context.closePath();
        this.context.stroke();

        this.context.strokeStyle = COLORS.rays;
        rays.forEach((ray) => {
            this.context.beginPath();
            this.context.moveTo(this.player.x * scale, this.player.y * scale);
            this.context.lineTo(
                (this.player.x + Math.cos(ray.angle) * ray.toDrawArray[ray.toDrawArray.length -1].distance) * scale,
                (this.player.y + Math.sin(ray.angle) * ray.toDrawArray[ray.toDrawArray.length -1].distance) * scale
            );
            this.context.closePath();
            this.context.stroke();
        });
    }

    renderScene(rays) {
        this.drawSkybox(getImage(this.world.sky))
        const drawnFloors = []
        const drawnCeilings = []


        this.drawTexturedFloors(rays, drawnFloors, drawnCeilings);

        //render rays
        rays.forEach((ray, i) => {

            for (let j = ray.toDrawArray.length - 1; j >= 0; j--) {
                const toDrawData = ray.toDrawArray[j]
                const objectToDraw = toDrawData.toDraw
                //ignore out of bounds or invisible blocks
                if(objectToDraw.sprite) {
                    this.drawSprite(ray, i, toDrawData)
                    continue
                }
                if (objectToDraw.isInvisible()) continue
                if(objectToDraw.isDrawBackgroundImgInstead()){
                    const img =  (objectToDraw.isUsingWallImageAsBackgroundImg() ? getImage(objectToDraw.getWallImageName()) : getImage(this.world.sky))
                    this.drawWallWithSkyboxTexture(ray, i, toDrawData,img)
                    continue
                }

                if(objectToDraw.isWall() && objectToDraw.isWallImageIsScreenSpaceNotWorld()){
                    this.drawWallWithScreenSpaceTexture(ray,i,toDrawData)
                }
                else if(objectToDraw.isWall())
                    this.drawWall(ray, i, toDrawData)

            }

        });
        //    https://www.youtube.com/watch?v=8RDBa3dkl0g
    }

    drawTexturedFloors(rays, drawnFloors, drawnCeilings) {
        //draw textured floors
        rays.forEach((ray) => {
            let previousBlock = ray.toDrawArray[ray.toDrawArray.length - 1]
            for (let j = ray.toDrawArray.length - 1; j >= 0; j--) {
                const toDrawData = ray.toDrawArray[j]
                const block = toDrawData.toDraw
                if (!(block instanceof Block)) {
                    continue
                }

                const distance = this.distance(toDrawData.mapX * CELL_SIZE, toDrawData.mapY * CELL_SIZE, this.player.x, this.player.y)
                if (distance > FLOOR_TEXTURED_DRAW_MAX_DIST * CELL_SIZE && FLOOR_TEXTURED_DRAW_MAX_DIST >= 0) continue;

                if (!(drawnFloors[toDrawData.mapY] && drawnFloors[toDrawData.mapY][toDrawData.mapX]) && !(block.isInvisible() || block.isDrawBackgroundImgInstead())) {
                    //draw floors and ceilings, and lack thereof (as
                    //FIXME debug entry condition to this branch
                    if (block.isFloor()) {
                        let lightValue = (toDrawData.light) ? 'rgba(' + toDrawData.light[0] + ',' + toDrawData.light[1] + ',' + toDrawData.light[2] + ',' + toDrawData.light[3] + ')' : null;

                        //this is a correction for non-transparent walls, the floor underneath filing the gap btw wall, and prev blocks floor needs to use prev blocks light
                        if (block.isWall() && !(block.isTransparent() || block.isInvisible() || block.isDrawBackgroundImgInstead()) && previousBlock.light) {
                            lightValue = 'rgba(' + previousBlock.light[0] + ',' + previousBlock.light[1] + ',' + previousBlock.light[2] + ',' + previousBlock.light[3] + ')'
                        }

                        //draw floors
                        this.drawATexturedFloorOrCeiling(toDrawData.mapY, toDrawData.mapX, true, lightValue);
                        if (!drawnFloors[toDrawData.mapY]) {
                            drawnFloors[toDrawData.mapY] = []
                        }
                        drawnFloors[toDrawData.mapY][toDrawData.mapX] = true;
                    }
                }

                if (!(drawnCeilings[toDrawData.mapY] && drawnCeilings[toDrawData.mapY][toDrawData.mapX]) && !(block.isInvisible() || block.isDrawBackgroundImgInstead())) {
                    //draw floors and ceilings, and lack thereof (as
                    //FIXME debug entry condition to this branch
                    if (block.isCeiling()) {
                        let lightValue = (toDrawData.light) ? 'rgba(' + toDrawData.light[0] + ',' + toDrawData.light[1] + ',' + toDrawData.light[2] + ',' + toDrawData.light[3] + ')' : null;
                        //this is a correction for non-transparent walls, the ceiling underneath filing the gap btw wall, and prev blocks ceiling needs to use prev blocks light
                        if (block.isWall() && !(block.isTransparent() || block.isInvisible() || block.isDrawBackgroundImgInstead()) && previousBlock.light) {
                            lightValue = 'rgba(' + previousBlock.light[0] + ',' + previousBlock.light[1] + ',' + previousBlock.light[2] + ',' + previousBlock.light[3] + ')'
                        }

                        //draw ceilings
                        this.drawATexturedFloorOrCeiling(toDrawData.mapY, toDrawData.mapX, false, lightValue);

                        if (!drawnCeilings[toDrawData.mapY]) {
                            drawnCeilings[toDrawData.mapY] = []
                        }
                        drawnCeilings[toDrawData.mapY][toDrawData.mapX] = true;
                    }
                }
                previousBlock = toDrawData
            }

        });
    }

    drawWall(ray, i, toDrawData) {
        let block = toDrawData.toDraw
        if(block.isTransparent() && toDrawData.totalTransparency < MIN_TRANSPARENCY_TRANSPARENT_BLOCKS) return

        let perpDistance = fixFishEye(toDrawData.distance, ray.angle, this.player.angle);//[m] dist to wall
        let wallHeight = CELL_SIZE * this.SCREEN_HEIGHT / perpDistance //[px]height of wall
        let pixelWidth = this.SCREEN_WIDTH / this.numberOfRays //[px]width of each ray in px
        let img = getImage(block.getWallImageName())

        //process image sampling
        let sampleImageHorizontal = Math.abs(Math.floor(toDrawData.horizontalSample * img.width))
        let sampleImageHorizontalWidth = Math.abs(Math.floor(toDrawData.hSampleWidth * img.width))

        //boundry conds

        if(sampleImageHorizontalWidth === 0) sampleImageHorizontalWidth = 1;
        if(sampleImageHorizontal < 0) sampleImageHorizontal = 0;

        if(sampleImageHorizontalWidth > img.width) sampleImageHorizontalWidth = img.width;
        if(sampleImageHorizontal > img.width) sampleImageHorizontal = img.width;
        if(sampleImageHorizontalWidth + sampleImageHorizontal > img.width) sampleImageHorizontalWidth = img.width - sampleImageHorizontal;

        //
        //
        //
        // if (sampleImageHorizontalWidth <= 1) {
        //     sampleImageHorizontalWidth = 1
        // } else if (sampleImageHorizontalWidth + sampleImageHorizontal > img.width) sampleImageHorizontal = img.width - sampleImageHorizontalWidth
        // else if (sampleImageHorizontal <= 0) sampleImageHorizontal = 0

        //fix overdrawing ray bounds
        let drawStart = Math.floor(i *pixelWidth)
        let nextDrawStart = Math.floor((i+1) *pixelWidth)
        let drawWidth = Math.floor(nextDrawStart - drawStart)

        //draw Image
        this.context.drawImage(img, sampleImageHorizontal,
            0, sampleImageHorizontalWidth, img.height,
            drawStart, this.SCREEN_HEIGHT / 2 - wallHeight / 2-1, drawWidth, wallHeight+2)

        //draw lighting
        if(toDrawData.light) {
            this.context.fillStyle = 'rgba('+toDrawData.light[0]+','+toDrawData.light[1]+','+toDrawData.light[2]+','+toDrawData.light[3]+')';
            this.context.fillRect(drawStart, this.SCREEN_HEIGHT / 2 - wallHeight / 2-1, drawWidth , wallHeight+2)
        }


        if (DEBUG_MODE && pixelWidth > 5) {
            this.context.strokeStyle = 'red';
            this.context.strokeRect(drawStart, this.SCREEN_HEIGHT / 2 - wallHeight / 2-1, drawWidth, wallHeight+2)
        }
    }

    drawWallWithScreenSpaceTexture(ray, i, toDrawData) {
        const ctx = this.context;
        let block = toDrawData.toDraw
        if(block.isTransparent() && toDrawData.totalTransparency < MIN_TRANSPARENCY_TRANSPARENT_BLOCKS) return

        let perpDistance = fixFishEye(toDrawData.distance, ray.angle, this.player.angle);//[m] dist to wall
        let wallHeight = CELL_SIZE * this.SCREEN_HEIGHT / perpDistance //[px]height of wall
        let pixelWidth = this.SCREEN_WIDTH / this.numberOfRays //[px]width of each ray in px
        let img = getImage(block.getWallImageName())


        //fix overdrawing ray bounds
        let drawStart = Math.floor(i *pixelWidth)
        let nextDrawStart = Math.floor((i+1) *pixelWidth)
        let drawWidth = Math.floor(nextDrawStart - drawStart)


        //draw Image
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(drawStart, this.SCREEN_HEIGHT / 2 - wallHeight / 2-1);
        ctx.lineTo(drawStart+ drawWidth, this.SCREEN_HEIGHT / 2 - wallHeight / 2-1 );
        ctx.lineTo(drawStart+ drawWidth, this.SCREEN_HEIGHT / 2 - wallHeight / 2-1 + wallHeight+2 );
        ctx.lineTo(drawStart, this.SCREEN_HEIGHT / 2 - wallHeight / 2-1 + wallHeight+2);
        ctx.closePath();
        ctx.clip();
        this.context.drawImage(img,0,0,this.SCREEN_WIDTH,this.SCREEN_HEIGHT)
        ctx.restore();


        //draw lighting
        if(toDrawData.light) {
            this.context.fillStyle = 'rgba('+toDrawData.light[0]+','+toDrawData.light[1]+','+toDrawData.light[2]+','+toDrawData.light[3]+')';
            this.context.fillRect(drawStart, this.SCREEN_HEIGHT / 2 - wallHeight / 2-1, drawWidth , wallHeight+2)
        }


        if (DEBUG_MODE && pixelWidth > 5) {
            this.context.strokeStyle = 'magenta';
            this.context.strokeRect(drawStart, this.SCREEN_HEIGHT / 2 - wallHeight / 2-1, drawWidth, wallHeight+2)
        }
    }

    drawWallWithSkyboxTexture(ray, i, toDrawData,img) {
        const ctx = this.context;
        let perpDistance = fixFishEye(toDrawData.distance, ray.angle, this.player.angle);//[m] dist to wall
        let wallHeight = CELL_SIZE * this.SCREEN_HEIGHT / perpDistance //[px]height of wall
        let pixelWidth = this.SCREEN_WIDTH / this.numberOfRays //[px]width of each ray in px

        //fix overdrawing ray bounds
        let drawStart = Math.floor(i *pixelWidth)
        let nextDrawStart = Math.floor((i+1) *pixelWidth)
        let drawWidth = Math.floor(nextDrawStart - drawStart)

        //draw Image
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(drawStart, this.SCREEN_HEIGHT / 2 - wallHeight / 2-1);
        ctx.lineTo(drawStart+ drawWidth, this.SCREEN_HEIGHT / 2 - wallHeight / 2-1 );
        ctx.lineTo(drawStart+ drawWidth, this.SCREEN_HEIGHT / 2 - wallHeight / 2-1 + wallHeight+2 );
        ctx.lineTo(drawStart, this.SCREEN_HEIGHT / 2 - wallHeight / 2-1 + wallHeight+2);
        ctx.closePath();
        ctx.clip();
        this.drawSkybox(img,drawStart,this.SCREEN_HEIGHT / 2 - wallHeight / 2-1 ,drawWidth,wallHeight+2)
        ctx.restore();

        if (DEBUG_MODE && pixelWidth > 5) {
            this.context.strokeStyle = 'pink';
            this.context.strokeRect(drawStart, this.SCREEN_HEIGHT / 2 - wallHeight / 2-1, drawWidth, wallHeight+2)
        }
    }

    drawSprite(ray, i, toDrawData){
        let sprite = toDrawData.toDraw
        let perpDistance = toDrawData.distance//[m] ignore perpendicular distance for sprites
        let wallHeight = CELL_SIZE * this.SCREEN_HEIGHT / perpDistance //[px]height of wall
        let spriteHeight = this.SCREEN_HEIGHT / perpDistance * sprite.height //[px]height of wall
        let pixelWidth = this.SCREEN_WIDTH / this.numberOfRays //[px]width of each ray in px
        let img = getImage(sprite.imageName)

        //process image sampling
        let sampleImageHorizontal = (Math.floor(toDrawData.horizontalSample * img.width))
        //FIXME may cause issues with images being cut off on the sides with a small number of rays
        if(sampleImageHorizontal > img.width || sampleImageHorizontal < 0) return
        let sampleImageHorizontalWidth = Math.abs(Math.floor(toDrawData.hSampleWidth * img.width))
        if (sampleImageHorizontalWidth <= 1) {
            sampleImageHorizontalWidth = 1
        }
        //FIXME may cause issues with images being cut off on the sides with a small number of rays
        if(sampleImageHorizontalWidth + sampleImageHorizontal > img.width)return;

        //fix overdrawing ray bounds
        let drawStart = Math.floor(i *pixelWidth)
        let nextDrawStart = Math.floor((i+1) *pixelWidth)
        let drawWidth = Math.floor(nextDrawStart - drawStart)

        this.context.drawImage(img, sampleImageHorizontal,
            0, sampleImageHorizontalWidth, img.height,
            drawStart, this.SCREEN_HEIGHT / 2 + wallHeight/2 - spriteHeight-1, drawWidth, Math.floor(spriteHeight)+2)

        if (DEBUG_MODE && pixelWidth > 5) {
            this.context.strokeStyle = 'white';
            this.context.strokeRect( drawStart, this.SCREEN_HEIGHT / 2 + wallHeight/2 - spriteHeight-1, drawWidth, Math.floor(spriteHeight)+2);
        }
    }

    calculateSpriteSample(sprite,rayAngle){
        //Can be greater than 2pi
        let playerWithSpriteAngle = Math.atan2((sprite.y-this.player.y),(sprite.x-this.player.x)) -this.player.angle
        rayAngle = rayAngle -this.player.angle



        //FIXME drawing sprites when behind player
        //FIXME not drawing sides of  sprites when close to player

        return 1/2 + this.distance(this.player.x,this.player.y,sprite.x,sprite.y)/sprite.width*
            (Math.cos(playerWithSpriteAngle)* Math.tan(rayAngle ) - Math.sin(playerWithSpriteAngle) )
    }

    calculateSpriteSampleWidth(sprite,rayAngle, prevAngle){
        let sampleEnd = this.calculateSpriteSample(sprite,rayAngle)
        let sampleStart = this.calculateSpriteSample(sprite,prevAngle)
        if(!sampleEnd || !sampleStart)
            return undefined
        return Math.abs(sampleEnd - sampleStart )
    }

    castRay(angle,prevAngle) {
        let right = Boolean(Math.abs(Math.floor((angle - Math.PI / 2) / Math.PI) % 2)); //facing right
        let up = !Boolean(Math.abs(Math.floor(angle / Math.PI) % 2)); //facing up

        const deltaDistX = Math.abs(CELL_SIZE / Math.cos(angle)); //Increase in ray dist after every move 1 cell x wards
        const deltaDistY = Math.abs(CELL_SIZE / Math.sin(angle)); //Increase in ray dist after every move 1 cell y wards

        let sideDistX = (right) ? CELL_SIZE * (Math.floor(this.player.x / CELL_SIZE) + 1 - this.player.x / CELL_SIZE) / Math.cos(angle) : CELL_SIZE * (Math.floor(this.player.x / CELL_SIZE) - this.player.x / CELL_SIZE) / Math.cos(angle)//distance to the next vertical wall
        sideDistX = Math.abs(sideDistX)
        let sideDistY = (up) ? CELL_SIZE * (Math.floor(this.player.y/ CELL_SIZE) + 1 - this.player.y/ CELL_SIZE) / Math.sin(angle) :CELL_SIZE * (Math.floor(this.player.y/CELL_SIZE) - this.player.y/CELL_SIZE) / Math.sin(angle)   //distance to the next horizontal wall
        sideDistY = Math.abs(sideDistY)
        let mapX = Math.floor(this.player.x / CELL_SIZE) //grid cell player is in x coord
        let mapY = Math.floor(this.player.y / CELL_SIZE) //grid cell player is in y coord

        //step forward rays
        let totalTransparency = 1;
        let distance = 0;
        let count = 0
        let toDrawArray = [] //set of all the drawable objects visited by the ray
        pushToDrawArray(toDrawArray,this.map[mapY][mapX], mapX, mapY, distance,0,0,this.world.getLightColour(mapX,mapY),totalTransparency) //can ignore sampling value on block you are standing in, assuming its not a wall
        while (count <= MAX_RAY_DEPTH && totalTransparency > MIN_TRANSPARENCY_ANY_BLOCKS) {
            count++;
            let vertical = sideDistX < sideDistY;
            //jump to next map square, either in x-direction, or in y-direction
            if (vertical) { //vertical wall is closer
                distance = sideDistX;
                sideDistX += deltaDistX;
                mapX += (right) ? 1 : -1;
            } else { //horizontal wall is closer
                distance = sideDistY;
                sideDistY += deltaDistY;
                mapY += (up) ? 1 : -1;
            }
            //check if out of bounds
            if (this.world.outOfMapBounds(mapX, mapY)) {
                //fixme need to add a block here that tells it to redraw the background for the wall so you cant see a floor or ceiling behind it!
                return {
                    angle,
                    toDrawArray,
                };
            }

            //not out of bounds so add sprite to array if it exists
            if(this.world.getEntities(mapX,mapY) && this.world.getEntities(mapX,mapY).length > 0 ){
                this.world.getEntities(mapX,mapY).forEach((entity) =>{
                    if(entity.sprite) {
                        const sample = this.calculateSpriteSample(entity, angle)
                        const sampleWidth = this.calculateSpriteSampleWidth(entity, angle, prevAngle)
                        if(sample && sampleWidth)
                            pushToDrawArray(toDrawArray, entity, mapX, mapY, this.distance(this.player.x, this.player.y, entity.x, entity.y),
                                sample, sampleWidth,this.world.getLightColour(mapX, mapY),totalTransparency)
                    }
                })
            }

            //Not out of bounds so add current block to array (ignore invisible toDrawArray
            if (!this.map[mapY][mapX].isInvisible()) {
                let horizontalSample = 0;
                let hSampleWidth  = 0;
                let light = this.world.getLightColour(mapX,mapY)
                //only bother to sample textures for walls
                if(this.map[mapY][mapX].isWall()){
                    horizontalSample = (vertical) ? this.calcSample(vertical, distance, angle, mapY,right,up) : this.calcSample(vertical, distance, angle, mapX,right,up);

                    const addAHwall = ((vertical && !right)) ? 1 : 0
                    const addAVwall = (!vertical && !up) ? 1 : 0


                    let angleStep = FOV / this.numberOfRays
                    let nextDistance = (vertical) ? (( CELL_SIZE *  (mapX + addAHwall) - this.player.x) / Math.cos(angle + angleStep))  : (CELL_SIZE *  (mapY+addAVwall) - this.player.y) / Math.cos(angle + angleStep- Math.PI / 2)
                    let NextHorizontalSample = (vertical) ? this.calcSample(vertical, nextDistance, angle+ angleStep, mapY,right,up) : this.calcSample(vertical, nextDistance, angle+ angleStep, mapX,right,up);
                    hSampleWidth = NextHorizontalSample - horizontalSample;

                    //light level illuminating this non-transparent block is from previous one
                    if(!this.map[mapY][mapX].isTransparent())
                        light = toDrawArray[toDrawArray.length -1].light

                }
                pushToDrawArray(toDrawArray,this.map[mapY][mapX], mapX, mapY, distance,horizontalSample,hSampleWidth, light,totalTransparency)
            }
            //adjust totalTransparency
            if(this.map[mapY][mapX].isTransparent()){
                totalTransparency -= this.map[mapY][mapX].getOpacity();
            }

            //Check if ray has hit a wall, end raycast.
            if (!this.map[mapY][mapX].isTransparent()) {
                break
            }
        }
        return {
            angle,
            toDrawArray,
        };
    }

    calcSample(vertical, distance, angle, mapQ,right,up) {
        const inv = (!vertical) ? up : !right
        const sample = (vertical) ? (distance * Math.sin(angle) + this.player.y) / CELL_SIZE - mapQ : (distance * Math.cos(angle) + this.player.x) / CELL_SIZE - mapQ

        return (inv) ? 1- sample : sample
    }

    redraw() {
        loadImages()
        let rays = this.getRays()
        this.clearScreen()
        this.renderScene(rays)
        if(MINIMAP)
            this.renderMinimap(rays);
    }

    getRays() {
        let initialAngle = this.player.angle
        let prevAngle = initialAngle
        // let angleStep = FOV / this.numberOfRays;
        return Array.from({length: this.numberOfRays}, (_, i) => {
            let dAngle = Math.atan((i - this.numberOfRays/2 )*this.distanceBetweenRaysOnScreen  )
            let angle = initialAngle + dAngle
            let temp = prevAngle
            prevAngle = angle
            return this.castRay(angle,temp);
        });
    }

    calcImageSampleWidth(distance, angle, func) {
        let angleStep = FOV / this.numberOfRays

        return Math.abs(distance / CELL_SIZE * (func(angle) - func(angle + angleStep)))

    }

    drawSkybox(img) {
        let rotation = this.player.angle / (2 * Math.PI) - Math.floor(this.player.angle / (2 * Math.PI)) //btw 0 and 1

        let sXStart = rotation * img.width //[px]
        let sXWidth = FOV / (2 * Math.PI) * img.width //[px]
        this.context.drawImage(img, sXStart, 0, sXWidth, img.height, 0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT)

        //reached the right end of the image
        if (sXStart + sXWidth > img.width) {
            let sXWDrawn = (img.width - sXStart)
            let sXWRemain = sXWidth - sXWDrawn

            let scale = this.SCREEN_WIDTH / sXWidth
            let ScreenPosX = scale * sXWDrawn
            let ScreenRemainingX = scale * sXWRemain

            this.context.drawImage(img, 0, 0, sXWRemain, img.height, ScreenPosX-1, 0, ScreenRemainingX+1, this.SCREEN_HEIGHT)
        }
    }

    distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    /**
     * Calculates the pixel height on the screen for a section of wall at a given distance and angle
     * And corrects for fish eye
     * @param distance from camera to wall
     * @param rayAngle absolute angle of the ray
     * @param playerAngle angle camera is facing
     * @returns {number} how many pixels tall the wall segment is
     */
    wallHeightPix(distance,rayAngle,playerAngle){
        let perpDistance = fixFishEye(distance, rayAngle, playerAngle);//[m] dist to wall
        //[px]height of wall
        return CELL_SIZE * this.SCREEN_HEIGHT / perpDistance;
    }

    /**
     * Calculates the pixel height on the screen for a section of wall at a given distance and angle
     * And DOES NOT correct for fish eye - useful for sprites
     * @param distance from camera to wall / sprite
     * @returns {number} how many pixels tall the wall segment is
     */
    wallHeightPixNoFishEyeCorrection(distance){
        //[px]height of wall
        return CELL_SIZE * this.SCREEN_HEIGHT / distance;
    }

    /**
     * Function that draws either a ceiling or floor on the screen, for the given map coords,
     * relative to the players view
     * @param MapY block y coord in map array
     * @param MapX block x coord in map array
     * @param floor (true) if drawing a floor, false if drawing a ceiling
     */
    drawATexturedFloorOrCeiling(MapY,MapX,floor,lightValue){
        const ctx = this.context;
        ctx.save();
        const distance = this.distance(this.player.x,this.player.y,MapX*CELL_SIZE,MapY*CELL_SIZE)/CELL_SIZE;

        const TL_BlockScreenCord =  this.worldCordToScreenCord(MapX,MapY,floor)
        const BL_BlockScreenCord =  this.worldCordToScreenCord(MapX,MapY+1,floor)
        const TR_BlockScreenCord =  this.worldCordToScreenCord(MapX+1,MapY,floor)
        const BR_BlockScreenCord =  this.worldCordToScreenCord(MapX+1,MapY+1,floor)

        const TL_BlockScreenCord_Is_Valid = this.validateScreenCord(TL_BlockScreenCord,floor);
        const BL_BlockScreenCord_Is_Valid = this.validateScreenCord(BL_BlockScreenCord,floor);
        const TR_BlockScreenCord_Is_Valid = this.validateScreenCord(TR_BlockScreenCord,floor);
        const BR_BlockScreenCord_Is_Valid = this.validateScreenCord(BR_BlockScreenCord,floor);


        const validblue = TL_BlockScreenCord_Is_Valid && BL_BlockScreenCord_Is_Valid && TR_BlockScreenCord_Is_Valid; //blue polygon represents top let corner of block
        const validred = BL_BlockScreenCord_Is_Valid && TR_BlockScreenCord_Is_Valid && BR_BlockScreenCord_Is_Valid; //red polygon represents bottom right corner of block


        //triangle
        const block = this.map[MapY][MapX]
        const image = (floor) ? getImage(block.getFloorImageName() ): getImage(block.getCeilingImageName());

        if(TL_BlockScreenCord_Is_Valid &&
            BL_BlockScreenCord_Is_Valid &&
            TR_BlockScreenCord_Is_Valid) {
            if(DEBUG_MODE){
                ctx.beginPath();
                ctx.moveTo(TL_BlockScreenCord.i, TL_BlockScreenCord.j);// DRAWING ON SCREEN COORDS
                ctx.lineTo(BL_BlockScreenCord.i, BL_BlockScreenCord.j);// DRAWING ON SCREEN COORDS
                ctx.lineTo(TR_BlockScreenCord.i, TR_BlockScreenCord.j);// DRAWING ON SCREEN COORDS
                ctx.closePath();
                ctx.fillStyle = "blue"; //both are good
                if(!validred) ctx.fillStyle = "darkblue" // red cant be drawn blue can
                ctx.fill();
            }
            else {

                const s0 = {x: 0, y: 0}
                const s1 = {x: image.width, y: 0}
                const s2 = {x: 0, y: image.height}
                const srcTri = [s0, s1, s2];
                let dstTri = [{x: TL_BlockScreenCord.i, y: TL_BlockScreenCord.j}, {
                    x: TR_BlockScreenCord.i,
                    y: TR_BlockScreenCord.j
                }, {x: BL_BlockScreenCord.i, y: BL_BlockScreenCord.j}];
                dstTri = this.nudgeTriangleOutward(dstTri, distance)

                this.drawAffineTriangleGeneral(ctx, image, srcTri, dstTri)
                if (lightValue) this.drawSolidColourShape(ctx, lightValue, dstTri)
            }

        }
        if(TR_BlockScreenCord_Is_Valid &&
            BL_BlockScreenCord_Is_Valid &&
            BR_BlockScreenCord_Is_Valid) {
            if(DEBUG_MODE){
                ctx.beginPath();
                ctx.moveTo(TR_BlockScreenCord.i, TR_BlockScreenCord.j);// DRAWING ON SCREEN COORDS
                ctx.lineTo(BL_BlockScreenCord.i, BL_BlockScreenCord.j);// DRAWING ON SCREEN COORDS
                ctx.lineTo(BR_BlockScreenCord.i, BR_BlockScreenCord.j);// DRAWING ON SCREEN COORDS
                ctx.closePath();
                ctx.fillStyle = "red"; //both are good
                if(!validblue) ctx.fillStyle = "darkred" //blue cant be drawn red can
                ctx.fill();
            }
            else {
                const s0 = {x: image.width, y: image.height}
                const s1 = {x: 0, y: image.height}
                const s2 = {x: image.width, y: 0}
                const srcTri = [s0, s1, s2];
                let dstTri = [{x: BR_BlockScreenCord.i, y: BR_BlockScreenCord.j}, {
                    x: BL_BlockScreenCord.i,
                    y: BL_BlockScreenCord.j
                }, {x: TR_BlockScreenCord.i, y: TR_BlockScreenCord.j}];
                dstTri = this.nudgeTriangleOutward(dstTri, distance)

                this.drawAffineTriangleGeneral(ctx, image, srcTri, dstTri)
                if (lightValue) this.drawSolidColourShape(ctx, lightValue, dstTri)
            }
        }

        if( !validblue && !validred && TL_BlockScreenCord_Is_Valid && BR_BlockScreenCord_Is_Valid ){
            if(TR_BlockScreenCord_Is_Valid){
                if(DEBUG_MODE){
                    ctx.beginPath();
                    ctx.moveTo(TR_BlockScreenCord.i, TR_BlockScreenCord.j);// DRAWING ON SCREEN COORDS
                    ctx.lineTo(TL_BlockScreenCord.i, TL_BlockScreenCord.j);// DRAWING ON SCREEN COORDS
                    ctx.lineTo(BR_BlockScreenCord.i, BR_BlockScreenCord.j);// DRAWING ON SCREEN COORDS


                    ctx.closePath();
                    ctx.fillStyle = "yellow";
                    ctx.fill();

                }
                else {
                    const s0 = {x: image.width, y: 0}
                    const s1 = {x: 0, y: 0}
                    const s2 = {x: image.width, y: image.height}
                    const srcTri = [s0, s1, s2];
                    let dstTri = [{x: TR_BlockScreenCord.i, y: TR_BlockScreenCord.j}, {
                        x: TL_BlockScreenCord.i,
                        y: TL_BlockScreenCord.j
                    }, {x: BR_BlockScreenCord.i, y: BR_BlockScreenCord.j}];
                    dstTri = this.nudgeTriangleOutward(dstTri, distance)

                    this.drawAffineTriangleGeneral(ctx, image, srcTri, dstTri)
                    if (lightValue) this.drawSolidColourShape(ctx, lightValue, dstTri)
                }

            }
            else if(BL_BlockScreenCord_Is_Valid){
                if(DEBUG_MODE){
                    ctx.beginPath();
                    ctx.moveTo(BL_BlockScreenCord.i, BL_BlockScreenCord.j);// DRAWING ON SCREEN COORDS
                    ctx.lineTo(BR_BlockScreenCord.i, BR_BlockScreenCord.j);// DRAWING ON SCREEN COORDS
                    ctx.lineTo(TL_BlockScreenCord.i, TL_BlockScreenCord.j);// DRAWING ON SCREEN COORDS


                    ctx.closePath();
                    ctx.fillStyle = "orange";
                    ctx.fill();

                }
                else {
                    const s0 = {x: 0, y: image.height}
                    const s1 = {x: image.width, y: image.height}
                    const s2 = {x: 0, y: 0}
                    const srcTri = [s0, s1, s2];
                    let dstTri = [{x: BL_BlockScreenCord.i, y: BL_BlockScreenCord.j}, {
                        x: BR_BlockScreenCord.i,
                        y: BR_BlockScreenCord.j
                    }, {x: TL_BlockScreenCord.i, y: TL_BlockScreenCord.j}];
                    dstTri = this.nudgeTriangleOutward(dstTri, distance)

                    this.drawAffineTriangleGeneral(ctx, image, srcTri, dstTri)
                    if (lightValue) this.drawSolidColourShape(ctx, lightValue, dstTri)
                }
            }
        }
        ctx.restore();
    }

    drawSolidColourShape(ctx,colourValue,positions){
        if(!colourValue) return
        if(positions.length < 1) return;

        ctx.beginPath();
        ctx.moveTo(positions[0].x, positions[0].y);// DRAWING ON SCREEN COORDS

        for(let index = 1; index < positions.length; index++) {
            ctx.lineTo(positions[index].x, positions[index].y);// DRAWING ON SCREEN COORDS
        }
        ctx.closePath();
        ctx.fillStyle = colourValue;
        ctx.fill();
    }

    nudgeTriangleOutward(dstTri, distance) {
        const [p0, p1, p2] = dstTri;
        let amount = 1  + distance//0.5

        if(amount > 5)
            amount = 5 //FIXME consider limiting max size of nudge , also floor the ammount?

        // Compute centroid
        const cx = (p0.x + p1.x + p2.x) / 3;
        const cy = (p0.y + p1.y + p2.y) / 3;

        // // Check for degenerate triangle (near-zero area)
        // const area = Math.abs(
        //     (p1.x - p0.x) * (p2.y - p0.y) - (p2.x - p0.x) * (p1.y - p0.y)
        // ) * 0.5;
        // if (area < 0.01) {
        //     // Triangle is too small or flat — skip adjustment
        //     return dstTri;
        // }

        // Nudge each point outward from centroid by maxOffset (capped)
        return dstTri.map(p => {
            const dx = p.x - cx;
            const dy = p.y - cy;
            const len = Math.hypot(dx, dy) || 1;
            return {
                x: p.x + (dx / len) * amount,
                y: p.y + (dy / len) * amount,
            };
        });
    }

    drawAffineTriangleGeneral(ctx, img, srcTri, dstTri) {
        const [s0, s1, s2] = srcTri;
        const [d0, d1, d2] = dstTri;

        // Compute source vectors (from s0)
        const sx1 = s1.x - s0.x;
        const sy1 = s1.y - s0.y;
        const sx2 = s2.x - s0.x;
        const sy2 = s2.y - s0.y;

        // Compute destination vectors (from d0)
        const dx1 = d1.x - d0.x;
        const dy1 = d1.y - d0.y;
        const dx2 = d2.x - d0.x;
        const dy2 = d2.y - d0.y;

        ctx.save();

        // Move to destination triangle origin
        ctx.translate(d0.x, d0.y);

        // Clip to destination triangle
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(dx1, dy1);
        ctx.lineTo(dx2, dy2);
        ctx.closePath();
        ctx.clip();

        // Build affine transform from source to destination
        // Solve matrix A such that: A * (sx1, sy1) = (dx1, dy1)
        //                           A * (sx2, sy2) = (dx2, dy2)
        //
        // So:
        //   | a c |   *   | sx1 sx2 |   =   | dx1 dx2 |
        //   | b d |       | sy1 sy2 |       | dy1 dy2 |

        const det = sx1 * sy2 - sx2 * sy1;
        if (det === 0) {
            // console.warn("Degenerate triangle");
            ctx.restore();
            return;
        }

        const idet = 1 / det;

        // Inverse matrix of source
        const isx1 =  sy2 * idet;
        const isy1 = -sy1 * idet;
        const isx2 = -sx2 * idet;
        const isy2 =  sx1 * idet;

        // Final transform matrix = dest * inverse(src)
        const a = dx1 * isx1 + dx2 * isx2;
        const b = dy1 * isx1 + dy2 * isx2;
        const c = dx1 * isy1 + dx2 * isy2;
        const d = dy1 * isy1 + dy2 * isy2;
        const e = -a * s0.x - c * s0.y;
        const f = -b * s0.x - d * s0.y;

        ctx.transform(a, b, c, d, e, f);

        ctx.drawImage(img, 0, 0);

        ctx.restore();
    }

    /**
     * draws a circular point coordinate on the screen, used to debug
     * @param ctx context object
     * @param coord {i,j} coordinate object
     * @param fill circle fill colour
     * @param line circle line colour
     */
    drawAPoint(ctx,coord, fill, line){
        const lw = ctx.lineWidth;
        ctx.beginPath();
        ctx.arc(coord.i,coord.j,30,0,2*Math.PI)
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.lineWidth = 10;
        ctx.strokeStyle = line;
        ctx.stroke();


        //reset line width
        ctx.lineWidth = lw
    }

    /**
     * Consideres a screen coordinate representing a point on either the floor or ceiling plates and returns true or false
     * if that point was calculated correctly.
     *
     * @param coordinate screen coordinate {i,j} of pixel. i is horizontal, j is vertical (j=0 => top of screen)
     * @param floor is this point on the floor plane (true) or ceiling plane (false)
     * @returns {boolean} was this screen coordinate calculated correctly
     */
    validateScreenCord(coordinate,floor){
        //a floor coordinate should not be above the screen, this implies a error (eg coord was behind player camera)
        //likewise the ceiling coordinate should not be below the screen.

        if(floor && coordinate.j < this.SCREEN_HEIGHT/2 - 1){
            return false
        }

        if(!floor && coordinate.j > this.SCREEN_HEIGHT/2 +1){
            return false
        }

        return true;
    }

    /**
     * bad name here //FIXME
     * takes the values of a {i,j} screen coordinate object and Math.floors them
     * @param coordinate
     * @returns {*}
     */
    floorScreenCord(coordinate){
        coordinate.i = Math.floor(coordinate.i);
        coordinate.j = Math.floor(coordinate.j);
        //FIXME potential fix gaps bettween draws by adding +/- 1 px to the coordinates depending on side of screen?
        // need to figure out if this is a issue first
        return coordinate
    }

    /**
     * Calculates the onscreen coordinates of a point, given its mapX mapY coords (array grid coords - allows decimal) in block
     * and calculates where it would appear on the players screen.
     * @param MapX map x coordinate, array grid coords can be a decimal
     * @param MapY map y coordinate, array grid coords can be a decimal
     * @param floor is the point on the floor plain (true) or the ceiling plane (false)
     * @returns {*}
     */
    worldCordToScreenCord(MapX,MapY,floor){
        const x = MapX * CELL_SIZE
        const y = MapY * CELL_SIZE
        //convert from position (x,y) to position(theta, distance)
        const distance = this.distance(x,y,this.player.x,this.player.y)
        let angle = Math.atan2(y-this.player.y,x-this.player.x)

        if(!floor) angle =  Math.atan2(this.player.y-y,this.player.x-x)

        //convert from position(theta, distance) to screen postion(i,j)
        let alpha =  (angle - this.player.angle + FOV/2)

        /* how angle correction works in ray cast
        // let angleStep = FOV / this.numberOfRays;
        let dAngle = Math.atan((i - this.numberOfRays/2 )*this.distanceBetweenRaysOnScreen  )
        let angle = player.angle + dAngle
        */

        /*reverse correction to find i    (i is proportion of screen not pixels)
        (i - this.numberOfRays/2 )*this.distanceBetweenRaysOnScreen  ) = tan (dangle)
        (i - this.numberOfRays/2 ) = tan (dangle) / this.distanceBetweenRaysOnScreen
        i = tan (dangle) / this.distanceBetweenRaysOnScreen + this.numberOfRays/2

        angle = player.angle + dAngle
        dAngle = angle - player.angle

        i = tan (angle - player.angle) / this.distanceBetweenRaysOnScreen + this.numberOfRays/2

        */


        // let i = alpha/FOV * this.SCREEN_WIDTH / number of rays //fixme, distorted at angles to player, the error is that the delta between each ray is not constant!

        let i = (Math.tan (angle - this.player.angle) / this.distanceBetweenRaysOnScreen + this.numberOfRays/2) * (this.SCREEN_WIDTH / this.numberOfRays)

        let j =(this.SCREEN_HEIGHT / 2 + CELL_SIZE *this.SCREEN_HEIGHT /fixFishEye(distance, angle, this.player.angle)/2)

        return this.floorScreenCord({i,j,angle,distance})
    }


    /*removedFunctionToDrawSolidColourFloorCelings(){
        return
        const pixelWidth = this.SCREEN_WIDTH / this.numberOfRays //[px]width of each ray in px

        //TODO skip floor drawing should be changed to average colours, for long distance rendering!
        //TODO solid colour drawing is faster via the triangle method for individual tiles,
        //TODO only should use the skip draw method when drawing many at once, eg long distance average colour which is faster (and no gaps for ray spacing)

        /!*!//this should be used to average colour out when not drawing a textured floor!
        //floor drawing variables
        let skipDrawFloorLine = this.SCREEN_HEIGHT/2
        let skipDrawFloor = false
        let skipDrawFloorCount =0
        let skipDrawFloorColour = null
        //ceiling drawing variables
        let skipDrawCeilingLine = 0
        let skipDrawCeiling = false
        let skipDrawCeilingCount =0
        let skipDrawCeilingColour = null*!/


        /!*!//draw floors and ceilings, and lack thereof (as
                //FIXME debug entry condition to this branch, may just need to be true
                if ((block.isFloor() || block.isCeiling() ) || (!block.isWall() && !block.isFloor() && !block.isCeiling()) || block.isTransparent()) {
                    const floorHasBeenDrawnAsATexture = (drawnFloors[useful.mapY] && drawnFloors[useful.mapY][useful.mapX]);
                    const ceilingHasBeenDrawnAsATexture = (drawnCeilings[useful.mapY] && drawnCeilings[useful.mapY][useful.mapX]);

                    //fix overdrawing ray bounds
                    let drawHorizStart = Math.floor(i *pixelWidth)
                    let nextDrawHorizStart = Math.floor((i+1) *pixelWidth)
                    let drawWidth = Math.floor(nextDrawHorizStart - drawHorizStart)

                    let distWall = fixFishEye(useful.distance, ray.angle, this.player.angle)
                    let wallHeight = CELL_SIZE * this.SCREEN_HEIGHT / distWall //[px]height of wall
                    // calc floor/ceiling screen height based on wall height
                    let drawStart =(this.SCREEN_HEIGHT / 2 + CELL_SIZE *this.SCREEN_HEIGHT /fixFishEye(previousBlock.distance, ray.angle, this.player.angle)/2)
                    if(! skipDrawFloor && drawStart > this.SCREEN_HEIGHT) {}
                    else {
                        let drawEnd = this.SCREEN_HEIGHT / 2 + wallHeight / 2
                        if (drawEnd > this.SCREEN_HEIGHT) drawEnd = this.SCREEN_HEIGHT

                        const drawDist = drawEnd - drawStart

                        //get the next block
                        let nextFloorHasBeenDrawnAsATexture = false;
                        let nextCeilingHasBeenDrawnAsATexture = false;
                        let nextBlockFloorColour = null
                        let nextBlockCeilingColour = null
                        let nextBlockLightColour = null
                        for (let k = j - 1; k >= 0; k--) {
                            if (ray.blocks[k].block instanceof Block) {
                                nextBlockFloorColour = ray.blocks[k].block.getFloorColour()
                                nextBlockCeilingColour = ray.blocks[k].block.getCeilingColour()
                                nextBlockLightColour = this.world.getLightColour(ray.blocks[k].mapX, ray.blocks[k].mapY)
                                nextFloorHasBeenDrawnAsATexture = (drawnFloors[ray.blocks[k].mapY] && drawnFloors[ray.blocks[k].mapY][ray.blocks[k].mapX])
                                nextCeilingHasBeenDrawnAsATexture = (drawnCeilings[ray.blocks[k].mapY] && drawnCeilings[ray.blocks[k].mapY][ray.blocks[k].mapX])
                                break
                            }
                        }
                        //check that current light level and next one are equal
                        let noLightColourDiff = arraysEqual(this.world.getLightColour(useful.mapX, useful.mapY), nextBlockLightColour)

                        //DRAW THE FLOOR BLOCK
                        //draw debug grid
                        if (DEBUG_MODE) {
                            //DRAW THE FLOOR BLOCK
                            //activate skip draw, don't skip when j == 0, or when the next block is not a floor, so we don't get missed draws
                            if (!skipDrawFloor && !block.isWall() && noLightColourDiff && block.isFloor() && block.getFloorColour() === nextBlockFloorColour && j !== 0 && !floorHasBeenDrawnAsATexture && !nextFloorHasBeenDrawnAsATexture) {
                                skipDrawFloorLine = drawStart
                                skipDrawFloor = true
                                skipDrawFloorCount += drawDist;
                                skipDrawFloorColour = block.getFloorColour()

                            }
                                //continueSkipDraw, stop when j == 0, or when the next block is not a floor, so we don't get missed draws
                            //stop when current block is a wall (eg glass) so we dont overdraw the block
                            else if (skipDrawFloor && !block.isWall() && noLightColourDiff && j !== 0 && block.isFloor() && block.getFloorColour() === skipDrawFloorColour && !floorHasBeenDrawnAsATexture) {
                                skipDrawFloorCount += drawDist;
                            }
                            //end skipDraw
                            else {
                                //draw skipped lines
                                if (skipDrawFloor) {
                                    skipDrawFloor = false
                                    this.context.strokeStyle = 'blue';
                                    this.context.strokeRect(drawHorizStart, skipDrawFloorLine, drawWidth, drawStart - skipDrawFloorLine + 1);
                                    skipDrawFloorCount = 0;
                                }
                                //draw tile
                                if (block.isFloor() && !floorHasBeenDrawnAsATexture) {
                                    this.context.strokeStyle = 'yellow';
                                    this.context.strokeRect(drawHorizStart, drawStart, drawWidth, drawDist + 1);
                                }


                            }
                        }
                        //otherwise, draw floor regularly
                        else {
                            //activate skip draw, dont skip when j == 0, or when the next block is not a floor, so we don't get missed draws
                            if (!skipDrawFloor && !block.isWall() && noLightColourDiff && block.isFloor() && block.getFloorColour() === nextBlockFloorColour && j !== 0 && !floorHasBeenDrawnAsATexture && !nextFloorHasBeenDrawnAsATexture) {
                                skipDrawFloorLine = drawStart
                                skipDrawFloor = true
                                skipDrawFloorCount += drawDist;
                                skipDrawFloorColour = block.getFloorColour()

                            }
                                //continueSkipDraw, stop when j == 0, or when the next block is not a floor, so we don't get missed draws
                            //stop when current block is a wall (eg glass) so we dont overdraw the block
                            else if (skipDrawFloor && !block.isWall() && noLightColourDiff && j !== 0 && block.isFloor() && block.getFloorColour() === skipDrawFloorColour && !floorHasBeenDrawnAsATexture) {
                                skipDrawFloorCount += drawDist;
                            }
                            //end skipDraw
                            else {
                                //draw skipped lines
                                if (skipDrawFloor) {
                                    skipDrawFloor = false
                                    this.context.fillStyle = Light.colourToRGBA(Light.applyLightColourToBlock(skipDrawFloorColour, this.world.getLightColour(useful.mapX, useful.mapY)));
                                    this.context.fillRect(drawHorizStart, skipDrawFloorLine, drawWidth, drawStart - skipDrawFloorLine + 1);
                                    skipDrawFloorCount = 0;
                                }
                                //draw large tile
                                if (block.isFloor() && !floorHasBeenDrawnAsATexture) {
                                    this.context.fillStyle = Light.colourToRGBA(Light.applyLightColourToBlock(block.getFloorColour(), this.world.getLightColour(useful.mapX, useful.mapY)));
                                    this.context.fillRect(drawHorizStart, drawStart, drawWidth, drawDist + 1);
                                }
                            }
                        }


                        //DRAW THE CEILING BLOCK
                        //activate skip draw, dont skip when j == 0, so we don't get missed draws
                        if (!skipDrawCeiling && !block.isWall() && block.isCeiling() && noLightColourDiff && block.getCeilingColour() === nextBlockCeilingColour && j !== 0 && !ceilingHasBeenDrawnAsATexture && !nextCeilingHasBeenDrawnAsATexture) {
                            skipDrawCeilingLine = drawStart
                            skipDrawCeiling = true
                            skipDrawCeilingCount += Math.abs(drawDist);
                            skipDrawCeilingColour = block.getCeilingColour()

                        }
                            //continueSkipDraw, stop when j == 0, so we don't get missed draws
                        //stop when current block is a wall (eg glass) so we dont overdraw the block
                        else if (skipDrawCeiling && !block.isWall() && j !== 0 && block.isCeiling() && noLightColourDiff && block.getCeilingColour() === skipDrawCeilingColour && !ceilingHasBeenDrawnAsATexture) {
                            skipDrawCeilingCount += Math.abs(drawDist);
                        }
                        //end skipDraw
                        else {
                            //draw skipped lines
                            if (skipDrawCeiling) {
                                let ceilingStart = this.SCREEN_HEIGHT - skipDrawCeilingLine - skipDrawCeilingCount
                                let drawDist = skipDrawCeilingCount
                                skipDrawCeiling = false

                                this.context.fillStyle = Light.colourToRGBA(Light.applyLightColourToBlock(skipDrawCeilingColour, this.world.getLightColour(useful.mapX, useful.mapY)));
                                this.context.fillRect(drawHorizStart, ceilingStart, drawWidth, drawDist + 1);

                                skipDrawCeilingCount = 0;
                            }
                            if (block.isCeiling() && !ceilingHasBeenDrawnAsATexture) {
                                this.context.fillStyle = Light.colourToRGBA(Light.applyLightColourToBlock(block.getCeilingColour(), this.world.getLightColour(useful.mapX, useful.mapY)))
                                this.context.fillRect(drawHorizStart, this.SCREEN_HEIGHT - drawStart - drawDist, drawWidth, drawDist + 1);
                            }
                        }

                        previousBlock = useful
                    }
                }*!/
    }*/

}

export function toRadians(deg) {
    return (deg * Math.PI) / 180;
}


function fixFishEye(distance, angle, playerAngle) {
    let diff = angle - playerAngle;
    return distance * Math.cos(diff);
}

function getImage(imageName) {
    if (imageSet[imageName]) {
        return imageSet[imageName]
    } else {
        missingIMGSet.add(imageName)
        return imageSet[missingImgName]
    }
}

function loadImages() {
    let removeSet = new Set()
    missingIMGSet.forEach(image => {
        if (imageSet[image] && imageSet[image] !== imageSet[missingImgName]) {
            removeSet.add(image)
            return;
        }
        if (DEBUG_MODE) console.log("loading img: " + image)
        let loadIMG = new Image()
        loadIMG.src = IMAGE_PATH + image
        if (!loadIMG && DEBUG_MODE) {
            console.log("error loading image: " + image)
        }

        if (!loadIMG) {
            imageSet[image] = imageSet[missingImgName]
            removeSet.add(image)
        } else {
            imageSet[image] = loadIMG
            removeSet.add(image)
        }
    })

    removeSet.forEach(image => missingIMGSet.delete(image))
}

function initMissingIMG() {
    let loadIMG = new Image()
    loadIMG.src = IMAGE_PATH + missingImgName
    if (!loadIMG) console.log("error loading missing image placeholder")
    imageSet[missingImgName] = loadIMG
}

function pushToDrawArray(toDrawArray, toDraw, mapX, mapY, distance, horizontalSample, hSampleWidth, light, totalTransparency){
    toDrawArray.push({toDraw, mapX, mapY, distance,horizontalSample,hSampleWidth,light,totalTransparency})
}

function arraysEqual(a,b){
    if (a === b) return true;
    if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

export default view