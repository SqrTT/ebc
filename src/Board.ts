import Point from './Point';
import elementsList, { Element } from './Element';
import DirectionList, { Direction } from './Direction';

const LAYER1 = 0;
const LAYER2 = 1;
const LAYER3 = 2;

type LAYER_NO = typeof LAYER1 | typeof LAYER2 | typeof LAYER3;

export function range(start = 0, stop: number, step = 1): number[] {
    if (stop == null) {
        stop = start || 0;
        start = 0;
    }
    if (!step) {
        step = stop < start ? -1 : 1;
    }

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
        range[idx] = start;
    }

    return range;
}
function makeArray<T>(x: number, y: number, fillValue: T) {
    return (new Array<T>(x)).fill(fillValue)
        .map(() => (new Array<T>(y)).fill(fillValue));
}

function makeArray3<T>(x: number, y: number, fillValue: T, z: number) {
    return (new Array<T>(z)).fill(fillValue)
        .map(() => (new Array<T>(y)).fill(fillValue).map(() => (new Array<T>(x)).fill(fillValue)));
}

const MOVE_DIRECTIONS = [
    DirectionList.DOWN,
    DirectionList.UP,
    DirectionList.LEFT,
    DirectionList.RIGHT,
    DirectionList.STOP,
    DirectionList.LEFT_JUMP,
    DirectionList.UP_JUMP,
    DirectionList.DOWN_JUMP,
    DirectionList.RIGHT_JUMP,
]

/**
 *
 * @param {number} x
 * @param {number} y
 */
function pt(x, y) {
    return new Point(x, y);
};

var printArray = function (array: Element[] | Point[]) {
    var result = [] as string[];
    for (var index in array) {
        var element = array[index];
        result.push(element.toString());
    }
    return result;
};


export class LengthToXY {
    constructor(public readonly boardSize: number) { }

    getXY(length) {
        if (length == -1) {
            return null;
        }
        return new Point(length % this.boardSize, Math.trunc(length / this.boardSize));
    }

    getLength(x, y) {
        return (y) * this.boardSize + x;
    }
};

interface XY {
    x: number
    y: number
}

const wallElements = [elementsList.ANGLE_IN_LEFT, elementsList.WALL_FRONT,
elementsList.ANGLE_IN_RIGHT, elementsList.WALL_RIGHT,
elementsList.ANGLE_BACK_RIGHT, elementsList.WALL_BACK,
elementsList.ANGLE_BACK_LEFT, elementsList.WALL_LEFT,
elementsList.WALL_BACK_ANGLE_LEFT, elementsList.WALL_BACK_ANGLE_RIGHT,
elementsList.ANGLE_OUT_RIGHT, elementsList.ANGLE_OUT_LEFT,
elementsList.SPACE];
const laserMachineElements = [elementsList.LASER_MACHINE_CHARGING_LEFT, elementsList.LASER_MACHINE_CHARGING_RIGHT,
elementsList.LASER_MACHINE_CHARGING_UP, elementsList.LASER_MACHINE_CHARGING_DOWN,
elementsList.LASER_MACHINE_READY_LEFT, elementsList.LASER_MACHINE_READY_RIGHT,
elementsList.LASER_MACHINE_READY_UP, elementsList.LASER_MACHINE_READY_DOWN];

const readyMachinesAndLasers = [elementsList.LASER_MACHINE_READY_LEFT, elementsList.LASER_MACHINE_READY_RIGHT,
elementsList.LASER_MACHINE_READY_UP, elementsList.LASER_MACHINE_READY_DOWN];

const lasersElements = [elementsList.LASER_LEFT, elementsList.LASER_RIGHT,
elementsList.LASER_UP, elementsList.LASER_DOWN];

export class Player {
    pt: Point;
    dir: Direction;
    fireTick: number;
    moveTick: number;
    inAir: boolean;
    isZombie: boolean = false;
    isAlive: boolean = true;
    constructor(pt: Point) {
        this.pt = pt;
    }
    hasAmmo: boolean = true;
    isAfk: boolean = false;
}

