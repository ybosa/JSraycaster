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

    clearScreen() {
        this.context.fillStyle = COLORS.floor;
        this.context.fillRect(0, this.SCREEN_HEIGHT / 2, this.SCREEN_WIDTH, this.SCREEN_HEIGHT / 2);
        this.context.fillStyle = COLORS.ceiling;
        this.context.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT / 2);
    }

    renderMinimap(rays) {
        let posX = 0, posY = 0;
        let screenPortion = 1 / 4 //portion of screen covered
        let scale = this.SCREEN_WIDTH / (this.map.length * CELL_SIZE) * screenPortion  //[px/m] meters to pixels
        let cellSize = scale * CELL_SIZE; //[px] pixels each cell takes up
        this.map.forEach((row, y) => {
            row.forEach((cell, x) => {
                if(!cell) return


                if(cell.floor){
                    this.context.fillStyle = cell.floorColour;
                    this.context.fillRect(posX + x * cellSize, posY + y * cellSize, cellSize, cellSize);
                }
                else if(cell.wall)
                    this.context.drawImage(getImage(cell.imageName), posX + x * cellSize, posY + y * cellSize, cellSize, cellSize)
            });
        });
        this.context.fillStyle = "blue";
        this.context.fillRect(
            posX + player.x * scale - 10 / 2,
            posY + player.y * scale - 10 / 2,
            10,
            10
        );

        this.context.strokeStyle = "blue";
        this.context.beginPath();
        this.context.moveTo(player.x * scale, player.y * scale);
        this.context.lineTo(
            (player.x + Math.cos(player.angle) * 20) * scale,
            (player.y + Math.sin(player.angle) * 20) * scale
        );
        this.context.closePath();
        this.context.stroke();

        this.context.strokeStyle = COLORS.rays;
        rays.forEach((ray) => {
            this.context.beginPath();
            this.context.moveTo(player.x * scale, player.y * scale);
            this.context.lineTo(
                (player.x + Math.cos(ray.angle) * ray.blocks[ray.blocks.length -1].distance) * scale,
                (player.y + Math.sin(ray.angle) * ray.blocks[ray.blocks.length -1].distance) * scale
            );
            this.context.closePath();
            this.context.stroke();
        });
    }

    renderScene(rays) {
        this.drawSkybox(getImage(world.sky))
        const pixelWidth = this.SCREEN_WIDTH / this.numberOfRays //[px]width of each ray in px
        //render rays
        rays.forEach((ray, i) => {
            //floor drawing variables
            let skipDrawFloorLine = this.SCREEN_HEIGHT/2
            let skipDrawFloor = false
            let skipDrawFloorCount =0
            let skipDrawFloorColour = 'red'
            let skipDrawFloorType = false //currently drawing a ceiling or empty gap
            //ceiling drawing variables
            let skipDrawCeilingLine = 0
            let skipDrawCeiling = false
            let skipDrawCeilingCount =0
            let skipDrawCeilingColour = 'red'
            let skipDrawCeilingType = false //currently, drawing a ceiling or empty gap

            let previousBlock = ray.blocks[ray.blocks.length - 1]
            for (let j = ray.blocks.length - 1; j >= 0; j--) {
                const useful = ray.blocks[j]
                const block = useful.block
                //ignore out of bounds or invisible blocks
                if (block.invisible || block === ABYSS) continue
                //draw floors and ceilings, and lack thereof (as
                if ((block.floor || block.ceiling ) || (!block.wall && !block.floor && !block.ceiling)) {
                    let distWall = fixFishEye(useful.distance, ray.angle, player.angle)
                    let wallHeight = CELL_SIZE * this.SCREEN_HEIGHT / distWall //[px]height of wall
                    // calc floor/ceiling screen height based on wall height
                    let drawStart =(this.SCREEN_HEIGHT / 2 + CELL_SIZE *this.SCREEN_HEIGHT /fixFishEye(previousBlock.distance, ray.angle, player.angle)/2)
                    if(! skipDrawFloor && drawStart > this.SCREEN_HEIGHT) return

                    let drawEnd = this.SCREEN_HEIGHT / 2 + wallHeight/2
                    if(drawEnd > this.SCREEN_HEIGHT) drawEnd = this.SCREEN_HEIGHT

                    const drawDist = drawEnd - drawStart


                    //DRAW THE FLOOR BLOCK
                    //activate skip draw, dont skip when j == 0, or when the next block is not a floor, so we don't get missed draws
                    if(!skipDrawFloor && block.floor && j!==0 && drawDist < FLOOR_SKIP_DRAW_THRESHOLD){
                        skipDrawFloorLine =drawStart
                        skipDrawFloor = true
                        skipDrawFloorCount += drawDist;
                        skipDrawFloorColour = block.floorColour
                        skipDrawFloorType = block.floor

                    }
                    //continueSkipDraw, stop when j == 0, or when the next block is not a floor, so we don't get missed draws
                    else if(skipDrawFloor && j!==0 && block.floor === skipDrawFloorType  && drawDist < FLOOR_SKIP_DRAW_THRESHOLD && skipDrawFloorCount < FLOOR_SKIP_DRAW_MAX_DIST){
                        skipDrawFloorCount += drawDist;
                    }
                    //end skipDraw
                    else {
                        //draw skipped lines
                        if(skipDrawFloor){
                            skipDrawFloor = false
                            if(skipDrawFloorType){
                                this.context.fillStyle = skipDrawFloorColour;
                                this.context.fillRect(i * pixelWidth, skipDrawFloorLine, pixelWidth+1,  drawStart - skipDrawFloorLine+1);
                            }
                            skipDrawFloorCount =0;
                        }
                        //draw large tile
                        if(block.floor) {
                            this.context.fillStyle = block.floorColour;
                            this.context.fillRect(i * pixelWidth, drawStart, pixelWidth + 1, drawDist + 1);
                        }
                    }

                    //DRAW THE CEILING BLOCK
                    //activate skip draw, dont skip when j == 0, so we don't get missed draws
                    if(!skipDrawCeiling && block.ceiling && j!==0  && drawDist < FLOOR_SKIP_DRAW_THRESHOLD){
                        skipDrawCeilingLine = this.SCREEN_HEIGHT - drawStart -drawDist
                        skipDrawCeiling = true
                        skipDrawCeilingCount += drawDist;
                        skipDrawCeilingColour = block.ceilingColour
                        skipDrawCeilingType = block.ceiling

                    }
                    //continueSkipDraw, stop when j == 0, so we don't get missed draws
                    else if(skipDrawCeiling && j!==0 && block.ceiling === skipDrawCeilingType  && drawDist < FLOOR_SKIP_DRAW_THRESHOLD && skipDrawCeilingCount < FLOOR_SKIP_DRAW_MAX_DIST){
                        skipDrawCeilingCount += drawDist;
                    }
                    //end skipDraw
                    else {
                        //draw skipped lines
                        if(skipDrawCeiling){
                            skipDrawCeiling = false
                            if(skipDrawCeilingType){
                                this.context.fillStyle = skipDrawCeilingColour;
                                this.context.fillRect(i * pixelWidth, skipDrawCeilingLine, pixelWidth+1,skipDrawCeilingCount +1  );
                            }

                            skipDrawCeilingCount =0;
                        }
                        if(block.ceiling) {
                            this.context.fillStyle = block.ceilingColour;
                            this.context.fillRect(i * pixelWidth, this.SCREEN_HEIGHT - drawStart - drawDist, pixelWidth + 1, drawDist + 1);
                        }
                    }

                    //draw from top of tile to bottom of tile
                    if (DEBUG_MODE) {
                        //activate skip draw, dont skip when j == 0, so we don't get missed draws
                        if(!skipDrawFloor && j!==0 && drawDist < FLOOR_SKIP_DRAW_THRESHOLD){
                            skipDrawFloorLine =drawStart
                            skipDrawFloor = true
                            this.context.strokeStyle = 'red';
                            skipDrawFloorCount += drawDist;
                            // this.context.strokeRect(i * pixelWidth, drawStart, pixelWidth+1, drawEnd - drawStart);
                        }
                        //continueSkipDraw, stop when j == 0, so we don't get missed draws
                        else if(skipDrawFloor && j!==0  && drawDist < FLOOR_SKIP_DRAW_THRESHOLD && skipDrawFloorCount < FLOOR_SKIP_DRAW_MAX_DIST){
                            this.context.strokeStyle = 'blue';
                            skipDrawFloorCount += drawDist;
                        }
                        //end skipDraw
                        else {
                            //draw skipped lines
                            if(skipDrawFloor){
                                skipDrawFloor = false
                                this.context.strokeRect(i * pixelWidth, skipDrawFloorLine, pixelWidth+1,  drawStart - skipDrawFloorLine+1);
                                skipDrawFloorCount =0;
                            }
                            //draw large tile
                            this.context.strokeStyle = 'yellow';
                            this.context.strokeRect(i * pixelWidth, drawStart, pixelWidth+1, drawDist+1);
                        }
                    }
                    previousBlock = useful
                }
                if(block.wall)
                    this.drawWall(ray, i, useful)
            }

        });
        //    https://www.youtube.com/watch?v=8RDBa3dkl0g
    }

    drawWall(ray, i, useful) {
        let block = useful.block
        let perpDistance = fixFishEye(useful.distance, ray.angle, player.angle);//[m] dist to wall
        let wallHeight = CELL_SIZE * this.SCREEN_HEIGHT / perpDistance //[px]height of wall
        let pixelWidth = this.SCREEN_WIDTH / this.numberOfRays //[px]width of each ray in px
        let img = getImage(block.imageName)

        //process image sampling
        let sampleImageHorizontal = Math.abs(Math.floor(useful.horizontalSample * img.width))
        let sampleImageHorizontalWidth = Math.abs(Math.floor(useful.hSampleWidth * img.width))
        sampleImageHorizontal = Math.floor(sampleImageHorizontal + sampleImageHorizontalWidth / 2)
        if (sampleImageHorizontalWidth <= 1) {
            sampleImageHorizontalWidth = 1
        } else if (sampleImageHorizontalWidth + sampleImageHorizontal > img.width) sampleImageHorizontal = img.width - sampleImageHorizontalWidth
        else if (sampleImageHorizontal <= 0) sampleImageHorizontal = 0
        //

        this.context.drawImage(img, sampleImageHorizontal,
            0, sampleImageHorizontalWidth, img.height,
            Math.floor(i * pixelWidth), this.SCREEN_HEIGHT / 2 - wallHeight / 2-1, Math.floor(pixelWidth) + 1, wallHeight+2)

        if (DEBUG_MODE && pixelWidth > 5) {
            this.context.strokeStyle = 'red';
            this.context.strokeRect(i * pixelWidth, this.SCREEN_HEIGHT / 2 - wallHeight / 2, pixelWidth, wallHeight);
        }
    }

    castRay(angle) {
        return this.getCollision(angle); //finds ray collisions with blocks
        // let vCollision = this.getVCollision(angle);
        // let hCollision = this.getHCollision(angle);
        //
        // return hCollision.distance >= vCollision.distance ? vCollision : hCollision; //ret shorter dist
    }

    getCollision(angle) {
        let right = Math.abs(Math.floor((angle - Math.PI / 2) / Math.PI) % 2); //facing right
        let up = !Math.abs(Math.floor(angle / Math.PI) % 2); //facing up

        const deltaDistX = Math.abs(CELL_SIZE / Math.cos(angle)); //Increase in ray dist after every move 1 cell x wards
        const deltaDistY = Math.abs(CELL_SIZE / Math.sin(angle)); //Increase in ray dist after every move 1 cell y wards

        let sideDistX = (right) ? CELL_SIZE * (Math.floor(player.x / CELL_SIZE) + 1 - player.x / CELL_SIZE) / Math.cos(angle) : CELL_SIZE * (Math.floor(player.x / CELL_SIZE) - player.x / CELL_SIZE) / Math.cos(angle)//distance to the next vertical wall
        sideDistX = Math.abs(sideDistX)
        let sideDistY = (up) ? CELL_SIZE * (Math.floor(player.y/ CELL_SIZE) + 1 - player.y/ CELL_SIZE) / Math.sin(angle) :CELL_SIZE * (Math.floor(player.y/CELL_SIZE) - player.y/CELL_SIZE) / Math.sin(angle)   //distance to the next horizontal wall
        sideDistY = Math.abs(sideDistY)
        let mapX = Math.floor(player.x / CELL_SIZE) //grid cell player is in x coord
        let mapY = Math.floor(player.y / CELL_SIZE) //grid cell player is in y coord

        //step forward rays

        let distance = 0;
        let count = 0
        let blocks = [] //set of all the blocks visited by the ray

        pushBlocks(blocks,this.map[mapY][mapX], mapX, mapY, distance,0,0) //can ignore sampling value on block you are standing in, assuming its not a wall
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
            if (world.outOfMapBounds(mapX, mapY)) {
                let block = ABYSS
                blocks.push({block, distance})
                return {
                    angle,
                    blocks: blocks
                };
            }
            //Not out of bounds so add current block to array (ignore invisible blocks
            if (!this.map[mapY][mapX].invisible) {
                let horizontalSample = 0;
                let hSampleWidth  = 0;
                //only bother to sample textures walls
                if(this.map[mapY][mapX].wall){
                    horizontalSample = (vertical) ? this.calcSample(vertical, distance, angle, mapY,right,up) : this.calcSample(vertical, distance, angle, mapX,right,up);
                    hSampleWidth = this.calcImageSampleWidth(distance, angle, Math.cos);
                }

                pushBlocks(blocks,this.map[mapY][mapX], mapX, mapY, distance,horizontalSample,hSampleWidth)
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
        const sample = (vertical) ? (distance * Math.sin(angle) + player.y) / CELL_SIZE - mapQ : (distance * Math.cos(angle) + player.x) / CELL_SIZE - mapQ

        return (inv) ? 1- sample : sample
    }

    redraw() {
        loadImages()
        let rays = this.getRays()
        this.clearScreen()
        this.renderScene(rays)
        this.renderMinimap(rays);
    }

    getRays() {
        let initialAngle = player.angle
        // let angleStep = FOV / this.numberOfRays;
        return Array.from({length: this.numberOfRays}, (_, i) => {
            let angle = initialAngle + Math.atan((i - this.numberOfRays/2 )*this.distanceBetweenRaysOnScreen  )
            return this.castRay(angle);
        });
    }

    calcImageSampleWidth(distance, angle, func) {
        let angleStep = FOV / this.numberOfRays

        return Math.abs(distance / CELL_SIZE * (func(angle) - func(angle + angleStep)))

    }

    drawSkybox(img) {
        let rotation = player.angle / (2 * Math.PI) - Math.floor(player.angle / (2 * Math.PI)) //btw 0 and 1

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
}

function toRadians(deg) {
    return (deg * Math.PI) / 180;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
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

function pushBlocks(blocks,block, mapX, mapY, distance,horizontalSample,hSampleWidth){
    blocks.push({block, mapX, mapY, distance,horizontalSample,hSampleWidth})
}