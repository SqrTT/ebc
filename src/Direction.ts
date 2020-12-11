
import Point from './Point';

export class Direction {
    constructor(
        public readonly index: number,
        public readonly dx: number,
        public readonly dy: number,
        public readonly name: string,
        public readonly cost: number
    ) { }
    changeX(x: number) {
        return x + this.dx;
    }
    changeY(y) {
        return y + this.dy;
    }
    change(point: Point) {
        return new Point(this.changeX(point.getX()), this.changeY(point.getY()));
    }
    inverted() {
        switch (this) {
            case DirectionList.UP: return DirectionList.DOWN;
            case DirectionList.FIRE_UP: return DirectionList.FIRE_DOWN;
            case DirectionList.UP_JUMP: return DirectionList.DOWN_JUMP;
            case DirectionList.DOWN: return DirectionList.UP;
            case DirectionList.FIRE_DOWN: return DirectionList.FIRE_UP;
            case DirectionList.DOWN_JUMP: return DirectionList.UP_JUMP;
            case DirectionList.LEFT: return DirectionList.RIGHT;
            case DirectionList.FIRE_LEFT: return DirectionList.FIRE_RIGHT;
            case DirectionList.LEFT_JUMP: return DirectionList.RIGHT_JUMP;
            case DirectionList.RIGHT: return DirectionList.LEFT;
            case DirectionList.FIRE_RIGHT: return DirectionList.FIRE_LEFT;
            case DirectionList.RIGHT_JUMP: return DirectionList.LEFT_JUMP;
            case DirectionList.JUMP: return DirectionList.JUMP;
            default: return DirectionList.STOP;
        }
    }
    clockwise() {
        switch (this) {
            case DirectionList.UP: return DirectionList.LEFT;
            case DirectionList.LEFT: return DirectionList.DOWN;
            case DirectionList.DOWN: return DirectionList.RIGHT;
            case DirectionList.RIGHT: return DirectionList.UP;
            default: return DirectionList.STOP;
        }
    }

    contrClockwise() {
        switch (this) {
            case DirectionList.UP: return DirectionList.RIGHT;
            case DirectionList.RIGHT: return DirectionList.DOWN;
            case DirectionList.DOWN: return DirectionList.LEFT;
            case DirectionList.LEFT: return DirectionList.UP;
            default: return DirectionList.STOP;
        }
    }
    mirrorTopBottom() {
        switch (this) {
            case DirectionList.UP: return DirectionList.LEFT;
            case DirectionList.RIGHT: return DirectionList.DOWN;
            case DirectionList.DOWN: return DirectionList.RIGHT;
            case DirectionList.LEFT: return DirectionList.UP;
            default: return DirectionList.STOP;
        }
    }
    mirrorBottomTop() {
        switch (this) {
            case DirectionList.UP: return DirectionList.RIGHT;
            case DirectionList.RIGHT: return DirectionList.UP;
            case DirectionList.DOWN: return DirectionList.LEFT;
            case DirectionList.LEFT: return DirectionList.DOWN;
            default: return DirectionList.STOP;
        }
    }
    toString() {
        return this.name.toUpperCase();
    }
    getIndex() {
        return this.index;
    }
}


function D(index: number, dx: number, dy: number, name: string, cost = 1) {
    return new Direction(index, dx, dy, name, cost);
};

const directionJumpMap = new Map<Direction, Direction>();


class DirectionList {
    static UP = D(2, 0, -1, 'UP')
    static DOWN = D(3, 0, 1, 'DOWN')
    static LEFT = D(0, -1, 0, 'LEFT')
    static RIGHT = D(1, 1, 0, 'RIGHT')
    static UP_JUMP = D(10, 0, -2, 'ACT(1),UP', 2.0001)
    static DOWN_JUMP = D(11, 0, 2, 'ACT(1),DOWN', 2.0001)
    static LEFT_JUMP = D(12, -2, 0, 'ACT(1),LEFT', 2.0001)
    static RIGHT_JUMP = D(13, 2, 0, 'ACT(1),RIGHT', 2.0001)
    static JUMP = D(4, 0, 0, 'ACT(1)')            // jump
    static PULL = D(5, 0, 0, 'ACT(2)')            // pull box
    static FIRE = D(6, 0, 0, 'ACT(3)')            // fire
    static FIRE_UP = D(14, 0, 0, 'ACT(3),UP')            // fire
    static FIRE_DOWN = D(15, 0, 0, 'ACT(3),DOWN')            // fire
    static FIRE_LEFT = D(16, 0, 0, 'ACT(3),LEFT')            // fire
    static FIRE_RIGHT = D(17, 0, 0, 'ACT(3),RIGHT')            // fire
    static DIE = D(7, 0, 0, 'ACT(0)')            // die
    static STOP = D(8, 0, 0, '')                   // stay
    static get(direction: string) : Direction | null {

        direction = String(direction);
        direction = direction.toUpperCase();
        for (var name of ['UP', 'DOWN', 'LEFT', 'RIGHT']) {
            var d = DirectionList[name];
            if (typeof d == 'function') {
                continue;
            }
            if (direction == d.name) {
                return DirectionList[name];
            }
        }
        return null;
    }
    static jumpDirection(dir: Direction) {
        return directionJumpMap.get(dir) || DirectionList.STOP;

    }
    static values = function () {
        return [DirectionList.UP, DirectionList.DOWN, DirectionList.LEFT, DirectionList.RIGHT, DirectionList.JUMP, DirectionList.PULL, DirectionList.FIRE, DirectionList.DIE, DirectionList.STOP];
    }
    static valueOf = function (indexOrName) {
        var directions = DirectionList.values();
        for (var i in directions) {
            var direction = directions[i];
            if (direction.getIndex() == indexOrName || direction.toString() == indexOrName) {
                return direction;
            }
        }
        return DirectionList.STOP;
    }
    static where = function (from, to) {

        // UP :   0, 1, 'UP'),
        // DOWN : 0, -1, 'DOWN'),
        // LEFT : -1, 0, 'LEFT'),
        // RIGHT : 1, 0, 'RIGHT'),
        var dx = to.x - from.x;
        var dy = to.y - from.y;
        if (dx < 0) {
            return DirectionList.LEFT;
        } else if (dx > 0) {
            return DirectionList.RIGHT;
        } else if (dy > 0) {
            return DirectionList.DOWN;
        } else {
            return DirectionList.UP;
        }
    }
};

directionJumpMap.set(DirectionList.JUMP, DirectionList.JUMP);
directionJumpMap.set(DirectionList.LEFT_JUMP, DirectionList.LEFT);
directionJumpMap.set(DirectionList.RIGHT_JUMP, DirectionList.RIGHT);
directionJumpMap.set(DirectionList.UP_JUMP, DirectionList.UP);
directionJumpMap.set(DirectionList.DOWN_JUMP, DirectionList.DOWN);

export default DirectionList;