export const calcDepth = 10;
class Board {
    size: number;
    scannerOffset: XY;
    heroPosition: XY;
    layers = [] as Element[][][]
    layersString: string[]
    barriersMap: boolean[][]
    barriers: any;
    lasersTrace: (Direction | null)[][][];
    lasers: ([Point, Direction])[] = [];
    private _boxes: Point[];
    private _boxesMap: Map<string, boolean>;
    private _gold: Point[];
    private _holesMap: Map<string, boolean>;
    constructor(board) {
        this.layersString = board.layers;
        this.scannerOffset = board.offset;
        this.heroPosition = board.heroPosition;
        var levelFinished: boolean = board.levelFinished;
        this.size = Math.sqrt(this.layersString[LAYER1].length);
        var xyl = new LengthToXY(this.size);

        var parseLayer = (layer: string) => {
            var map = [] as Element[][];
            for (var y = 0; y < this.size; y++) {
                map[y] = [];
                for (var x = 0; x < this.size; x++) {
                    map[y][x] = elementsList.getElement(layer.charAt(xyl.getLength(x, y)))
                }
            }
            return map;
        }

        for (var index in this.layersString) {
            this.layers.push(parseLayer(this.layersString[index]));
        }

        this.barriersMap = Array(this.size);
        for (var x = 0; x < this.size; x++) {
            this.barriersMap[x] = new Array(this.size);
        };
        this.getStaticBarriers();


        this.lasersTrace = makeArray3(this.size, this.size, null, calcDepth) as (Direction | null)[][][];

        for (const laser of this.getLasersAndReadyMachines()) {
            const dir = laser.direction && DirectionList.get(laser.direction);
            if (dir) {
                this.lasers.push([laser, dir]);
                let newL = laser;
                for (const t of range(0, calcDepth)) {
                    if (!newL.isBad(this.size)) {
                        this.lasersTrace[t][newL.y][newL.x] = dir;
                        if (
                            this.getAt(LAYER1, newL.x, newL.y).type === 'WALL'
                            || this.getAt(LAYER2, newL.x, newL.y).type === 'BOX'
                        ) {
                            break;
                        }
                        newL = dir.change(newL);
                    }
                }
            }
        }
    }
    getFromArray(x, y, array, def) {
        if (this.isOutOf(x, y)) {
            return def;
        }
        return array[y][x];
    }
    isBarrier(x: number, y: number) {
        return this.getFromArray(x, y, this.barriersMap, true);
    }

    hasClearPath(from: Point, to: Point) {
        let count = 100;
        let pos = from;
        /**
         * @type {DirectionList}
         */
        const dir = DirectionList.where(from, to);

        while (count--) {
            const el = this.getAt(LAYER1, pos.x, pos.y)
            const el2 = this.getAt(LAYER2, pos.x, pos.y)
            pos = dir.change(pos);
            if (pos.isBad(this.size) || el2 === elementsList.BOX) {
                return false;
            } else if (pos.equals(to)) {
                return true;
            } else if ([elementsList.HOLE, elementsList.FLOOR, elementsList.START, elementsList.ZOMBIE_START, elementsList.GOLD].includes(el)) {
                continue
            } else {
                return false;
            }
        }
        return false;
    }
    getMe() {
        //return pt(this.heroPosition.x, this.heroPosition.y);
        const myRobot = this.get(LAYER2, elementsList.getElementsOfType('MY_ROBOT'));
        if (myRobot.length) {
            return myRobot[0];
        }
        const myRobot2 = this.get(LAYER3, elementsList.getElementsOfType('MY_ROBOT'));
        return myRobot2[0];
    }
    isWallAt(x: number, y: number) {
        return this.getAt(LAYER1, x, y).type == 'WALL';
    }

