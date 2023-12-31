const CELL_SIZE = 2; //[m]  units in meters (world space not map / screen space)

const GAME_TICK_RATE = 100;//[hz] physics/ game logic calcs per second
const SCREEN_TICK_RATE = 30;//[hz] screen redraws per second

const MAX_RAYS = 540;// maximum number of rays (-1 for disable)

let DEBUG_MODE = false
const IMAGE_PATH = "./images/"
const MAX_RAY_DEPTH = 1000 //max number of blocks ray can travel
let MINIMAP = false

const FLOOR_SKIP_DRAW_THRESHOLD = 1 //how many pixels high a floor tile must be before it is rendered
const FLOOR_SKIP_DRAW_MAX_DIST = 1 //how many floor pixels draw can skip before rendering
