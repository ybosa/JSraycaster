const CELL_SIZE = 1; //[m]  units in meters (world space not map / screen space)

const GAME_TICK_RATE = 100;//[hz] physics/ game logic calcs per second
const SCREEN_TICK_RATE = 30;//[hz] screen redraws per second

const MAX_RAYS = 250;// maximum number of rays (-1 for disable)

const DEBUG_MODE = false
const IMAGE_PATH = "./images/"
const MAX_RAY_DEPTH = 10000 //max number of blocks ray can travel