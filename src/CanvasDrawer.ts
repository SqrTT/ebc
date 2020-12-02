import Board from "./Board";
import Element from './Element';

const actorHeight = [
    '☺',
    'o',
    '*',
    '☻',
    'X',
    'x',
    '^',
    '&',
    '♀',
    '♂',
    '✝'
]
const baseUrl = 'https://epam-botchallenge.com/codenjoy-contest/resources/sprite/icancode/robot/';
const elementsMap = {
    '.': 'floor.png',
    '-': 'floor.png',
    '☺': 'robo.png',
    'o': 'robo_falling.png',
    '*': 'robo_flying.png',
    '☻': 'robo_laser.png',
    'X': 'robo_other.png',
    'x': 'robo_other_falling.png',
    '^': 'robo_other_flying.png',
    '&': 'robo_other_laser.png',
    'S': 'start.png',
    '♀': 'male_zombie.png',
    '♂': 'female_zombie.png',
    '✝': 'zombie_die.png',
    'O': 'hole.png',
    'E': 'exit.png',
    'B': 'box.png',
    '$': 'gold.png',
    'Z': 'zombie_start.png',
    'l': 'unstoppable_laser_perk.png',
    'r': 'death_ray_perk.png',
    'f': 'unlimited_fire_perk.png',
    '←': 'laser_left.png',
    '→': 'laser_right.png',
    '↑': 'laser_up.png',
    '↓': 'laser_down.png',
    '═': 'wall_front.png',
    '│': 'wall_right.png',
    '─': 'wall_back.png',
    '║': 'wall_left.png',
    '╔': 'angle_in_left.png',
    '┐': 'angle_in_right.png',
    '┘': 'angle_back_right.png',
    '└': 'angle_back_left.png',
    '┌': 'wall_back_angle_left.png',
    '╗': 'wall_back_angle_right.png',
    '╝': 'angle_out_right.png',
    '╚': 'angle_out_left.png',

    '˂': 'laser_machine_charging_left.png',
    '˃': 'laser_machine_charging_right.png',
    '˄': 'laser_machine_charging_up.png',
    '˅': 'laser_machine_charging_down.png',
    '◄': 'laser_machine_ready_left.png',
    '►': 'laser_machine_ready_right.png',
    '▲': 'laser_machine_ready_up.png',
    '▼': 'laser_machine_ready_down.png',
}

function drawTextBG(ctx: CanvasRenderingContext2D, txt: string | number, font: string, x: number, y: number) {

    /// lets save current state as we make a lot of changes
    ctx.save();

    /// set font
    ctx.font = font;

    /// draw text from top - makes life easier at the moment
    ctx.textBaseline = 'top';

    /// color for background
    ctx.fillStyle = '#fff';

    /// get width of text
    var width = ctx.measureText(txt.toString()).width;

    /// draw background rect assuming height of font
    ctx.fillRect(x, y, width, parseInt(font, 10));

    /// text color
    ctx.fillStyle = '#000';

    /// draw text on top
    ctx.fillText(txt.toString(), x, y);

    /// restore original state
    ctx.restore();
}
export class CanvasDrawer {
    renderNumbers(distances: number[][]) {
        for (var x = 0; x < this.tilesCount; x++) {
            for (var y = 0; y < this.tilesCount; y++) {
                if (distances[x][y] && distances[x][y] > -1e4 && distances[x][y] < 1e5) {
                    this.drawText(x, y, distances[x][y]);
                }
            }
        }
    }
    drawText(x: number, y: number, text: string | number) {
        const ctx = this.el.getContext("2d");

        if (ctx) {
            drawTextBG(ctx,
                text,
                '10px',
                x * this.tileSize + (this.tileSize / String(text).length) - this.tileSize / 2,
                (this.tilesCount - 1 - y) * this.tileSize + this.tileSize / 2
            );
        }
    }
    tileSize: number;
    tilesCount: number;
    el: HTMLCanvasElement;
    images: Map<keyof typeof elementsMap, CanvasImageSource>;
    drawImage(elType: keyof typeof elementsMap, x: number, y: number, dx = 0, dy = 0) {
        const ctx = this.el.getContext("2d");
        const image = this.images.get(elType);
        if (ctx && image) {
            const xSize = actorHeight.includes(elType);
            ctx.drawImage(
                image,
                x * this.tileSize + dx,
                (this.tilesCount - 1 - y) * this.tileSize + dy - (xSize ? this.tileSize : 0),
                this.tileSize,
                xSize ? this.tileSize * 2 : this.tileSize
            );
        }
    }
    constructor(elementID: string) {
        const el = document.getElementById(elementID) as HTMLCanvasElement;
        if (!el) {
            throw new Error('No canvas element found');
        }
        this.el = el;
        this.tileSize = 30;
        this.tilesCount = 20;
        this.images = new Map<keyof typeof elementsMap, CanvasImageSource>();
        el.style.width = this.tileSize * this.tilesCount + 'px';
        el.style.height = this.tileSize * this.tilesCount + 'px';
        this.loadSpriteImages()

        el.width = this.tileSize * this.tilesCount;
        el.height = this.tileSize * this.tilesCount;
    }
    clear() {
        const ctx = this.el.getContext("2d");
        if (ctx) {
            ctx.resetTransform();
            ctx.clearRect(0, 0, this.el.width, this.el.height);
        }
    }
    renderBoard(layers: string[]) {
        // this.clear();

        layers.forEach(layer => {
            for (var x = 0; x < this.tilesCount; x++) {
                for (var y = 0; y < this.tilesCount; y++) {
                    const char = layer.charAt((this.tilesCount - 1 - y) * this.tilesCount + x) as keyof typeof elementsMap;
                    if (char !== '-') {
                        this.drawImage(char, x, y, 0, 0);
                    }
                }
            }
        });

    }
    renderStaticBorders(borders: boolean[][]) {
        for (var x = 0; x < this.tilesCount; x++) {
            for (var y = 0; y < this.tilesCount; y++) {
                if (borders[x][y]) {
                    this.drawRec(x, y);
                }
            }
        }
    }
    drawRec(x: number, y: number, color = 'blue') {
        const ctx = this.el.getContext("2d");

        if (ctx) {
            /// lets save current state as we make a lot of changes
            ctx.save();
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.4;
            ctx.fillRect(x * this.tileSize, (this.tilesCount - 1 - y) * this.tileSize, this.tileSize, this.tileSize);
            ctx.globalAlpha = 1.0;

            /// restore original state
            ctx.restore();
        }
    }
    loadSpriteImages(onImageLoad = () => { }) {
        Object.keys(elementsMap).forEach(key => {
            var image = new Image();
            image.onload = () => {
                if (elementsMap[key]) {
                    this.images.set(key as keyof typeof elementsMap, image);
                }
                onImageLoad();
            };
            image.src = baseUrl + elementsMap[key];
        })
    }
}
