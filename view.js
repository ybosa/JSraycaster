let COLORS = {
    floor: "#376707", // "#ff6361"
    ceiling: "#7ccecc", // "#012975",
    wall: "#8a8a8f", // "#58508d"
    wallDark: "#66686c", // "#003f5c"
    rays: "#ffa600",
};
let FOV = toRadians(75);

let imageSet = new Set();
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
                    this.context.drawImage(getImage(cell),posX + x * cellSize,posY + y * cellSize,cellSize,cellSize)
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
        rays.forEach((ray, i) => {
            if(!ray.block) return;
            let distance = fixFishEye(ray.distance, ray.angle, player.angle);
            let wallHeight = ((CELL_SIZE * 5) / distance) * 277;
            let width = this.SCREEN_WIDTH/ this.numberOfRays
            // this.context.fillStyle = ray.vertical ? COLORS.wallDark : COLORS.wall;
            // this.context.fillRect(i, this.SCREEN_HEIGHT / 2 - wallHeight / 2, 1, wallHeight);
            let img = getImage(ray.block)
            let sampleImageHorizontal = Math.floor(ray.horizontalSample * img.width)
            this.context.drawImage(img,sampleImageHorizontal,
                0,1, img.height,
                i* width, this.SCREEN_HEIGHT / 2 - wallHeight / 2, width+1, wallHeight)
        });
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
        return {
            angle,
            distance: distance(player.x, player.y, nextX, nextY),
            vertical: true,
            block : wall,
            horizontalSample : Math.abs(nextY) - Math.floor(nextY),
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
        return {
            angle,
            distance: distance(player.x, player.y, nextX, nextY),
            vertical: false,
            block : wall,
            horizontalSample : Math.abs(nextX) - Math.floor(nextX),
        };
    }

    redraw(){
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

function getImage(block){
    if(imageSet[block.imageName]){
        return imageSet[block.imageName]
    }
    try {
        let loadIMG = new Image()
        loadIMG.src = block.imageName
        imageSet[block.imageName] = (isImageOk(loadIMG)) ? loadIMG : imageSet[missingImgName] ;
        return loadIMG
    }
    catch (e){
        imageSet[block.imageName] = imageSet[missingImgName];
        return  imageSet[missingImgName]
    }
}

function initMissingIMG(){
    let loadIMG = new Image()
    loadIMG.src = missingImgName
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

function calcHorizontalSample(next){}