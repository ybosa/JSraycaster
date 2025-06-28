"use strict";
import {CELL_SIZE, MINIMAP, DEBUG_MODE, MAX_RAYS} from "./config.js";
import {DEBUGVARS} from "./config.js";
import {toRadians} from "./view.js";

class Controller{
    constructor(player, canvas,viewer) {
        canvas.addEventListener("click", () => {
            canvas.requestPointerLock();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "ArrowUp" || e.key === "w") {
                player.speed = 5*CELL_SIZE;
            }
            if (e.key === "ArrowDown" || e.key === "s") {
                player.speed = -2*CELL_SIZE;
            }
            if (e.key === "ArrowRight" || e.key === "d") {
                player.sidewaysSpeed = 2*CELL_SIZE;
            }
            if (e.key === "ArrowLeft" || e.key === "a") {
                player.sidewaysSpeed = -2*CELL_SIZE;
            }
            if (e.key === "m"){
                DEBUGVARS.setMinimap(!MINIMAP);
            }
            //FIXME remove these
            if (e.key === "i") {
                if(!DEBUG_MODE){
                    viewer.changeNumRays(100)
                    DEBUGVARS.setMinimap(true)
                }
                else {
                    viewer.changeNumRays(MAX_RAYS)
                    DEBUGVARS.setMinimap(false)
                }
                DEBUGVARS.setDebugMode(!DEBUG_MODE)
            }
            if (e.key === "p") {
                if(viewer.numberOfRays === MAX_RAYS/2)
                    viewer.changeNumRays(MAX_RAYS)
                else
                    viewer.changeNumRays(MAX_RAYS/2)
            }
            if (e.key === "o") {
                viewer.changeNumRays(viewer.numberOfRays /2)
            }
        });

        document.addEventListener("keyup", (e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "w" || e.key === "s") {
                player.speed = 0;
            }
            if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "a" || e.key === "d") {
                player.sidewaysSpeed = 0;
            }
        });

        document.addEventListener("mousemove", function (event) {
            player.angle += toRadians(event.movementX / 10);
        });

    }
}

export default Controller
