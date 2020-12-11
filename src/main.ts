// @ts-check

import connectionEnv from '../env';
import WSocket from './ws';
import Board from './Board'
import Command from './Command';
import Game, { ServerState } from './Game';
import { CanvasDrawer } from './CanvasDrawer';
import DirectionList, { Direction } from './Direction';
import Point from './Point';
import elementsList from './Element';

var tick = 0;


function printBoardOnTextArea(data: string) {
    var textarea = document.getElementById("board") as HTMLTextAreaElement | null;
    if (!textarea) return;
    var size = data.split('\n')[0].length;
    textarea.value = data;
}

var cache = [] as string[];

var printLogOnTextArea = function (data: string) {
    var textarea = document.getElementById("log-area") as HTMLTextAreaElement | null;
    var addToEnd = document.getElementById("add-to-end") as HTMLInputElement | null;
    if (!textarea || !addToEnd) return;
    if (addToEnd.checked) {
        cache.push(data);
        if (cache.length > 30) {
            cache.shift()
        }
    } else {
        cache.unshift(data);
        if (cache.length > 30) {
            cache.pop()
        }
    }

    var all = '';
    for (var i in cache) {
        var data = cache[i];
        all = all + "\n" + data;
    }
    textarea.value = all;
}

function makeArray<T>(x: number, y: number, fillValue: T) {
    return (new Array<T>(x)).fill(fillValue)
        .map(() => (new Array<T>(y)).fill(fillValue));
}

var log = function (string) {
    //console.log(string);
    if (!!printBoardOnTextArea) {
        printLogOnTextArea(string);
    }
};

function chunkArray<T>(myArray: T[], chunk_size: number) {
    var index = 0;
    var arrayLength = myArray.length;
    var tempArray: T[][] = [];

    for (index = 0; index < arrayLength; index += chunk_size) {
        var myChunk = myArray.slice(index, index + chunk_size);
        // Do something if you want with the group
        tempArray.push(myChunk);
    }

    return tempArray;
}

const bigBoardSize = 40;

