export default class Point {
    constructor(public readonly  x : number, public readonly y : number) {}

    equals(o) {
        return o.getX() === this.x && o.getY() === this.y;
    }

    toString() {
        return '[' + this.x + ',' + this.y + ']';
    }

    isBad(boardSize) {
        return this.x >= boardSize || this.y >= boardSize || this.x < 0 || this.y < 0;
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }

    move(dx, dy) {
        return new Point(this.x + dx, this.y + dy);
    }
};
