"use strict"
import {CELL_SIZE, DEBUG_MODE, IMAGE_PATH, MAX_RAY_DEPTH, MAX_RAYS, MINIMAP} from "./config.js";
import {ABYSS} from "./block.js";
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


                if(cell.floor){
                    this.context.fillStyle =Light.colourToRGBA( Light.applyLightColourToBlock(cell.floorColour,this.world.getLightColour(x,y)))
                    this.context.fillRect(posX + x * cellSize, posY + y * cellSize, cellSize, cellSize);
                }
                else if(cell.wall)
                    this.context.drawImage(getImage(cell.imageName), posX + x * cellSize, posY + y * cellSize, cellSize, cellSize)
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
                (this.player.x + Math.cos(ray.angle) * ray.blocks[ray.blocks.length -1].distance) * scale,
                (this.player.y + Math.sin(ray.angle) * ray.blocks[ray.blocks.length -1].distance) * scale
            );
            this.context.closePath();
            this.context.stroke();
        });
    }

    renderScene(rays) {
        this.drawSkybox(getImage(this.world.sky))
        const pixelWidth = this.SCREEN_WIDTH / this.numberOfRays //[px]width of each ray in px
        //render rays
        rays.forEach((ray, i) => {
            //floor drawing variables
            let skipDrawFloorLine = this.SCREEN_HEIGHT/2
            let skipDrawFloor = false
            let skipDrawFloorCount =0
            let skipDrawFloorColour = null
            //ceiling drawing variables
            let skipDrawCeilingLine = 0
            let skipDrawCeiling = false
            let skipDrawCeilingCount =0
            let skipDrawCeilingColour = null

            let previousBlock = ray.blocks[ray.blocks.length - 1]
            for (let j = ray.blocks.length - 1; j >= 0; j--) {
                const useful = ray.blocks[j]
                const block = useful.block
                //ignore out of bounds or invisible blocks
                if (block.invisible || block === ABYSS) continue
                if(block.sprite) {
                    this.drawSprite(ray, i, useful)
                    continue
                }
                //draw floors and ceilings, and lack thereof (as
                //FIXME debug entry condition to this branch, may just need to be true
                if ((block.floor || block.ceiling ) || (!block.wall && !block.floor && !block.ceiling) || block.transparent) {
                    //fix overdrawing ray bounds
                    let drawHorizStart = Math.floor(i *pixelWidth)
                    let nextDrawHorizStart = Math.floor((i+1) *pixelWidth)
                    let drawWidth = Math.floor(nextDrawHorizStart - drawHorizStart)

                    let distWall = fixFishEye(useful.distance, ray.angle, this.player.angle)
                    let wallHeight = CELL_SIZE * this.SCREEN_HEIGHT / distWall //[px]height of wall
                    // calc floor/ceiling screen height based on wall height
                    let drawStart =(this.SCREEN_HEIGHT / 2 + CELL_SIZE *this.SCREEN_HEIGHT /fixFishEye(previousBlock.distance, ray.angle, this.player.angle)/2)
                    if(! skipDrawFloor && drawStart > this.SCREEN_HEIGHT) return

                    let drawEnd = this.SCREEN_HEIGHT / 2 + wallHeight/2
                    if(drawEnd > this.SCREEN_HEIGHT) drawEnd = this.SCREEN_HEIGHT

                    const drawDist = drawEnd - drawStart

                    //get the next block
                    let nextBlockFloorColour = null
                    let nextBlockCeilingColour = null
                    let nextBlockLightColour = null
                    for(let k = j-1; k >=0; k-- ){
                        if(ray.blocks[k].block.block === true){
                            nextBlockFloorColour = ray.blocks[k].block.floorColour
                            nextBlockCeilingColour = ray.blocks[k].block.ceilingColour
                            nextBlockLightColour = this.world.getLightColour(ray.blocks[k].mapX,ray.blocks[k].mapY)
                            break
                        }
                    }
                    //check that current light level and next one are equal
                    let noLightColourDiff = arraysEqual(this.world.getLightColour(useful.mapX,useful.mapY) , nextBlockLightColour)

                    //DRAW THE FLOOR BLOCK
                    //draw debug grid
                    if (DEBUG_MODE) {
                        //DRAW THE FLOOR BLOCK
                        //activate skip draw, don't skip when j == 0, or when the next block is not a floor, so we don't get missed draws
                        if(!skipDrawFloor && !block.wall && noLightColourDiff && block.floor && block.floorColour === nextBlockFloorColour && j!==0){
                            skipDrawFloorLine =drawStart
                            skipDrawFloor = true
                            skipDrawFloorCount += drawDist;
                            skipDrawFloorColour = block.floorColour

                        }
                        //continueSkipDraw, stop when j == 0, or when the next block is not a floor, so we don't get missed draws
                        //stop when current block is a wall (eg glass) so we dont overdraw the block
                        else if(skipDrawFloor && !block.wall && noLightColourDiff && j!==0 && block.floor && block.floorColour === skipDrawFloorColour){
                            skipDrawFloorCount += drawDist;
                        }
                        //end skipDraw
                        else {
                            //draw skipped lines
                            if(skipDrawFloor){
                                skipDrawFloor = false
                                    this.context.strokeStyle = 'blue';
                                    this.context.strokeRect(drawHorizStart, skipDrawFloorLine, drawWidth,  drawStart - skipDrawFloorLine+1);
                                skipDrawFloorCount =0;
                            }
                            //draw tile
                            if (block.floor) {
                                this.context.strokeStyle = 'yellow';
                                this.context.strokeRect(drawHorizStart, drawStart, drawWidth, drawDist + 1);
                            }


                        }
                    }
                    //otherwise, draw floor regularly
                    else {
                        //activate skip draw, dont skip when j == 0, or when the next block is not a floor, so we don't get missed draws
                        if (!skipDrawFloor && !block.wall && noLightColourDiff && block.floor && block.floorColour === nextBlockFloorColour && j!==0) {
                            skipDrawFloorLine = drawStart
                            skipDrawFloor = true
                            skipDrawFloorCount += drawDist;
                            skipDrawFloorColour = block.floorColour

                        }
                        //continueSkipDraw, stop when j == 0, or when the next block is not a floor, so we don't get missed draws
                            //stop when current block is a wall (eg glass) so we dont overdraw the block
                        else if (skipDrawFloor && !block.wall && noLightColourDiff && j!==0 && block.floor && block.floorColour === skipDrawFloorColour) {
                            skipDrawFloorCount += drawDist;
                        }
                        //end skipDraw
                        else {
                            //draw skipped lines
                            if (skipDrawFloor) {
                                skipDrawFloor = false
                                    this.context.fillStyle = Light.colourToRGBA( Light.applyLightColourToBlock(skipDrawFloorColour,this.world.getLightColour(useful.mapX,useful.mapY)));
                                    this.context.fillRect(drawHorizStart, skipDrawFloorLine, drawWidth, drawStart - skipDrawFloorLine + 1);
                                skipDrawFloorCount = 0;
                            }
                            //draw large tile
                            if (block.floor) {
                                this.context.fillStyle = Light.colourToRGBA(Light.applyLightColourToBlock(block.floorColour,this.world.getLightColour(useful.mapX,useful.mapY)));
                                this.context.fillRect(drawHorizStart, drawStart, drawWidth, drawDist + 1);
                            }
                        }
                    }




                    //DRAW THE CEILING BLOCK
                    //activate skip draw, dont skip when j == 0, so we don't get missed draws
                    if(!skipDrawCeiling && !block.wall && block.ceiling && noLightColourDiff && block.ceilingColour ===nextBlockCeilingColour && j!==0 ){
                        skipDrawCeilingLine = drawStart
                        skipDrawCeiling = true
                        skipDrawCeilingCount += Math.abs(drawDist);
                        skipDrawCeilingColour = block.ceilingColour

                    }
                    //continueSkipDraw, stop when j == 0, so we don't get missed draws
                    //stop when current block is a wall (eg glass) so we dont overdraw the block
                    else if(skipDrawCeiling && !block.wall && j!==0 && block.ceiling && noLightColourDiff && block.ceilingColour === skipDrawCeilingColour ){
                        skipDrawCeilingCount += Math.abs(drawDist);
                    }
                    //end skipDraw
                    else {
                        //draw skipped lines
                        if(skipDrawCeiling){
                            let ceilingStart = this.SCREEN_HEIGHT - skipDrawCeilingLine -skipDrawCeilingCount
                            let drawDist = skipDrawCeilingCount
                            skipDrawCeiling = false

                            this.context.fillStyle = Light.colourToRGBA(Light.applyLightColourToBlock(skipDrawCeilingColour,this.world.getLightColour(useful.mapX,useful.mapY)));
                            this.context.fillRect(drawHorizStart, ceilingStart, drawWidth,  drawDist+1);

                            skipDrawCeilingCount =0;
                        }
                        if(block.ceiling) {
                            this.context.fillStyle = Light.colourToRGBA(Light.applyLightColourToBlock(block.ceilingColour,this.world.getLightColour(useful.mapX,useful.mapY)))
                            this.context.fillRect(drawHorizStart, this.SCREEN_HEIGHT - drawStart - drawDist, drawWidth, drawDist + 1);
                        }
                    }

                    previousBlock = useful
                }
                if(block.wall)
                    this.drawWall(ray, i, useful)

                previousBlock = useful
            }

        });
        //    https://www.youtube.com/watch?v=8RDBa3dkl0g
    }

    drawWall(ray, i, useful) {
        let block = useful.block
        let perpDistance = fixFishEye(useful.distance, ray.angle, this.player.angle);//[m] dist to wall
        let wallHeight = CELL_SIZE * this.SCREEN_HEIGHT / perpDistance //[px]height of wall
        let pixelWidth = this.SCREEN_WIDTH / this.numberOfRays //[px]width of each ray in px
        let img = getImage(block.imageName)

        //process image sampling
        let sampleImageHorizontal = Math.abs(Math.floor(useful.horizontalSample * img.width))
        let sampleImageHorizontalWidth = Math.abs(Math.floor(useful.hSampleWidth * img.width))

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
        if(useful.light) {
            this.context.fillStyle = 'rgba('+useful.light[0]+','+useful.light[1]+','+useful.light[2]+','+useful.light[3]+')';
            this.context.fillRect(drawStart, this.SCREEN_HEIGHT / 2 - wallHeight / 2-1, drawWidth , wallHeight+2)
        }


        if (DEBUG_MODE && pixelWidth > 5) {
            this.context.strokeStyle = 'red';
            this.context.strokeRect(drawStart, this.SCREEN_HEIGHT / 2 - wallHeight / 2-1, drawWidth, wallHeight+2)
        }
    }

    drawSprite(ray, i, useful){
        let sprite = useful.block
        let perpDistance = useful.distance//[m] ignore perpendicular distance for sprites
        let wallHeight = CELL_SIZE * this.SCREEN_HEIGHT / perpDistance //[px]height of wall
        let spriteHeight = this.SCREEN_HEIGHT / perpDistance * sprite.height //[px]height of wall
        let pixelWidth = this.SCREEN_WIDTH / this.numberOfRays //[px]width of each ray in px
        let img = getImage(sprite.imageName)

        //process image sampling
        let sampleImageHorizontal = (Math.floor(useful.horizontalSample * img.width))
        //FIXME may cause issues with images being cut off on the sides with a small number of rays
        if(sampleImageHorizontal > img.width || sampleImageHorizontal < 0) return
        let sampleImageHorizontalWidth = Math.abs(Math.floor(useful.hSampleWidth * img.width))
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
        return this.getCollision(angle,prevAngle); //finds ray collisions with blocks
    }

    getCollision(angle,prevAngle) {
        let right = Boolean(Math.abs(Math.floor((angle - Math.PI / 2) / Math.PI) % 2)); //facing right
        let up = !Math.abs(Math.floor(angle / Math.PI) % 2); //facing up

        const deltaDistX = Math.abs(CELL_SIZE / Math.cos(angle)); //Increase in ray dist after every move 1 cell x wards
        const deltaDistY = Math.abs(CELL_SIZE / Math.sin(angle)); //Increase in ray dist after every move 1 cell y wards

        let sideDistX = (right) ? CELL_SIZE * (Math.floor(this.player.x / CELL_SIZE) + 1 - this.player.x / CELL_SIZE) / Math.cos(angle) : CELL_SIZE * (Math.floor(this.player.x / CELL_SIZE) - this.player.x / CELL_SIZE) / Math.cos(angle)//distance to the next vertical wall
        sideDistX = Math.abs(sideDistX)
        let sideDistY = (up) ? CELL_SIZE * (Math.floor(this.player.y/ CELL_SIZE) + 1 - this.player.y/ CELL_SIZE) / Math.sin(angle) :CELL_SIZE * (Math.floor(this.player.y/CELL_SIZE) - this.player.y/CELL_SIZE) / Math.sin(angle)   //distance to the next horizontal wall
        sideDistY = Math.abs(sideDistY)
        let mapX = Math.floor(this.player.x / CELL_SIZE) //grid cell player is in x coord
        let mapY = Math.floor(this.player.y / CELL_SIZE) //grid cell player is in y coord

        //step forward rays

        let distance = 0;
        let count = 0
        let blocks = [] //set of all the blocks visited by the ray
        pushBlocks(blocks,this.map[mapY][mapX], mapX, mapY, distance,0,0,this.world.getLightColour(mapX,mapY)) //can ignore sampling value on block you are standing in, assuming its not a wall
        while (count <= MAX_RAY_DEPTH) {
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
                let block = ABYSS
                blocks.push({block, distance})
                return {
                    angle,
                    blocks: blocks
                };
            }

            //not out of bounds so add sprite to array if it exists
            if(this.world.getEntities(mapX,mapY) && this.world.getEntities(mapX,mapY).length > 0 ){
                this.world.getEntities(mapX,mapY).forEach((entity) =>{
                    if(entity.sprite) {
                        const sample = this.calculateSpriteSample(entity, angle)
                        const sampleWidth = this.calculateSpriteSampleWidth(entity, angle, prevAngle)
                        if(sample && sampleWidth)
                            pushBlocks(blocks, entity, mapX, mapY, this.distance(this.player.x, this.player.y, entity.x, entity.y),
                                sample, sampleWidth,this.world.getLightColour(mapX, mapY))
                    }
                })
            }

            //Not out of bounds so add current block to array (ignore invisible blocks
            if (!this.map[mapY][mapX].invisible) {
                let horizontalSample = 0;
                let hSampleWidth  = 0;
                let light = this.world.getLightColour(mapX,mapY)
                //only bother to sample textures for walls
                if(this.map[mapY][mapX].wall){
                    horizontalSample = (vertical) ? this.calcSample(vertical, distance, angle, mapY,right,up) : this.calcSample(vertical, distance, angle, mapX,right,up);

                    const addAHwall = ((vertical && !right)) ? 1 : 0
                    const addAVwall = (!vertical && !up) ? 1 : 0


                    let angleStep = FOV / this.numberOfRays
                    let nextDistance = (vertical) ? (( CELL_SIZE *  (mapX + addAHwall) - this.player.x) / Math.cos(angle + angleStep))  : (CELL_SIZE *  (mapY+addAVwall) - this.player.y) / Math.cos(angle + angleStep- Math.PI / 2)
                    let NextHorizontalSample = (vertical) ? this.calcSample(vertical, nextDistance, angle+ angleStep, mapY,right,up) : this.calcSample(vertical, nextDistance, angle+ angleStep, mapX,right,up);
                    hSampleWidth = NextHorizontalSample - horizontalSample;

                    //light level illuminating this non-transparent block is from previous one
                    if(!this.map[mapY][mapX].transparent)
                        light = blocks[blocks.length -1].light

                }
                pushBlocks(blocks,this.map[mapY][mapX], mapX, mapY, distance,horizontalSample,hSampleWidth, light)
            }

            //Check if ray has hit a wall, end raycast.
            if (!this.map[mapY][mapX].transparent) {
                return {
                    angle,
                    blocks: blocks
                };
            }
        }
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
        let sXWidth = FOV / (2 * Math.PI) * img.width          //[px]
        this.context.drawImage(img, sXStart, 0, sXWidth, img.height, 0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT)

        //reached right end of image
        if (sXStart + sXWidth > img.width) {
            let sXWDrawn = (img.width - sXStart)
            let sXWRemain = sXWidth - sXWDrawn

            let scale = this.SCREEN_WIDTH / sXWidth
            let ScreenPosX = scale * sXWDrawn
            let ScreenRemainingX = scale * sXWRemain

            this.context.drawImage(img, 0, 0, sXWRemain, img.height, ScreenPosX, 0, ScreenRemainingX, this.SCREEN_HEIGHT)
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

function pushBlocks(blocks,block, mapX, mapY, distance,horizontalSample,hSampleWidth,light){
    blocks.push({block, mapX, mapY, distance,horizontalSample,hSampleWidth,light})
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