const canvasDrawer = new CanvasDrawer('board-canvas', bigBoardSize);
// initial map
let cumulativeLevel1 = [["#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"],["#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"],[" "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#"],[" "," "," "," "," "," "," ","╔","═","═","═","═","═","═","═","┐"," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#"],[" ","╔","═","┐"," "," "," ","║",".","Z",".",".",".",".",".","│"," "," "," "," ","╔","═","═","═","═","═","═","═","┐"," "," "," "," "," "," "," ","#","#","#","#"],[" ","║","˅","│"," "," "," ","║",".",".",".",".",".",".","◄","│"," ","╔","═","═","╝",".",".","O",".",".","O",".","│"," ","║","˃",".",".",".",".","│"," ","#","#"],[" ","║","$","╚","═","═","═","╝",".",".",".",".",".",".",".","│"," ","║",".",".",".",".",".",".","E",".",".",".","│"," ","║",".",".","E","$",".","│"," ","#","#"],[" ","║",".",".",".",".",".",".","O",".","Z","O",".",".",".","│"," ","║",".",".",".","˃",".",".",".","O",".",".","│"," ","║",".",".",".",".","˂","│"," ","#","#"],[" ","║",".","┌","─","╗",".",".","O",".",".","E",".",".",".","╚","═","╝",".","┌","─","─","─","╗",".","┌","─","─","┘"," ","║",".",".",".",".","$","│"," ","#","#"],[" ","║",".","│"," ","║",".","$","O",".",".",".",".","O",".",".",".",".",".","│"," "," "," ","║",".","│"," "," "," "," ","║",".",".","┌","─","─","┘"," ","#","#"],[" ","║",".","│"," ","║",".",".",".","Z",".","◄",".",".",".","┌","─","─","╗","│"," ","╔","═","╝",".","╚","┐"," "," "," ","║",".",".","│"," "," "," "," ","#","#"],[" ","║",".","│"," ","└","─","─","─","─","─","─","╗",".","┌","┘"," "," ","║","╚","═","╝",".",".",".",".","╚","═","═","═","╝",".",".","╚","┐"," "," "," ","#","#"],[" ","║",".","│"," "," "," "," "," "," "," "," ","║",".","│"," "," "," ","║",".",".",".",".","O",".",".",".",".","Z",".",".","Z",".",".","│"," "," "," ","#","#"],[" ","║",".","╚","═","═","═","═","═","┐"," "," ","║",".","╚","═","═","═","╝",".",".","$",".",".",".",".","┌","─","─","─","─","─","╗",".","╚","═","┐"," ","#","#"],[" ","║",".",".","Z",".","O",".","$","│"," "," ","║",".",".",".",".",".",".",".",".",".",".",".",".",".","│"," "," "," "," "," ","║","O","$",".","│"," ","#","#"],[" ","║",".","$","O",".",".",".","˂","│"," "," ","└","─","─","╗",".","┌","─","─","─","─","─","─","─","─","┘"," "," "," "," "," ","║",".","O",".","│"," ","#","#"],[" ","└","─","─","─","╗",".","┌","─","┘"," "," "," "," "," ","║",".","│"," "," "," "," "," "," "," "," "," "," ","╔","═","═","═","╝",".",".","O","│"," ","#","#"],[" "," "," "," "," ","║",".","│"," "," "," ","╔","═","═","═","╝",".","╚","═","═","┐"," "," ","╔","═","═","═","═","╝","˃",".","Z",".",".",".",".","│"," ","#","#"],[" "," "," ","╔","═","╝",".","╚","┐"," "," ","║","˃","$",".","O",".",".",".","O","│"," "," ","║","˃","Z",".",".",".",".",".",".",".","Z",".",".","│"," ","#","#"],[" "," "," ","║",".",".",".",".","│"," "," ","║",".",".",".",".",".",".","$","˅","│"," "," ","└","─","─","─","─","╗","►",".",".",".",".",".",".","│"," ","#","#"],[" "," "," ","║","˅",".",".",".","╚","═","═","╝","$","O",".",".",".",".",".",".","│"," "," "," "," "," "," "," ","└","─","╗",".",".",".",".","S","│"," ","#","#"],[" "," "," ","║",".",".","O",".",".",".",".",".",".",".",".",".",".",".",".","O","╚","═","═","═","═","┐"," "," "," "," ","║",".","┌","─","─","─","┘"," ","#","#"],[" "," "," ","║","O",".","Z",".","┌","─","─","╗","O",".","S",".","O",".",".",".","$",".",".",".",".","╚","═","═","═","═","╝","$","│"," "," "," "," "," ","#","#"],[" "," "," ","║",".",".",".",".","│"," "," ","║",".",".",".",".",".",".","$","$","┌","─","─","╗","$",".",".",".",".","$","S","$","│"," "," "," "," "," ","#","#"],[" "," "," ","║",".",".",".",".","│"," "," ","└","─","─","─","─","╗",".",".",".","│"," "," ","║",".",".",".",".",".","O",".",".","│"," "," "," "," "," ","#","#"],[" "," "," ","└","╗",".","┌","─","┘"," "," "," "," "," "," "," ","║",".",".",".","│"," "," ","└","─","─","╗",".","Z",".",".",".","│"," "," "," ","│"," ","#","#"],[" ","╔"," "," ","║",".","│"," "," "," ","╔","═","═","═","┐"," ","║",".",".",".","│"," "," "," "," "," ","║",".",".",".",".","◄","│"," "," "," ","│"," ","#","#"],[" ","║"," "," ","║",".","│"," "," "," ","║","$",".",".","│"," ","║",".",".",".","│"," "," "," "," "," ","║","O",".",".",".",".","│"," "," "," ","│"," ","#","#"],[" ","║"," "," ","║",".","│"," "," "," ","║",".","S",".","╚","═","╝",".",".",".","╚","═","═","═","═","═","╝",".",".",".","┌","─","┘"," "," "," ","│"," ","#","#"],[" ","║"," "," ","║",".","│"," "," "," ","║",".",".",".",".",".",".",".",".",".",".",".",".",".",".",".",".",".",".",".","│"," "," "," "," "," ","┘"," ","#","#"],[" ","║"," ","╔","╝",".","╚","═","┐"," ","└","─","─","─","─","╗",".",".",".","O","O",".",".",".",".",".",".",".",".",".","│"," "," "," "," "," "," "," ","#","#"],[" ","║"," ","║",".",".",".","O","│"," "," "," "," "," "," ","║",".",".",".",".",".",".",".",".",".","┌","─","╗",".",".","│"," "," "," "," "," "," "," ","#","#"],[" ","║"," ","║",".",".",".",".","╚","═","═","═","═","┐"," ","║",".","O",".",".",".",".",".",".",".","│"," ","║",".",".","╚","═","═","═","┐"," "," "," ","#","#"],[" ","║"," ","║",".",".",".",".",".","S",".",".",".","╚","═","╝",".",".",".",".",".",".",".","O","O","│"," ","║","O",".","$","$","$",".","│"," ","┐"," ","#","#"],[" ","║"," ","║","˃",".",".",".","┌","─","─","╗",".",".",".",".",".",".","O",".",".","S",".",".",".","│"," ","║","O",".","S",".","O","◄","│"," ","│"," ","#","#"],[" ","║"," ","║",".",".","S",".","│"," "," ","└","─","─","─","╗","˃",".",".",".",".",".",".",".","O","│"," ","║",".",".",".",".",".",".","│"," ","│"," ","#","#"],[" ","║"," ","║",".",".",".",".","│"," "," "," "," "," "," ","║",".",".",".",".",".",".",".",".",".","│"," ","║","►",".","O",".",".","O","│"," ","│"," ","#","#"],[" ","║"," ","║",".",".",".","O","│"," "," "," "," "," "," ","║",".",".",".",".","Z",".",".",".",".","│"," ","└","─","─","─","─","─","─","┘"," ","│"," ","#","#"],[" ","└"," ","║",".",".",".","˄","│"," "," "," "," "," "," ","║","˃",".",".",".","$",".",".","$",".","│"," "," "," "," "," "," "," "," "," "," ","│"," ","#","#"],[" "," "," ","└","─","─","─","─","┘"," "," "," "," "," "," ","└","─","─","─","─","─","─"," "," "," "," "," "," "," "," ","└","─","─","─","─","─","┘"," ","#","#"]];

window.getCumulativeLevel = () => {
    return cumulativeLevel1;
}

var cumulativeLevel2 = makeArray(bigBoardSize, bigBoardSize, '#')


var pressed = {};
document.onkeydown = function (e) {
    e = e || window.event;
    pressed[e.keyCode] = true;
    e.preventDefault();
}

document.onkeyup = function (e) {
    e = e || window.event;
    delete pressed[e.keyCode];
    e.preventDefault();
}

function optionalJump(dir: Direction, x: number, y: number) {
    // const pos = dir.change(pt);
    if (pressed[18] && (cumulativeLevel1[dir.changeY(y)][dir.changeX(x)] === 'O' || cumulativeLevel2[dir.changeY(y)][dir.changeX(x)] === 'B')) {
        return [DirectionList.JUMP, dir].join(',');
    } else {
        return [dir].join(',');
    }
}
const currentGame = new Game()
let renderDone = true;

let prevBoard = '';

var processBoard = function (boardString: string) {
    const boardJson = JSON.parse(boardString.replace('board=', '')) as ServerState;
    const size = Math.sqrt(boardJson.layers[0].length);

    if (boardJson.levelProgress.current < 22) {
        cumulativeLevel1 = makeArray(bigBoardSize, bigBoardSize, '#');
    }

    if (boardString.includes('☻')) {
        console.error({prevBoard, boardString, currentGame: JSON.parse(JSON.stringify(currentGame))});
        prevBoard && console.error(new Board(JSON.parse(prevBoard.replace('board=', ''))).toString());
        //cumulativeLevel1 = makeArray(50, 50, '#')
    }
    prevBoard = boardString;

    //const level2Board = makeArray(bigBoardSize, bigBoardSize, '-');
    const level3Board = makeArray(bigBoardSize, bigBoardSize, '-');

    const layer1Orig = chunkArray(boardJson.layers[0].split(''), size);
    const layer2Orig = chunkArray(boardJson.layers[1].split(''), size);
    const layer3Orig = chunkArray(boardJson.layers[2].split(''), size);

    let heroX;
    let heroY;
    for (var x = 0; x < size; x++) {
        for (var y = 0; y < size; y++) {
            const offsetX = x + boardJson.offset.x;
            const offsetY = y + size - boardJson.offset.y;

            cumulativeLevel1[offsetY][offsetX] = layer1Orig[y][x];
            cumulativeLevel2[offsetY][offsetX] = layer2Orig[y][x];
            level3Board[offsetY][offsetX] = layer3Orig[y][x];
            if (cumulativeLevel2[offsetY][offsetX] === '☺') {
                heroX = offsetX;
                heroY = offsetY;
            }
            if (cumulativeLevel2[offsetY][offsetX] === '☻') {
                heroX = offsetX;
                heroY = offsetY;
            }
        }
    }
    boardJson.layers[0] = cumulativeLevel1.map(l => l.join('')).join('');
    boardJson.layers[1] = cumulativeLevel2.map(l => l.join('')).join('');
    boardJson.layers[2] = level3Board.map(l => l.join('')).join('');

    if (heroX && heroY) {
        cumulativeLevel2[heroY][heroX] = '-';
    }


    boardJson.heroPosition.x += boardJson.offset.x;
    boardJson.heroPosition.y = size - boardJson.heroPosition.y + size - boardJson.offset.y - 1;

    const time = Date.now();
    if (pressed[38]) {
        canvasDrawer.clear();
        canvasDrawer.renderBoard(boardJson.layers);
        return (pressed[16] ? 'ACT(2),' : '') + optionalJump(DirectionList.UP, boardJson.heroPosition.x, boardJson.heroPosition.y);
    } else if (pressed[40]) {
        canvasDrawer.clear();
        canvasDrawer.renderBoard(boardJson.layers);
        return (pressed[16] ? 'ACT(2),' : '') + optionalJump(DirectionList.DOWN, boardJson.heroPosition.x, boardJson.heroPosition.y);
    } else if (pressed[37]) {
        canvasDrawer.clear();
        canvasDrawer.renderBoard(boardJson.layers);
        return (pressed[16] ? 'ACT(2),' : '') + optionalJump(DirectionList.LEFT, boardJson.heroPosition.x, boardJson.heroPosition.y);
    } else if (pressed[39]) {
            canvasDrawer.clear();
            canvasDrawer.renderBoard(boardJson.layers);
            return (pressed[16] ? 'ACT(2),' : '') + optionalJump(DirectionList.RIGHT, boardJson.heroPosition.x, boardJson.heroPosition.y);
    } else {
        const [answer, distances] = currentGame.tick(boardJson);
        console.info(`-${answer}- tick: ${currentGame.currentTick}. time: ${Date.now() - time}`);

        if (renderDone) {
            renderDone = false;
            // requestAnimationFrame(() => {
            canvasDrawer.clear();
            canvasDrawer.renderBoard(boardJson.layers);
            //canvasDrawer.renderStaticBorders((new Board(boardJson)).barriersMap);

            if (distances) {
                canvasDrawer.renderNumbers(distances);
            }
            renderDone = true;
            //});
        }


        return answer;
    }
};

const connectionUrl = connectionEnv.url.replace("http", "ws").replace("board/player/", "ws?user=").replace("?code=", "&code=");


var ws;

function connect() {
    ws = WSocket(connectionUrl);
    log('Opening...');

    ws.on('open', function () {
        log('Web socket client opened ' + connectionUrl);
    });

    ws.on('close', function () {
        log('Web socket client closed');

        setTimeout(function () {
            connect();
        }, 5000);
    });

    ws.on('message', function (message) {
        var answer = processBoard(message);
        ws.send(answer);
    });
}

//if (typeof (doNotConnect) == 'undefined') {
connect();
//}

