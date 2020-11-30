import Point from './Point';
import elementsList from './Element';
import Direction from './Direction';

const LAYER1 = 0;
const LAYER2 = 1;
const LAYER3 = 2;

/**
 *
 * @param {number} x
 * @param {number} y
 */
function pt(x, y) {
    return new Point(x, y);
};

var printArray = function (array: Element[]) {
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

var Board = function (board) {
    var layersString : string[] = board.layers;
    var scannerOffset : XY = board.offset;
    var heroPosition : XY = board.heroPosition;
    var levelFinished : boolean = board.levelFinished;
    var size = Math.sqrt(layersString[LAYER1].length);
    var xyl = new LengthToXY(size);

    var parseLayer = function (layer : string) {
        var map = [] as Element[][];
        for (var x = 0; x < size; x++) {
            map[x] = [];
            for (var y = 0; y < size; y++) {
                map[x][y] = elementsList.getElement(layer.charAt(xyl.getLength(x, y)))
            }
        }
        return map;
    }

    var layers = [] as  Element[][][];
    for (var index in layersString) {
        layers.push(parseLayer(layersString[index]));
    }

    // TODO to add List<Elements> getNear(int numLayer, int x, int y) method

    function isAt(layer, x, y, elements) {
        if (!Array.isArray(elements)) {
            var arr = [];
            arr.push(elements);
            elements = arr;
        }

        if (pt(x, y).isBad(size) || getAt(layer, x, y) == null) {
            return false;
        }

        for (var e in elements) {
            var element = elements[e];
            if (getAt(layer, x, y).char == element.char) {
                return true;
            }
        }
        return false;
    };

    var getAt = function (layer, x, y) {
        return layers[layer][x][y];
    };

    var removeAllElements = function (array, element) {
        var index;
        while ((index = array.indexOf(element)) !== -1) {
            array.splice(index, 1);
        }
        return array;
    }

    var getWholeBoard = function () {
        var result = [];
        for (var x = 0; x < size; x++) {
            var arr = [];
            result.push(arr);
            for (var y = 0; y < size; y++) {
                var cell = [];
                cell.push(getAt(LAYER1, x, y).type);
                cell.push(getAt(LAYER2, x, y).type);
                cell.push(getAt(LAYER3, x, y).type);
                removeAllElements(cell, 'NONE');
                if (cell.length == 0) {
                    cell.push('NONE');
                }

                arr.push(cell);
            }
        }
        return result;
    }

    var get = function (layer, elements) {
        if (!Array.isArray(elements)) {
            var arr = [];
            arr.push(elements);
            elements = arr;
        }
        var result = [];
        for (var x = 0; x < size; x++) {
            for (var y = 0; y < size; y++) {
                for (var e in elements) {
                    var element = elements[e];
                    if (isAt(layer, x, y, element)) {
                        result.push(element.direction ? new Point(x, y, element.direction.toString()) : new Point(x, y));
                    }
                }
            }
        }
        return result;
    };

    var isAnyOfAt = function (layer, x, y, elements) {
        for (var index in elements) {
            var element = elements[index];
            if (isAt(x, y, layer, element)) {
                return true;
            }
        }
        return false;
    };

    var isNear = function (layer, x, y, element) {
        if (pt(x, y).isBad(size)) {
            return false;
        }
        return isAt(layer, x + 1, y, element) || isAt(layer, x - 1, y, element)
            || isAt(layer, x, y + 1, element) || isAt(layer, x, y - 1, element);
    };

    var isBarrierAt = function (x, y) {
        if (!barriersMap) {
            getBarriers();
        }
        return barriersMap[x][y];
    };

    var isWallAt = function (x, y) {
        return getAt(LAYER1, x, y).type == 'WALL';
    };

    var isZombieAt = function (x, y) {
        return [elementsList.MALE_ZOMBIE, elementsList.FEMALE_ZOMBIE].includes(getAt(LAYER2, x, y));
    };

    var countNear = function (layer, x, y, element) {
        if (pt(x, y).isBad(size)) {
            return 0;
        }
        var count = 0;
        if (isAt(layer, x - 1, y, element)) count++;
        if (isAt(layer, x + 1, y, element)) count++;
        if (isAt(layer, x, y - 1, element)) count++;
        if (isAt(layer, x, y + 1, element)) count++;
        return count;
    };

    var getOtherHeroes = function () {
        var elements = [elementsList.ROBOT_OTHER, elementsList.ROBOT_OTHER_FALLING, elementsList.ROBOT_OTHER_LASER];
        return get(LAYER2, elements)
            .concat(get(LAYER3, elementsList.ROBOT_OTHER_FLYING));
    };

    var getLaserMachines = function () {
        var elements = [elementsList.LASER_MACHINE_CHARGING_LEFT, elementsList.LASER_MACHINE_CHARGING_RIGHT,
        elementsList.LASER_MACHINE_CHARGING_UP, elementsList.LASER_MACHINE_CHARGING_DOWN,
        elementsList.LASER_MACHINE_READY_LEFT, elementsList.LASER_MACHINE_READY_RIGHT,
        elementsList.LASER_MACHINE_READY_UP, elementsList.LASER_MACHINE_READY_DOWN];
        return get(LAYER1, elements);
    };

    var getLasers = function () {
        var elements = [elementsList.LASER_LEFT, elementsList.LASER_RIGHT,
        elementsList.LASER_UP, elementsList.LASER_DOWN];
        return get(LAYER2, elements);
    };

    var getWalls = function () {
        var elements = [elementsList.ANGLE_IN_LEFT, elementsList.WALL_FRONT,
        elementsList.ANGLE_IN_RIGHT, elementsList.WALL_RIGHT,
        elementsList.ANGLE_BACK_RIGHT, elementsList.WALL_BACK,
        elementsList.ANGLE_BACK_LEFT, elementsList.WALL_LEFT,
        elementsList.WALL_BACK_ANGLE_LEFT, elementsList.WALL_BACK_ANGLE_RIGHT,
        elementsList.ANGLE_OUT_RIGHT, elementsList.ANGLE_OUT_LEFT,
        elementsList.SPACE];
        return get(LAYER1, elements);
    };

    var getBoxes = function () {
        return get(LAYER2, elementsList.BOX);
    };

    var getStarts = function () {
        return get(LAYER1, elementsList.START);
    };

    var getZombieStart = function () {
        return get(LAYER1, elementsList.ZOMBIE_START);
    };

    var getExits = function () {
        return get(LAYER1, elementsList.EXIT);
    };

    var getGold = function () {
        return get(LAYER1, elementsList.GOLD);
    };

    var getZombies = function () {
        var elements = [elementsList.FEMALE_ZOMBIE, elementsList.MALE_ZOMBIE,
        elementsList.ZOMBIE_DIE];
        return get(LAYER2, elements);
    };

    var getPerks = function () {
        var elements = [elementsList.UNSTOPPABLE_LASER_PERK, elementsList.DEATH_RAY_PERK, elementsList.UNLIMITED_FIRE_PERK];
        return get(LAYER1, elements);
    }

    var getHoles = function () {
        return get(LAYER1, elementsList.HOLE);
    };

    var isMeAlive = function () {
        return layersString[LAYER2].indexOf(elementsList.ROBOT_LASER.char) == -1 &&
            layersString[LAYER2].indexOf(elementsList.ROBOT_FALLING.char) == -1;
    };

    var barriers = null;
    var barriersMap = null;
    var getBarriers = function () {
        if (!!barriers) {
            return barriers;
        }

        var isOutOf = function (x, y) {
            return (x < 0 || y < 0 || x >= size || y >= size);
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

        barriers = [];
        barriersMap = Array(size);
        for (var x = 0; x < size; x++) {
            barriersMap[x] = new Array(size);
        };
        for (var x = 0; x < size; x++) {
            for (var y = 0; y < size; y++) {
                var element1 = getAt(LAYER1, x, y);
                var element2 = getAt(LAYER2, x, y);

                barriersMap[x][y] = (
                    element1.type == 'WALL' ||
                    // element1 == Element.HOLE ||
                    element2 == elementsList.MALE_ZOMBIE ||
                    element2 == elementsList.FEMALE_ZOMBIE ||
                    element2 == elementsList.BOX ||
                    !!element1.direction
                );
                if (element2 == elementsList.MALE_ZOMBIE || element2 == elementsList.FEMALE_ZOMBIE) {
                    barriersMap[x][y] = true;
                    comeRound(x, y, (nx, ny) => {
                        if (!isOutOf(nx, ny)) {
                            barriersMap[nx][ny] = true;
                            barriers.push(pt(nx, ny));
                        }
                    })
                }

                if (barriersMap[x][y]) {
                    barriers.push(pt(x, y));
                }
            }
        }
        return barriers;
    };

    var getFromArray = function (x, y, array, def) {
        if (x < 0 || y < 0 || x >= size || y >= size) {
            return def;
        }
        return array[x][y];
    }

    var isBarrier = function (x, y) {
        return getFromArray(x, y, barriersMap, true);
    }

    /**
     *
     * @param {Point} from
     * @param {Point} to
     * @returns {Point[]}
     */
    function getShortestWay(from, to) {
        if (from.getX() == to.getX() && from.getY() == to.getY()) {
            return [from];
        }
        if (!barriersMap) {
            getBarriers();
        }

        var mask = Array(size);
        for (var x = 0; x < size; x++) {
            mask[x] = new Array(size);
            for (var y = 0; y < size; y++) {
                mask[x][y] = (isWallAt(x, y)) ? -1 : 0;
            }
        }

        var getMask = function (x, y) {
            return getFromArray(x, y, mask, -1);
        }

        var current = 1;
        mask[from.getX()][from.getY()] = current;

        var isOutOf = function (x, y) {
            return (x < 0 || y < 0 || x >= size || y >= size);
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
                for (var y = 0; y < size; y++) {
                    for (var x = 0; x < size; x++) {
                        if (mask[x][y] == -1) {
                            var s = '*';
                        } else if (mask[x][y] == 0) {
                            if (getAt(x, y, LAYER1) == elementsList.HOLE) {
                                var s = 'O';
                            } else if (getAt(x, y, LAYER2) == elementsList.BOX) {
                                var s = 'B';
                            } else if (getAt(x, y, LAYER1) == elementsList.EXIT) {
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

            for (var x = 0; x < size; x++) {
                for (var y = 0; y < size; y++) {
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
                            if (isBarrier(xx, yy) && isBarrier(fx, fy)) {
                                can = false;
                            }
                            if (isBarrier(x, y)) {
                                if (getMask(px, py) == -1) {
                                    can = false;
                                }
                                if (isBarrier(xx, yy)) {
                                    can = false;
                                }
                            }
                            if (getAt(LAYER1, xx, yy) === elementsList.HOLE && !isOutOf(fx, fy) && (getAt(LAYER1, fx, fy) === elementsList.HOLE || isBarrier(fx, fy))) {
                                can = false;
                            }
                            comeRound(xx, yy, (zx, zy) => {
                                if (isZombieAt(zx, zy)) {
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
        /**
         * @type {Point[]}
         */
        var path = [];
        path.push(point);
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

    var boardAsString = function (layer) {
        var result = "";
        for (var i = 0; i <= size - 1; i++) {
            result += layersString[layer].substring(i * size, (i + 1) * size);
            result += "\n";
        }
        return result;
    };

    var getMe = function () {
        return pt(heroPosition.x, heroPosition.y);
    }

    var setCharAt = function (str, index, replacement) {
        return str.substr(0, index) + replacement + str.substr(index + replacement.length);
    }

    var maskOverlay = function (source, mask) {
        var result = source;
        for (var i = 0; i < result.length; ++i) {
            var el = elementsList.getElement(mask[i]);
            if (elementsList.isWall(el)) {
                result = setCharAt(result, i, el.char);
            }
        }

        return result.toString();
    }

    var toString = function () {
        var temp = '0123456789012345678901234567890';

        var result = '';

        var layer1 = boardAsString(LAYER1).split('\n').slice(0, -1);
        var layer2 = boardAsString(LAYER2).split('\n').slice(0, -1);
        var layer3 = boardAsString(LAYER3).split('\n').slice(0, -1);

        var numbers = temp.substring(0, layer1.length);
        var space = ''.padStart(layer1.length - 5);
        var numbersLine = numbers + '   ' + numbers + '   ' + numbers;
        var firstPart = ' Layer1 ' + space + ' Layer2' + space + ' Layer3' + '\n  ' + numbersLine;

        for (var i = 0; i < layer1.length; ++i) {
            var ii = size - 1 - i;
            var index = (ii < 10 ? ' ' : '') + ii;
            result += index + layer1[i] +
                ' ' + index + maskOverlay(layer2[i], layer1[i]) +
                ' ' + index + maskOverlay(layer3[i], layer1[i]);

            switch (i) {
                case 0:
                    result += ' Robots: ' + getMe() + ',' + printArray(getOtherHeroes());
                    break;
                case 1:
                    result += ' Gold: ' + printArray(getGold());
                    break;
                case 2:
                    result += ' Starts: ' + printArray(getStarts());
                    break;
                case 3:
                    result += ' Exits: ' + printArray(getExits());
                    break;
                case 4:
                    result += ' Boxes: ' + printArray(getBoxes());
                    break;
                case 5:
                    result += ' Holes: ' + printArray(getHoles());
                    break;
                case 6:
                    result += ' LaserMachine: ' + printArray(getLaserMachines());
                    break;
                case 7:
                    result += ' Lasers: ' + printArray(getLasers());
                    break;
                case 8:
                    result += ' Zombies: ' + printArray(getZombies());
                    break;
                case 9:
                    result += ' Perks: ' + printArray(getPerks());
                    break;
            }

            if (i != layer1.length - 1) {
                result += '\n';
            }
        }

        return firstPart + '\n' + result + '\n  ' + numbersLine + '\n' + JSON.stringify(scannerOffset, null, '  ');
    };

    /**
     *
     * @param {Point} from
     * @param {Point} to
     */
    function hasClearPath(from, to) {
        let count = 100;
        let pos = from;
        /**
         * @type {Direction}
         */
        const dir = Direction.where(from, to);

        while (count--) {
            const el = getAt(LAYER1, pos.x, pos.y)
            const el2 = getAt(LAYER2, pos.x, pos.y)
            pos = dir.change(pos);
            if (pos.isBad(size) || el2 === elementsList.BOX) {
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

    return {
        hasClearPath,
        size: function () {
            return size;
        },
        getMe: getMe,
        isLevelFinished: function () {
            return levelFinished;
        },
        getOtherHeroes: getOtherHeroes,
        getLaserMachines: getLaserMachines,
        getLasers: getLasers,
        getWalls: getWalls,
        getBoxes: getBoxes,
        getGold: getGold,
        getStarts: getStarts,
        getZombies: getZombies,
        getZombieStart: getZombieStart,
        getPerks: getPerks,
        getExits: getExits,
        getHoles: getHoles,
        isMeAlive: isMeAlive,
        isAt: isAt,
        getAt: getAt,
        get: get,
        toString: toString,
        layer1: function () {
            return boardAsString(LAYER1)
        },
        layer2: function () {
            return boardAsString(LAYER2)
        },
        layer3: function () {
            return boardAsString(LAYER3)
        },
        getWholeBoard,
        getBarriers,
        isAnyOfAt,
        isNear,
        isBarrierAt,
        countNear,
        getShortestWay,
        getScannerOffset: function () {
            return pt(scannerOffset.x, scannerOffset.y);
        }
    };
};


export default Board;