    blasts(sx, sy, blast = 4) {
        const result: number[][] = [];
        for (const [search_range, is_x] of [
            [range(sx, sx + blast), true] as [number[], boolean],
            [range(sx, sx - blast, -1), true] as [number[], boolean],
            [range(sy, sy + blast), false] as [number[], boolean],
            [range(sy, sy - blast, -1), false] as [number[], boolean]
        ]) {

            for (const i of search_range) {
                const [x, y] = is_x ? [i, sy] : [sx, i];
                if (x === sx && y === sy) {
                    continue;
                }

                if (this.isOutOf(x, y) || elementsList.isWall(this.getAt(0, x, y)) || this.getAt(1, x, y) === elementsList.BOX) {
                    break
                }
                result.push([x, y]);
            }
        }
        return result;
    }
    getOtherHeroes() {
        var elements = [elementsList.ROBOT_OTHER, elementsList.ROBOT_OTHER_FALLING, elementsList.ROBOT_OTHER_LASER];
        return this.get(LAYER2, elements)
            .concat(this.get(LAYER3, [elementsList.ROBOT_OTHER_FLYING]));
    }
    getOtherLiveHeroes() {
        var elements = [elementsList.ROBOT_OTHER];
        return this.get(LAYER2, elements)
            .concat(this.get(LAYER3, [elementsList.ROBOT_OTHER_FLYING]));
    }
    get(layer: LAYER_NO, elements: Element[]) {
        var result: Point[] = [];
        for (var x = 0; x < this.size; x++) {
            for (var y = 0; y < this.size; y++) {
                for (var e in elements) {
                    var element = elements[e];

                    if (this.getAt(layer, x, y).char == element.char) {
                        result.push(element.direction ? new Point(x, y, element.direction.toString()) : new Point(x, y));
                    }
                }
            }
        }
        return result;
    }
    isAt(layer: LAYER_NO, x: number, y: number, elements: Element[]) {
        if (this.isOutOf(x, y) || this.getAt(layer, x, y) == null) {
            return false;
        }

        for (var e in elements) {
            var element = elements[e];
            if (this.getAt(layer, x, y).char == element.char) {
                return true;
            }
        }
        return false;
    }
    getLaserMachines() {
        return this.get(LAYER1, laserMachineElements);
    }
    getLasers() {
        return this.get(LAYER2, lasersElements);
    }
    getLasersAndReadyMachines() {
        return this.getLasers().concat(this.get(LAYER1, readyMachinesAndLasers));
    }
    getWalls() {
        return this.get(LAYER1, wallElements);
    }
    getBoxes() {
        if (!this._boxes) {
            this._boxes = this.get(LAYER2, [elementsList.BOX]);
        }
        return this._boxes;
    }

    getBoxesMap() {
        if (!this._boxesMap) {
            this._boxesMap = new Map<string, boolean>();


            this.getBoxes().forEach(b => {
                this._boxesMap.set(`${b.x}-${b.y}`, true);
            });
        }
        return this._boxesMap;
    }
    getHolesMap() {
        if (!this._holesMap) {
            this._holesMap = new Map<string, boolean>();


            this.getHoles().forEach(b => {
                this._holesMap.set(`${b.x}-${b.y}`, true);
            });
        }
        return this._holesMap;
    }
    getGold() {
        if (!this._gold) {
            this._gold = this.get(LAYER1, [elementsList.GOLD]);
        }
        return this._gold;
    }
    getStarts() {
        return this.get(LAYER1, [elementsList.START]);
    }
    getZombies() {
        return this.get(LAYER2, [elementsList.FEMALE_ZOMBIE, elementsList.MALE_ZOMBIE,
        elementsList.ZOMBIE_DIE]);
    }
    getLiveZombies() {
        return this.get(LAYER2, [elementsList.FEMALE_ZOMBIE, elementsList.MALE_ZOMBIE]);
    }
    getZombieStart() {
        return this.get(LAYER1, [elementsList.ZOMBIE_START]);
    }
    getPerks() {
        const elements = [
            elementsList.UNSTOPPABLE_LASER_PERK,
            elementsList.DEATH_RAY_PERK,
            elementsList.UNLIMITED_FIRE_PERK
        ];
        return this.get(LAYER1, elements);
    }
    getUnvisited() {
        return this.get(LAYER1, [elementsList.UNKNOWN]);
    }
    getExits() {
        return this.get(LAYER1, [elementsList.EXIT]);
    }
    getHoles() {
        return this.get(LAYER1, [elementsList.HOLE]);
    }
    isMeAlive() {
        return this.layersString[LAYER2].indexOf(elementsList.ROBOT_LASER.char) == -1 &&
            this.layersString[LAYER2].indexOf(elementsList.ROBOT_FALLING.char) == -1;
    }

