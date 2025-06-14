"use strict";
export const CELL_SIZE = 2; //[m]  units in meters (world space not map / screen space)

export const GAME_TICK_RATE = 100;//[hz] physics/ game logic calculations per second
export const SCREEN_TICK_RATE = 30;//[hz] screen redraws per second

export const MAX_RAYS = 540;// maximum number of rays (-1 for disabling)

export let DEBUG_MODE = false
export const IMAGE_PATH = "./images/"
export const MAX_RAY_DEPTH = 1000 //max number of blocks ray can travel
export let MINIMAP = false

export const FLOOR_SKIP_DRAW_THRESHOLD = 1 //how many pixels high a floor tile must be before it is rendered
export const FLOOR_SKIP_DRAW_MAX_DIST = 1 //how many floor pixels draw can skip before rendering

export default {CELL_SIZE,GAME_TICK_RATE,SCREEN_TICK_RATE,MAX_RAYS,DEBUG_MODE,IMAGE_PATH,MAX_RAY_DEPTH,MINIMAP,FLOOR_SKIP_DRAW_THRESHOLD,FLOOR_SKIP_DRAW_MAX_DIST}