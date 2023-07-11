let COLORS = {
    floor: "#376707", // "#ff6361"
    ceiling: "#7ccecc", // "#012975",
    wall: "#8a8a8f", // "#58508d"
    wallDark: "#66686c", // "#003f5c"
    rays: "#ffa600",
};
let FOV = toRadians(75);

class view {

    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;
    canvas;
    context;

    world;
    player;

    constructor(Canvas = document.createElement("canvas"), world,player) {
        this.canvas = Canvas;
        this.canvas.setAttribute("width", this.SCREEN_WIDTH);
        this.canvas.setAttribute("height", this.SCREEN_HEIGHT);
        document.body.appendChild(this.canvas);
        this.context = this.canvas.getContext("2d");

        this.world = world
        this.player = player
    }

    clearScreen() {
        this.context.fillStyle = "red";
        this.context.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
    }

    renderMinimap(posX = 0, posY = 0, scale, rays) {
        let cellSize = scale * CELL_SIZE;
        map.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    this.context.fillStyle = "grey";
                    this.context.fillRect(
                        posX + x * cellSize,
                        posY + y * cellSize,
                        cellSize,
                        cellSize
                    );
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
            let distance = fixFishEye(ray.distance, ray.angle, player.angle);
            let wallHeight = ((CELL_SIZE * 5) / distance) * 277;
            this.context.fillStyle = ray.vertical ? COLORS.wallDark : COLORS.wall;
            this.context.fillRect(i, this.SCREEN_HEIGHT / 2 - wallHeight / 2, 1, wallHeight);
            this.context.fillStyle = COLORS.floor;
            this.context.fillRect(
                i,
                this.SCREEN_HEIGHT / 2 + wallHeight / 2,
                1,
                this.SCREEN_HEIGHT / 2 - wallHeight / 2
            );
            this.context.fillStyle = COLORS.ceiling;
            this.context.fillRect(i, 0, 1, this.SCREEN_HEIGHT / 2 - wallHeight / 2);
        });
    }

    castRay(angle) {
        let vCollision = this.getVCollision(angle);
        let hCollision = this.getHCollision(angle);

        return hCollision.distance >= vCollision.distance ? vCollision : hCollision;
    }

    getRays() {
        let initialAngle = player.angle - FOV / 2;
        let numberOfRays = this.SCREEN_WIDTH;
        let angleStep = FOV / numberOfRays;
        return Array.from({ length: numberOfRays }, (_, i) => {
            let angle = initialAngle + i * angleStep;
            return this.castRay(angle);
        });
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
            wall = map[cellY][cellX];
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

            wall = map[cellY][cellX];
            if (!wall) {
                nextX += xA;
                nextY += yA;
            }
        }
        return {
            angle,
            distance: distance(player.x, player.y, nextX, nextY),
            vertical: false,
        };
    }

    redraw(){
        let rays = this.getRays()
        this.clearScreen()
        this.renderScene(rays)
        this.renderMinimap(0, 0, 0.75, rays);
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

