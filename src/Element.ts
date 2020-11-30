import Direction from './Direction'

var elements = [] as Element[];
var elementsTypes = [] as string[];
var elementsByChar = {};
var elementsByType = {};

export class Element {
    constructor(public readonly char: string, public readonly type: string, public readonly direction?: Direction) {
        elementsByChar[char] = this;

        if (!elementsByType[type]) {
            elementsByType[type] = [];
        }

        elementsByType[type].push(this);
        elements.push(this);

        if (!elementsTypes.includes(type)) {
            elementsTypes.push(type);
        }
    }
}

function el(char: string, type: string, direction?: Direction) {
    return new Element(char, type, direction);
}
const elementsList = {
    EMPTY: el('-', 'NONE'),
    FLOOR: el('.', 'NONE'),

    ANGLE_IN_LEFT: el('╔', 'WALL'),
    WALL_FRONT: el('═', 'WALL'),
    ANGLE_IN_RIGHT: el('┐', 'WALL'),
    WALL_RIGHT: el('│', 'WALL'),
    ANGLE_BACK_RIGHT: el('┘', 'WALL'),
    WALL_BACK: el('─', 'WALL'),
    ANGLE_BACK_LEFT: el('└', 'WALL'),
    WALL_LEFT: el('║', 'WALL'),
    WALL_BACK_ANGLE_LEFT: el('┌', 'WALL'),
    WALL_BACK_ANGLE_RIGHT: el('╗', 'WALL'),
    ANGLE_OUT_RIGHT: el('╝', 'WALL'),
    ANGLE_OUT_LEFT: el('╚', 'WALL'),
    SPACE: el(' ', 'WALL'),

    LASER_MACHINE_CHARGING_LEFT: el('˂', 'LASER_MACHINE', Direction.LEFT),
    LASER_MACHINE_CHARGING_RIGHT: el('˃', 'LASER_MACHINE', Direction.RIGHT),
    LASER_MACHINE_CHARGING_UP: el('˄', 'LASER_MACHINE', Direction.UP),
    LASER_MACHINE_CHARGING_DOWN: el('˅', 'LASER_MACHINE', Direction.DOWN),

    LASER_MACHINE_READY_LEFT: el('◄', 'LASER_MACHINE_READY', Direction.LEFT),
    LASER_MACHINE_READY_RIGHT: el('►', 'LASER_MACHINE_READY', Direction.RIGHT),
    LASER_MACHINE_READY_UP: el('▲', 'LASER_MACHINE_READY', Direction.UP),
    LASER_MACHINE_READY_DOWN: el('▼', 'LASER_MACHINE_READY', Direction.DOWN),

    START: el('S', 'START'),
    EXIT: el('E', 'EXIT'),
    HOLE: el('O', 'HOLE'),
    BOX: el('B', 'BOX'),
    ZOMBIE_START: el('Z', 'ZOMBIE_START'),
    GOLD: el('$', 'GOLD'),

    ROBOT: el('☺', 'MY_ROBOT'),
    ROBOT_FALLING: el('o', 'MY_ROBOT'),
    ROBOT_FLYING: el('*', 'MY_ROBOT'),
    ROBOT_LASER: el('☻', 'MY_ROBOT'),

    ROBOT_OTHER: el('X', 'OTHER_ROBOT'),
    ROBOT_OTHER_FALLING: el('x', 'OTHER_ROBOT'),
    ROBOT_OTHER_FLYING: el('^', 'OTHER_ROBOT'),
    ROBOT_OTHER_LASER: el('&', 'OTHER_ROBOT'),

    LASER_LEFT: el('←', 'LASER_LEFT', Direction.LEFT),
    LASER_RIGHT: el('→', 'LASER_RIGHT', Direction.RIGHT),
    LASER_UP: el('↑', 'LASER_UP', Direction.UP),
    LASER_DOWN: el('↓', 'LASER_DOWN', Direction.DOWN),

    FEMALE_ZOMBIE: el('♀', 'ZOMBIE'),
    MALE_ZOMBIE: el('♂', 'ZOMBIE'),
    ZOMBIE_DIE: el('✝', 'ZOMBIE_DIE'),

    UNSTOPPABLE_LASER_PERK: el('l', 'UNSTOPPABLE_LASER_PERK'),
    DEATH_RAY_PERK: el('r', 'DEATH_RAY_PERK'),
    UNLIMITED_FIRE_PERK: el('f', 'UNLIMITED_FIRE_PERK'),

    getElements: function () {
        return elements.slice(0);
    },

    getElement: function (char: string) {
        var el = elementsByChar[char] as Element;
        if (!el) {
            throw "Element not found for: " + char;
        }
        return el;
    },

    getElementsTypes: function () {
        var elements: string[] = [];
        elementsTypes.forEach(function (e) {
            if (Array.isArray(e)) {
                elements = elements.concat(e);
            } else {
                elements.push(e);
            }
        });

        var result : string[] = [];
        elements.forEach(function (e) {
            if (!result.includes(e)) {
                result.push(e);
            }
        });

        return result;
    },

    getElementsOfType: function (type) {
        return elementsByType[type];
    },

    isWall: function (element: Element) {
        return element.type == 'WALL';
    }
};

export default elementsList;
