import Point from './Point';
import elementsList, { Element } from './Element';
import DirectionList from './Direction';

const LAYER1 = 0;
const LAYER2 = 1;
const LAYER3 = 2;

type LAYER_NO = typeof LAYER1 | typeof LAYER2 | typeof LAYER3;

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


class LengthToXY {
    constructor(public readonly boardSize: number) { }

    getXY(length) {
        if (length == -1) {
            return null;
        }
        return new Point(length % this.boardSize, Math.trunc(length / this.boardSize));
    }

    getLength(x, y) {
        return (this.boardSize - 1 - y) * this.boardSize + x;
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

class Board {
    size: number;
    scannerOffset: XY;
    heroPosition: XY;
    layers = [] as Element[][][]
    layersString: string[]
    barriersMap: boolean[][]
    barriers: any;
    constructor(board) {
        this.layersString = board.layers;
        this.scannerOffset = board.offset;
        this.heroPosition = board.heroPosition;
        var levelFinished: boolean = board.levelFinished;
        this.size = Math.sqrt(this.layersString[LAYER1].length);
        var xyl = new LengthToXY(this.size);

        var parseLayer = (layer: string) => {
            var map = [] as Element[][];
            for (var x = 0; x < this.size; x++) {
                map[x] = [];
                for (var y = 0; y < this.size; y++) {
                    map[x][y] = elementsList.getElement(layer.charAt(xyl.getLength(x, y)))
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
        this.getBarriers();
    }
    getFromArray(x, y, array, def) {
        if (this.isOutOf(x, y)) {
            return def;
        }
        return array[x][y];
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
        return pt(this.heroPosition.x, this.heroPosition.y);
    }
    isWallAt(x: number, y: number) {
        return this.getAt(LAYER1, x, y).type == 'WALL';
    };
    getOtherHeroes() {
        var elements = [elementsList.ROBOT_OTHER, elementsList.ROBOT_OTHER_FALLING, elementsList.ROBOT_OTHER_LASER];
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
        var elements = [elementsList.LASER_LEFT, elementsList.LASER_RIGHT,
        elementsList.LASER_UP, elementsList.LASER_DOWN];
        return this.get(LAYER2, elements);
    };
    getWalls() {
        return this.get(LAYER1, wallElements);
    }
    getBoxes() {
        return this.get(LAYER2, [elementsList.BOX]);
    }
    getGold() {
        return this.get(LAYER1, [elementsList.GOLD]);
    }
    getStarts() {
        return this.get(LAYER1, [elementsList.START]);
    }
    getZombies() {
        return this.get(LAYER2, [elementsList.FEMALE_ZOMBIE, elementsList.MALE_ZOMBIE,
        elementsList.ZOMBIE_DIE]);
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
        return this.layers[layer][x][y];
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

            switch (i) {
                case 0:
                    result += ' Robots: ' + this.getMe() + ',' + printArray(this.getOtherHeroes());
                    break;
                case 1:
                    result += ' Gold: ' + printArray(this.getGold());
                    break;
                case 2:
                    result += ' Starts: ' + printArray(this.getStarts());
                    break;
                case 3:
                    result += ' Exits: ' + printArray(this.getExits());
                    break;
                case 4:
                    result += ' Boxes: ' + printArray(this.getBoxes());
                    break;
                case 5:
                    result += ' Holes: ' + printArray(this.getHoles());
                    break;
                case 6:
                    result += ' LaserMachine: ' + printArray(this.getLaserMachines());
                    break;
                case 7:
                    result += ' Lasers: ' + printArray(this.getLasers());
                    break;
                case 8:
                    result += ' Zombies: ' + printArray(this.getZombies());
                    break;
                case 9:
                    result += ' Perks: ' + printArray(this.getPerks());
                    break;
            }

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
    getBarriers() {
        if (this.barriers) {
            return this.barriers;
        }
        this.barriers = [];

        for (var x = 0; x < this.size; x++) {
            for (var y = 0; y < this.size; y++) {
                var element1 = this.getAt(LAYER1, x, y);
                var element2 = this.getAt(LAYER2, x, y);

                this.barriersMap[x][y] = (
                    element1.type == 'WALL' ||
                    element1 == elementsList.HOLE ||
                    element2 == elementsList.BOX ||
                    laserMachineElements.includes(element1)
                );


                if (this.barriersMap[x][y]) {
                    this.barriers.push(pt(x, y));
                }
            }
        }
        return this.barriers;
    }
    isAnyOfAt(layer: LAYER_NO, x: number, y: number, elements: Element[]) {
        return this.isAt(layer, x, y, elements);
    }
    isNear(layer: LAYER_NO, x: number, y: number, element: Element) {
        if (pt(x, y).isBad(this.size)) {
            return false;
        }
        return this.isAt(layer, x + 1, y, [element]) || this.isAt(layer, x - 1, y, [element])
            || this.isAt(layer, x, y + 1, [element]) || this.isAt(layer, x, y - 1, [element]);
    }
    isBarrierAt(x, y) {
        return this.barriersMap[x][y];
    }
    countNear(layer: LAYER_NO, x: number, y: number, element) {
        if (pt(x, y).isBad(this.size)) {
            return 0;
        }
        var count = 0;
        if (this.isAt(layer, x - 1, y, element)) count++;
        if (this.isAt(layer, x + 1, y, element)) count++;
        if (this.isAt(layer, x, y - 1, element)) count++;
        if (this.isAt(layer, x, y + 1, element)) count++;
        return count;
    }
    getShortestWay(from: Point, to: Point): Point[] {
        if (from.getX() == to.getX() && from.getY() == to.getY()) {
            return [from];
        }

        var mask = Array(this.size);
        for (var x = 0; x < this.size; x++) {
            mask[x] = new Array(this.size);
            for (var y = 0; y < this.size; y++) {
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
                        mask[next.x][next.y] = -1;
                    }
                }
            }
        }
        for (const laserMachine of this.getLaserMachines()) {
            mask[laserMachine.x][laserMachine.y] = -1;
        }

        var getMask = function (x, y) {
            return this.getFromArray(x, y, mask, -1);
        }

        var current = 1;
        mask[from.getX()][from.getY()] = current;

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
                        if (mask[x][y] == -1) {
                            var s = '*';
                        } else if (mask[x][y] == 0) {
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
                            var s = '' + mask[x][y];
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
                    if (mask[x][y] != current) continue;

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
                                mask[xx][yy] = current + 1;
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
        current = mask[point.getX()][point.getY()];

        var path: Point[] = [point];

        while (!done) {
            comeRound(point.getX(), point.getY(), function (xx, yy) {
                if (mask[xx][yy] == current - 1) {
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
    getScannerOffset() {
        return pt(this.scannerOffset.x, this.scannerOffset.y);
    }
};


export default Board;
