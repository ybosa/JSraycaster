const CELL_SIZE = 1; //[m]  units in meters (world space not map / screen space)

const GAME_TICK_RATE = 100;//[hz] physics/ game logic calcs per second
const SCREEN_TICK_RATE = 30;//[hz] screen redraws per second

const MAX_RAYS = 150;// maximum number of rays (-1 for disable)

const DEBUG_MODE = false
const IMAGE_PATH = "./images/"
const MAX_RAY_DEPTH = 10000 //max number of blocks ray can travel


const FLOOR_SKIP_DRAW_THRESHOLD = 5 //how many pixels high a floor tile must be before it is rendered
const FLOOR_SKIP_DRAW_MAX_DIST = 10 //how many floor pixels draw can skip before rendering