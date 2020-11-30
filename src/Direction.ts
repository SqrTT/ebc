
import Point from './Point';

var D = function (index, dx, dy, name) {
    var changeX = function (x) {
        return x + dx;
    };

    var changeY = function (y) {
        return y + dy;
    };

    var change = function (point) {
        return new Point(changeX(point.getX()), changeY(point.getY()));
    };

    var inverted = function () {
        switch (this) {
            case Direction.UP: return Direction.DOWN;
            case Direction.DOWN: return Direction.UP;
            case Direction.LEFT: return Direction.RIGHT;
            case Direction.RIGHT: return Direction.LEFT;
            default: return Direction.STOP;
        }
    };

    var clockwise = function () {
        switch (this) {
            case Direction.UP: return Direction.LEFT;
            case Direction.LEFT: return Direction.DOWN;
            case Direction.DOWN: return Direction.RIGHT;
            case Direction.RIGHT: return Direction.UP;
            default: return Direction.STOP;
        }
    };

    var contrClockwise = function () {
        switch (this) {
            case Direction.UP: return Direction.RIGHT;
            case Direction.RIGHT: return Direction.DOWN;
            case Direction.DOWN: return Direction.LEFT;
            case Direction.LEFT: return Direction.UP;
            default: return Direction.STOP;
        }
    };

    var mirrorTopBottom = function () {
        switch (this) {
            case Direction.UP: return Direction.LEFT;
            case Direction.RIGHT: return Direction.DOWN;
            case Direction.DOWN: return Direction.RIGHT;
            case Direction.LEFT: return Direction.UP;
            default: return Direction.STOP;
        }
    };

    var mirrorBottomTop = function () {
        switch (this) {
            case Direction.UP: return Direction.RIGHT;
            case Direction.RIGHT: return Direction.UP;
            case Direction.DOWN: return Direction.LEFT;
            case Direction.LEFT: return Direction.DOWN;
            default: return Direction.STOP;
        }
    };

    var toString = function () {
        return name.toUpperCase();
    };

    var getIndex = function () {
        return index;
    }

    return {
        changeX: changeX,
        changeY: changeY,
        change: change,
        inverted: inverted,
        clockwise: clockwise,
        contrClockwise: contrClockwise,
        mirrorTopBottom: mirrorTopBottom,
        mirrorBottomTop: mirrorBottomTop,
        toString: toString,
        getIndex: getIndex
    };
};

class Direction {
    static UP = D(2, 0, 1, 'UP')
    static DOWN = D(3, 0, -1, 'DOWN')
    static LEFT = D(0, -1, 0, 'LEFT')
    static RIGHT = D(1, 1, 0, 'RIGHT')
    static JUMP = D(4, 0, 0, 'ACT(1)')            // jump
    static PULL = D(5, 0, 0, 'ACT(2)')            // pull box
    static FIRE = D(6, 0, 0, 'ACT(3)')            // fire
    static DIE = D(7, 0, 0, 'ACT(0)')            // die
    static STOP = D(8, 0, 0, '')                   // stay
    static get(direction) {
        if (typeof direction.getIndex == 'function') {
            return direction;
        }

        direction = String(direction);
        direction = direction.toUpperCase();
        for (var name in Direction) {
            var d = Direction[name];
            if (typeof d == 'function') {
                continue;
            }
            if (direction == d.name()) {
                return Direction[name];
            }
        }
        return null;
    }
    static values = function () {
        return [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT, Direction.JUMP, Direction.PULL, Direction.FIRE, Direction.DIE, Direction.STOP];
    }
    static valueOf = function (indexOrName) {
        var directions = Direction.values();
        for (var i in directions) {
            var direction = directions[i];
            if (direction.getIndex() == indexOrName || direction.toString() == indexOrName) {
                return direction;
            }
        }
        return Direction.STOP;
    }
    static where = function (from, to) {

        // UP :   0, 1, 'UP'),
        // DOWN : 0, -1, 'DOWN'),
        // LEFT : -1, 0, 'LEFT'),
        // RIGHT : 1, 0, 'RIGHT'),
        var dx = to.x - from.x;
        var dy = to.y - from.y;
        if (dx < 0) {
            return Direction.LEFT;
        } else if (dx > 0) {
            return Direction.RIGHT;
        } else if (dy < 0) {
            return Direction.DOWN;
        } else {
            return Direction.UP;
        }
    }
};


export default Direction;