    getAt(layer: LAYER_NO, x: number, y: number) {
        return this.layers[layer][y][x];
    }

    boardAsString(layer: LAYER_NO) {
        var result = "";
        for (var i = 0; i <= this.size - 1; i++) {
            result += this.layersString[layer].substring(i * this.size, (i + 1) * this.size);
            result += "\n";
        }
        return result;
    }

    setCharAt(str: string, index: number, replacement: string) {
        return str.substr(0, index) + replacement + str.substr(index + replacement.length);
    }
    maskOverlay(source, mask) {
        var result = source;
        for (var i = 0; i < result.length; ++i) {
            var el = elementsList.getElement(mask[i]);
            if (elementsList.isWall(el)) {
                result = this.setCharAt(result, i, el.char);
            }
        }

        return result.toString();
    }
    toString() {
        var temp = '0123456789012345678901234567890';

        var result = '';

        var layer1 = this.boardAsString(LAYER1).split('\n').slice(0, -1);
        var layer2 = this.boardAsString(LAYER2).split('\n').slice(0, -1);
        var layer3 = this.boardAsString(LAYER3).split('\n').slice(0, -1);

        var numbers = temp.substring(0, layer1.length);
        var space = ''.padStart(layer1.length - 5);
        var numbersLine = numbers + '   ' + numbers + '   ' + numbers;
        var firstPart = ' Layer1 ' + space + ' Layer2' + space + ' Layer3' + '\n  ' + numbersLine;

        for (var i = 0; i < layer1.length; ++i) {
            var ii = this.size - 1 - i;
            var index = (ii < 10 ? ' ' : '') + ii;
            result += index + layer1[i] +
                ' ' + index + this.maskOverlay(layer2[i], layer1[i]) +
                ' ' + index + this.maskOverlay(layer3[i], layer1[i]);

            // switch (i) {
            //     case 0:
            //         result += ' Robots: ' + this.getMe() + ',' + printArray(this.getOtherHeroes());
            //         break;
            //     case 1:
            //         result += ' Gold: ' + printArray(this.getGold());
            //         break;
            //     case 2:
            //         result += ' Starts: ' + printArray(this.getStarts());
            //         break;
            //     case 3:
            //         result += ' Exits: ' + printArray(this.getExits());
            //         break;
            //     case 4:
            //         result += ' Boxes: ' + printArray(this.getBoxes());
            //         break;
            //     case 5:
            //         result += ' Holes: ' + printArray(this.getHoles());
            //         break;
            //     case 6:
            //         result += ' LaserMachine: ' + printArray(this.getLaserMachines());
            //         break;
            //     case 7:
            //         result += ' Lasers: ' + printArray(this.getLasers());
            //         break;
            //     case 8:
            //         result += ' Zombies: ' + printArray(this.getZombies());
            //         break;
            //     case 9:
            //         result += ' Perks: ' + printArray(this.getPerks());
            //         break;
            // }

            if (i != layer1.length - 1) {
                result += '\n';
            }
        }

        return firstPart + '\n' + result + '\n  ' + numbersLine + '\n' + JSON.stringify(this.scannerOffset, null, '  ');
    }
    layer1() {
        return this.boardAsString(LAYER1)
    }
    layer2() {
        return this.boardAsString(LAYER2)
    }
    layer3() {
        return this.boardAsString(LAYER3)
    }
    isOutOf(x: number, y: number) {
        return (x < 0 || y < 0 || x >= this.size || y >= this.size);
    }
    bfs(fromX = this.getMe().x, fromY = this.getMe().y, players: Player[] = [], forMinimax = false) {
        const distances = makeArray(this.size, this.size, +Infinity);
        const parent = makeArray<[number, number, number, Direction] | null>(this.size, this.size, null);
        const penalty = makeArray(this.size, this.size, 0);


        for (const box of this.getBoxes()) {
            penalty[box.y][box.x] = 10e5;
        }

        for (const hole of this.getHoles()) {
            penalty[hole.y][hole.x] = 10e9;
        }

        for (const box of this.getZombieStart()) {
            penalty[box.y][box.x] += 2;
        }
        for (const lm of this.getLaserMachines()) {
            const machine = this.getAt(0, lm.x, lm.y);
            const nextOfMachine = machine?.direction?.change(lm);
            if (nextOfMachine) {
                penalty[nextOfMachine.y][nextOfMachine.x] += 2;
            }
        }

        for (const exit of this.getExits()) {
            penalty[exit.y][exit.x] += 5;// make hero jump over exit if exit is not target
        }
        const neatPlayerMap = new Map<string, boolean>();

        if (players.length) {
            for (const npc of players) {
                if (Math.abs(fromX - npc.pt.x) <= 1 && Math.abs(fromY - npc.pt.y) <= 1) {
                    penalty[npc.pt.y][npc.pt.x] += npc.isAfk ? 0 : 10;
                }
                for (const [x, y] of this.blasts(npc.pt.x, npc.pt.y, 2)) {
                    penalty[y][x] += npc.isAfk ? 0 : 10;
                    if (!npc.isAfk) {
                        neatPlayerMap.set(`${x}-${y}`, true);
                    }
                }
            }
        } else {
            for (const npc of this.getOtherLiveHeroes()) {
                for (const [x, y] of this.blasts(npc.x, npc.y, 2)) {
                    penalty[y][x] += 10;
                }
            }
        }

        for (const zombie of this.getLiveZombies()) {
            penalty[zombie.y][zombie.x] += 20;
            for (const [x, y] of this.blasts(zombie.x, zombie.y, 2)) {
                penalty[y][x] += 10;
            }
        }

        distances[fromY][fromX] = 0;
        const Q = [[fromX, fromY, 0, DirectionList.STOP]] as [number, number, number, Direction][];
        let length = 0;

        while (length < Q.length) {
            var [posX, posY, time] = Q[length];
            length++;
            if (this.getAt(LAYER1, posX, posY).type !== 'UNKNOWN') {
                for (var dir of MOVE_DIRECTIONS) {
                    var xx = dir.changeX(posX);
                    var yy = dir.changeY(posY);

                    if (this.isOutOf(xx, yy)) {
                        continue;
                    } else if (this.barriersMap[yy][xx]) {
                        continue;
                    } else if (dir.cost <= 1 && players.some(p => p.pt.x === xx && yy === p.pt.y)) {
                        // don't allow direct move to other player
                        continue;
                    } else if (dir.cost > 1 && neatPlayerMap.get(`${xx}-${yy}`)) {
                        // don't allow jump near other player
                        continue;
                    }

                    var tt = time + dir.cost;
                    var lDir = this.lasersTrace[Math.min(Math.floor(tt - 1), calcDepth - 1)][yy][xx];

                    if (lDir) {
                        if (lDir.changeX(xx) === posX && lDir.changeY(yy) === posY) {
                            continue;
                        }
                    }

                    var currentPenalty = penalty[yy][xx];
                    currentPenalty = this.lasersTrace[Math.min(Math.floor(tt), calcDepth - 1)][yy][xx] ? 10e9 : currentPenalty;

                    if (distances[yy][xx] > distances[posY][posX] + dir.cost + currentPenalty) {
                        distances[yy][xx] = distances[posY][posX] + dir.cost + currentPenalty;
                        parent[yy][xx] = [posX, posY, time, dir];
                        Q.push([xx, yy, tt, dir]);
                    }
                }
            }
        }


        return { distances, parent };
    }
    getStaticBarriers() {
        if (this.barriers) {
            return this.barriers;
        }
        this.barriers = [];

        for (var x = 0; x < this.size; x++) {
            for (var y = 0; y < this.size; y++) {
                var element1 = this.getAt(LAYER1, x, y);
                // var element2 = this.getAt(LAYER2, x, y);

                this.barriersMap[y][x] = (
                    element1.type == 'WALL' ||
                    laserMachineElements.includes(element1)
                );


                if (this.barriersMap[y][x]) {
                    this.barriers.push(pt(x, y));
                }
            }
        }
        return this.barriers;
    }
    isAnyOfAt(layer: LAYER_NO, x: number, y: number, elements: Element[]) {
        return this.isAt(layer, x, y, elements);
    }
    isNear(layer: LAYER_NO, x: number, y: number, elements: Element[]) {
        if (pt(x, y).isBad(this.size)) {
            return false;
        }
        return this.isAt(layer, x + 1, y, elements) || this.isAt(layer, x - 1, y, elements)
            || this.isAt(layer, x, y + 1, elements) || this.isAt(layer, x, y - 1, elements);
    }
    getNear(layer: LAYER_NO, x: number, y: number) {
        if (this.isOutOf(x, y)) {
            return [];
        }
        return [DirectionList.UP, DirectionList.DOWN, DirectionList.LEFT, DirectionList.RIGHT]
            .map(dir =>
            ({
                dir: dir,
                el: this.getAt(layer, dir.changeX(x), dir.changeY(y)),
                get pt() { return pt(dir.changeX(x), dir.changeY(y)) }
            }))
        //.filter(a => !a.pt.isBad(this.size));
    }
    isBarrierAt(x, y) {
        return this.barriersMap[x][y];
    }
    countNear(layer: LAYER_NO, x: number, y: number, elements: Element[]) {
        if (pt(x, y).isBad(this.size)) {
            return 0;
        }
        var count = 0;
        if (this.isAt(layer, x - 1, y, elements)) count++;
        if (this.isAt(layer, x + 1, y, elements)) count++;
        if (this.isAt(layer, x, y - 1, elements)) count++;
        if (this.isAt(layer, x, y + 1, elements)) count++;
        return count;
    }
    getShortestWay(from: Point, to: Point): Point[] {
        if (from.getX() == to.getX() && from.getY() == to.getY()) {
            return [from];
        }

        var mask = Array(this.size);
        for (var y = 0; y < this.size; y++) {
            mask[y] = new Array(this.size);
            for (var x = 0; x < this.size; x++) {
                mask[x][y] = (this.isWallAt(x, y)) ? -1 : 0;
            }
        }
        for (const laser of this.getLasers()) {
            var direction = laser.direction;
            if (direction) {
                const dir = DirectionList.get(direction);

                if (dir) {
                    var next = dir.change(laser);
                    if (!isOutOf(next.x, next.y)) {
                        mask[next.y][next.x] = -1;
                    }
                }
            }
        }
        for (const laserMachine of this.getLaserMachines()) {
            mask[laserMachine.y][laserMachine.x] = -1;
        }

        var getMask = function (x, y) {
            return this.getFromArray(x, y, mask, -1);
        }

        var current = 1;
        mask[from.getY()][from.getX()] = current;

        function isOutOf(x, y) {
            return (x < 0 || y < 0 || x >= this.size || y >= this.size);
        }

        var comeRound = function (x, y, onElement) {
            var dd = [[0, -1], [1, 0], [-1, 0], [0, 1]];
            for (var i in dd) {
                var dx = dd[i][0];
                var dy = dd[i][1];

                var xx = x + dx;
                var yy = y + dy;
                if (isOutOf(xx, yy)) continue;

                var stop = !onElement(xx, yy);

                if (stop) return;
            }
        }

        var done = false;
        while (!done) {
            var maskToString = function () {
                var string = '01234567890123456789\n';
                for (var y = 0; y < this.size; y++) {
                    for (var x = 0; x < this.size; x++) {
                        if (mask[y][x] == -1) {
                            var s = '*';
                        } else if (mask[y][x] == 0) {
                            if (this.getAt(x, y, LAYER1) == elementsList.HOLE) {
                                var s = 'O';
                            } else if (this.getAt(x, y, LAYER2) == elementsList.BOX) {
                                var s = 'B';
                            } else if (this.getAt(x, y, LAYER1) == elementsList.EXIT) {
                                var s = 'E';
                            } else {
                                var s = ' ';
                            }
                        } else {
                            var s = '' + mask[y][x];
                        }
                        if (s.length == 2) s = s[1];
                        string += s;
                    }
                    string += ' ' + y + '\n';
                }
                string += '01234567890123456789\n';
                console.log(string);
            }
            // s = 8;
            // if (s == -1 || current >= s - 1 && current <= s) maskToString();

            for (var x = 0; x < this.size; x++) {
                for (var y = 0; y < this.size; y++) {
                    if (mask[y][x] != current) continue;

                    comeRound(x, y, function (xx, yy) {
                        if (getMask(xx, yy) == 0) {
                            var dx = xx - x;
                            var dy = yy - y;

                            var px = x - dx;
                            var py = y - dy;

                            var fx = xx + dx;
                            var fy = yy + dy;

                            // путь px/py -> x/y -> xx/yy -> fx/fy

                            var can = true;
                            if (this.isBarrier(xx, yy) && this.isBarrier(fx, fy)) {
                                can = false;
                            }
                            if (this.isBarrier(x, y)) {
                                if (getMask(px, py) == -1) {
                                    can = false;
                                }
                                if (this.isBarrier(xx, yy)) {
                                    can = false;
                                }
                            }
                            if (this.getAt(LAYER1, xx, yy) === elementsList.HOLE && !isOutOf(fx, fy) && (this.getAt(LAYER1, fx, fy) === elementsList.HOLE || this.isBarrier(fx, fy))) {
                                can = false;
                            }
                            comeRound(xx, yy, (zx, zy) => {
                                if (this.isZombieAt(zx, zy)) {
                                    can = false;
                                }
                            })



                            // if (s == -1 || current >= s - 1 && current < s) {
                            //     console.log('px/py: ' + px + ' ' + py);
                            //     console.log('x/y: ' + x + ' ' + y);
                            //     console.log('xx/yy: ' + xx + ' ' + yy);
                            //     console.log('fx/fy: ' + fx + ' ' + fy);
                            //     console.log('mask[px][py]: ' + mask[px][py]);
                            //     console.log('isBarrier(px, py): ' + isBarrier(px, py));
                            //     console.log('isBarrier(x, y): ' + isBarrier(x, y));
                            //     console.log('isBarrier(xx, yy): ' + isBarrier(xx, yy));
                            //     console.log('isBarrier(fx, fy): ' + isBarrier(fx, fy));
                            //     console.log(((can) ? '+' : '-') + (current + 1) + ": [" + x + ":" + y + "] -> [" + xx + ":" + yy + "]");
                            // }

                            if (can) {
                                mask[yy][xx] = current + 1;
                                if (xx == to.getX() && yy == to.getY()) {
                                    done = true;
                                }
                            }
                        }
                        return true;
                    });
                }
            }

            current++;
            if (current > 200) {
                /**
                 * @type {Point[]}
                 */
                return [];
            }
        }
        var point = to;
        done = false;
        current = mask[point.getY()][point.getX()];

        var path: Point[] = [point];

        while (!done) {
            comeRound(point.getX(), point.getY(), function (xx, yy) {
                if (mask[yy][xx] == current - 1) {
                    point = pt(xx, yy);
                    current--;

                    path.push(point);

                    if (current == 1) {
                        done = true;
                    }
                    return false;
                }
                return true;
            });
        }

        return path.reverse();
    }
    isZombieAt(x: number, y: number) {
        return [elementsList.MALE_ZOMBIE, elementsList.FEMALE_ZOMBIE].includes(this.getAt(LAYER2, x, y));
    }
};


export default Board;
