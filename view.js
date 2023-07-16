let COLORS = {
    floor: "#376707", // "#ff6361"
    ceiling: "#7ccecc", // "#012975",
    wall: "#8a8a8f", // "#58508d"
    wallDark: "#66686c", // "#003f5c"
    rays: "#ffa600",
};
let FOV = toRadians(75);

let imageSet = new Set();
let missingIMGSet= new Set();
let missingImgName = "missing.png"
initMissingIMG()


class view {

    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;
    numberOfRays;
    canvas;
    context;

    player;
    world;
    map;

    constructor(player,Canvas = document.createElement("canvas")) {
        this.canvas = Canvas;
        this.canvas.setAttribute("width", this.SCREEN_WIDTH);
        this.canvas.setAttribute("height", this.SCREEN_HEIGHT);
        document.body.appendChild(this.canvas);
        this.context = this.canvas.getContext("2d");
        this.context.imageSmoothingEnabled = false;

        this.player = player;
        this.world = player.world;
        this.map = this.world.map;

        if(MAX_RAYS <= 0) this.numberOfRays = this.SCREEN_WIDTH
        else this.numberOfRays = MAX_RAYS


    }

    clearScreen() {
        this.context.fillStyle = COLORS.floor;
        this.context.fillRect(0, this.SCREEN_HEIGHT/2, this.SCREEN_WIDTH, this.SCREEN_HEIGHT/2);
        this.context.fillStyle = COLORS.ceiling;
        this.context.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT/2);
    }

    renderMinimap(rays) {
        let posX = 0, posY = 0;
        let screenPortion = 1/4 //portion of screen covered
        let scale = this.SCREEN_WIDTH/ (this.map.length * CELL_SIZE)  * screenPortion  //[px/m] meters to pixels
        let cellSize = scale * CELL_SIZE ; //[px] pixels each cell takes up
        this.map.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    this.context.drawImage(getImage(cell.imageName),posX + x * cellSize,posY + y * cellSize,cellSize,cellSize)
                }
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
                (player.x + Math.cos(ray.angle) * ray.distance) * scale,
                (player.y + Math.sin(ray.angle) * ray.distance) * scale
            );
            this.context.closePath();
            this.context.stroke();
        });
    }

    renderScene(rays) {
        this.drawSkybox(getImage(world.sky))

        //render rays
        rays.forEach((ray, i) => {
            if(!ray.block) return;
            let distance = fixFishEye(ray.distance, ray.angle, player.angle);//[m] dist to wall
            let wallHeight = ((CELL_SIZE * 5) / distance) * 277; //[px]height of wall
            let pixelWidth = this.SCREEN_WIDTH/ this.numberOfRays //[px]width of each ray in px
            let img = getImage(ray.block.imageName)

            //process image sampling
            let sampleImageHorizontal = Math.abs(Math.floor(ray.horizontalSample * img.width))
            let sampleImageHorizontalWidth = Math.abs(Math.floor(ray.hSampleWidth*img.width))
            sampleImageHorizontal = Math.floor(sampleImageHorizontal + sampleImageHorizontalWidth /2)
            if(sampleImageHorizontalWidth <=1 ) {
                sampleImageHorizontalWidth = 1
            }
            else if(sampleImageHorizontalWidth + sampleImageHorizontal > img.width) sampleImageHorizontal = img.width - sampleImageHorizontalWidth
            else if(sampleImageHorizontal <= 0) sampleImageHorizontal =0
            //

            this.context.drawImage(img,sampleImageHorizontal,
                0,sampleImageHorizontalWidth, img.height,
                i* pixelWidth, this.SCREEN_HEIGHT / 2 - wallHeight / 2, pixelWidth+1, wallHeight)

            if(DEBUG_MODE && pixelWidth > 5) {
                this.context.strokeStyle = 'red';
                this.context.strokeRect(i * pixelWidth, this.SCREEN_HEIGHT / 2 - wallHeight / 4, pixelWidth + 1, wallHeight/4);
            }
        });
    //    https://www.youtube.com/watch?v=8RDBa3dkl0g
    }

    castRay(angle) {
        let vCollision = this.getVCollision(angle);
        let hCollision = this.getHCollision(angle);

        return hCollision.distance >= vCollision.distance ? vCollision : hCollision; //ret shorter dist
    }

    getVCollision(angle) {
        let right = Math.abs(Math.floor((angle - Math.PI / 2) / Math.PI) % 2);

        let firstX = right
            ? Math.floor(player.x / CELL_SIZE) * CELL_SIZE + CELL_SIZE
            : Math.floor(player.x / CELL_SIZE) * CELL_SIZE;

        let firstY = player.y + (firstX - player.x) * Math.tan(angle);

        let xA = right ? CELL_SIZE : -CELL_SIZE;
        let yA = xA * Math.tan(angle);

        let wall;
        let nextX = firstX;
        let nextY = firstY;
        while (!wall) {
            let cellX = right
                ? Math.floor(nextX / CELL_SIZE)
                : Math.floor(nextX / CELL_SIZE) - 1;
            let cellY = Math.floor(nextY / CELL_SIZE);

            if (world.outOfMapBounds(cellX, cellY)) {
                return {
                    angle,
                    distance: distance(player.x, player.y,Infinity , Infinity),
                    vertical: true,
                }
            }
            wall = this.map[cellY][cellX];
            if (!wall) {
                nextX += xA;
                nextY += yA;
            } else {
            }
        }
        let Distance =distance(player.x, player.y, nextX, nextY)
        return {
            angle,
            distance: Distance,
            vertical: true,
            block : wall,
            horizontalSample : (right) ? Math.abs(nextY) - Math.abs(Math.floor(nextY)) : 1- (Math.abs(nextY) - Math.abs(Math.floor(nextY))), // up? checks for img rotation, need to rotate image when facing downwards
            hSampleWidth : this.calcImageSampleWidth(Distance, angle,Math.sin)
        };
    }

    getHCollision(angle) {
        let up = Math.abs(Math.floor(angle / Math.PI) % 2);
        let firstY = up
            ? Math.floor(player.y / CELL_SIZE) * CELL_SIZE
            : Math.floor(player.y / CELL_SIZE) * CELL_SIZE + CELL_SIZE;
        let firstX = player.x + (firstY - player.y) / Math.tan(angle);

        let yA = up ? -CELL_SIZE : CELL_SIZE;
        let xA = yA / Math.tan(angle);

        let wall;
        let nextX = firstX;
        let nextY = firstY;
        while (!wall) {
            let cellX = Math.floor(nextX / CELL_SIZE);
            let cellY = up
                ? Math.floor(nextY / CELL_SIZE) - 1
                : Math.floor(nextY / CELL_SIZE);

            if (world.outOfMapBounds(cellX, cellY)) {
                return {
                    angle,
                    distance: distance(player.x, player.y,Infinity , Infinity),
                    vertical: true,
                }
            }

            wall = (this.map)[cellY][cellX];
            if (!wall) {
                nextX += xA;
                nextY += yA;
            }
        }
        let Distance =distance(player.x, player.y, nextX, nextY)
        return {
            angle,
            distance: Distance,
            vertical: false,
            block : wall,
            horizontalSample : (up) ? Math.abs(nextX) - Math.abs(Math.floor(nextX)) : 1- (Math.abs(nextX) - Math.abs(Math.floor(nextX))), // up? checks for img rotation, need to rotate image when facing downwards
            hSampleWidth : this.calcImageSampleWidth(Distance, angle,Math.cos)
        };
    }

    redraw(){
        loadImages()
        let rays = this.getRays()
        this.clearScreen()
        this.renderScene(rays)
        this.renderMinimap( rays);
    }

    getRays() {
        let initialAngle = player.angle - FOV / 2;
        let angleStep = FOV / this.numberOfRays;
        return Array.from({ length: this.numberOfRays }, (_, i) => {
            let angle = initialAngle + i * angleStep;
            return this.castRay(angle);
        });
    }

    calcImageSampleWidth(distance, angle, func) {
        let angleStep = FOV / this.numberOfRays

        return Math.abs(distance/CELL_SIZE * (func(angle) - func(angle + angleStep)))

    }

    drawSkybox(img){
        let rotation = player.angle / (2* Math.PI) - Math.floor(player.angle / (2* Math.PI)) //btw 0 and 1

        let sXStart = rotation * img.width //[px]
        let sXWidth = FOV / (2 * Math.PI) * img.width          //[px]
        this.context.drawImage(img,sXStart,0,sXWidth,img.height,0,0,this.SCREEN_WIDTH, this.SCREEN_HEIGHT)

        //reached right end of image
        if(sXStart + sXWidth > img.width){
            let sXWDrawn = (img.width - sXStart)
            let sXWRemain = sXWidth - sXWDrawn

            let scale = this.SCREEN_WIDTH/sXWidth
            let ScreenPosX= scale * sXWDrawn
            let ScreenRemainingX = scale * sXWRemain

            this.context.drawImage(img,0,0,sXWRemain,img.height,ScreenPosX,0,ScreenRemainingX, this.SCREEN_HEIGHT)
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

function getImage(imageName){
    if(imageSet[imageName]){
        return imageSet[imageName]
    }
    else {
        missingIMGSet.add(imageName)
        return imageSet[missingImgName]
    }
}

function loadImages(){
    let removeSet = new Set()
    missingIMGSet.forEach(image =>{
        if(imageSet[image] && imageSet[image] !== imageSet[missingImgName]){
            removeSet.add(image)
            return;
        }
        if(DEBUG_MODE) console.log("loading img: " + image)
        let loadIMG = new Image()
        loadIMG.src = IMAGE_PATH+image
        if(!loadIMG && DEBUG_MODE){
            console.log("error loading image: " + image)
        }

        if(!loadIMG){
            imageSet[image] = imageSet[missingImgName]
            removeSet.add(image)
        }
        else {
            imageSet[image] = loadIMG
            removeSet.add(image)
        }
    })

    removeSet.forEach(image => missingIMGSet.delete(image))
}

function initMissingIMG(){
    let loadIMG = new Image()
    loadIMG.src = IMAGE_PATH+missingImgName
    if(!loadIMG) console.log("error loading missing image placeholder")
    imageSet[missingImgName] = loadIMG
}

function isImageOk(img) {
    //https://stackoverflow.com/questions/1977871/check-if-an-image-is-loaded-no-errors-with-jquery
    // During the onload event, IE correctly identifies any images that
    // weren’t downloaded as not complete. Others should too. Gecko-based
    // browsers act like NS4 in that they report this incorrectly.
    if (!img.complete) {
        return false;
    }

    // However, they do have two very useful properties: naturalWidth and
    // naturalHeight. These give the true size of the image. If it failed
    // to load, either of these should be zero.
    if (img.naturalWidth === 0) {
        return false;
    }

    // No other way of checking: assume it’s ok.
    return true;
}