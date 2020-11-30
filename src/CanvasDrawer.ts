import Board from "./Board";
import Element from './Element';

export class CanvasDrawer {
    el: HTMLElement;
    constructor(elementID: string) {
        const el = document.getElementById(elementID);
        if (!el) {
            throw new Error('No canvas element found');
        }

    }
    renderBoard(board: typeof Board) {

    }
    loadSpriteImages(elements, alphabet, onImageLoad) {
        // https://epam-botchallenge.com/codenjoy-contest/resources/sprite/icancode/robot/floor.png
        for (var index in elements) {
            var ch = alphabet[index];
            var color = elements[index];



            var image = new Image();
            image.onload = function () {
                if (plotSize == 0) {
                    plotSize = this.width;
                    canvasSize = plotSize * boardSize;
                    if (!!onImageLoad) {
                        onImageLoad();
                    }
                }
            };
            image.src = plotsUrls[color];
            images[color] = image;
        }
    }
}
