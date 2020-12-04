// @ts-check

import connectionEnv from '../env';
import WSocket from './ws';
import elementsList from './Element';
import Board, { LengthToXY } from './Board'
import DirectionList from './Direction';
import Command from './Command';
import Game, { ServerState } from './Game';
import { CanvasDrawer } from './CanvasDrawer';

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
const cumulativeLevel1 = [["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"], ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"], ["#", "#", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", "#", "#", "#", "#"], ["#", "#", " ", "╔", "═", "═", "═", "═", "┐", " ", " ", " ", " ", " ", " ", "╔", "═", "═", "═", "═", "═", "═", "═", "═", "═", "┐", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", "#", "#", "#", "#"], [" ", " ", " ", "║", ".", ".", ".", "˅", "│", " ", " ", " ", " ", " ", " ", "║", "˃", ".", ".", ".", ".", ".", ".", ".", ".", "│", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", "#", "#", "#", "#"], [" ", " ", " ", "║", ".", ".", ".", "O", "│", " ", " ", " ", " ", " ", " ", "║", ".", ".", ".", ".", "Z", ".", ".", ".", ".", "│", " ", "╔", "═", "═", "═", "═", "═", "═", "┐", " ", "#", "#", "#", "#"], [" ", " ", " ", "║", ".", ".", ".", ".", "│", " ", " ", " ", " ", " ", " ", "║", ".", ".", ".", ".", ".", ".", ".", ".", ".", "│", " ", "║", "˃", ".", "O", ".", ".", "O", "│", " ", "#", "#", "#", "#"], [" ", " ", " ", "║", ".", ".", "S", ".", "│", " ", " ", "╔", "═", "═", "═", "╝", "˃", ".", ".", ".", ".", ".", ".", ".", "O", "│", " ", "║", ".", ".", ".", ".", ".", ".", "│", " ", " ", " ", "#", "#"], [" ", " ", " ", "║", "˃", ".", ".", ".", "╚", "═", "═", "╝", ".", ".", ".", "$", ".", ".", "O", ".", ".", "S", ".", ".", ".", "│", " ", "║", "O", ".", "S", ".", "O", "˂", "│", " ", " ", " ", "#", "#"], [" ", " ", " ", "║", ".", ".", ".", ".", ".", "S", ".", ".", ".", "┌", "─", "╗", ".", ".", ".", ".", ".", ".", ".", "O", "O", "│", " ", "║", "O", ".", ".", ".", ".", ".", "│", " ", " ", " ", "#", "#"], [" ", " ", " ", "║", ".", ".", ".", ".", "┌", "─", "─", "─", "─", "┘", " ", "║", ".", "O", ".", ".", ".", ".", ".", ".", ".", "│", " ", "║", ".", ".", "┌", "─", "─", "─", "┘", " ", " ", " ", "#", "#"], [" ", " ", " ", "║", ".", ".", ".", "O", "│", " ", " ", " ", " ", " ", " ", "║", ".", ".", ".", ".", ".", ".", ".", ".", ".", "╚", "═", "╝", ".", ".", "│", " ", " ", " ", " ", " ", " ", " ", "#", "#"], [" ", " ", " ", "└", "╗", ".", "┌", "─", "┘", " ", "╔", "═", "═", "═", "═", "╝", ".", ".", ".", "O", "O", ".", ".", ".", ".", ".", ".", ".", ".", ".", "│", " ", " ", " ", " ", " ", " ", " ", "#", "#"], [" ", " ", " ", " ", "║", ".", "│", " ", " ", " ", "║", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", "│", " ", " ", " ", " ", " ", " ", " ", "#", "#"], [" ", " ", " ", " ", "║", ".", "│", " ", " ", " ", "║", ".", "S", ".", "┌", "─", "╗", ".", ".", ".", "┌", "─", "─", "─", "─", "─", "╗", ".", ".", ".", "╚", "═", "┐", " ", " ", " ", " ", " ", "#", "#"], [" ", " ", " ", " ", "║", ".", "│", " ", " ", " ", "║", ".", ".", ".", "│", " ", "║", ".", ".", ".", "│", " ", " ", " ", " ", " ", "║", "O", ".", ".", ".", ".", "│", " ", " ", " ", " ", " ", "#", "#"], [" ", " ", " ", " ", "║", ".", "│", " ", " ", " ", "└", "─", "─", "─", "┘", " ", "║", ".", ".", ".", "│", " ", " ", " ", " ", " ", "║", "$", ".", ".", ".", "˂", "│", " ", " ", " ", " ", " ", "#", "#"], [" ", " ", " ", "╔", "╝", ".", "╚", "═", "┐", " ", " ", " ", " ", " ", " ", " ", "║", ".", ".", ".", "│", " ", " ", "╔", "═", "═", "╝", ".", "Z", ".", ".", ".", "│", " ", " ", " ", " ", " ", "#", "#"], [" ", " ", " ", "║", ".", ".", ".", ".", "│", " ", " ", "╔", "═", "═", "═", "═", "╝", ".", ".", ".", "│", " ", " ", "║", ".", ".", ".", ".", ".", "O", ".", ".", "│", " ", " ", " ", " ", " ", "#", "#"], [" ", " ", " ", "║", ".", ".", ".", ".", "│", " ", " ", "║", ".", ".", ".", ".", ".", ".", ".", ".", "╚", "═", "═", "╝", "$", ".", ".", ".", ".", "$", "S", ".", "│", " ", " ", " ", " ", " ", "#", "#"], [" ", " ", " ", "║", "O", ".", "Z", ".", "╚", "═", "═", "╝", "O", ".", "S", ".", "O", ".", "$", ".", ".", ".", ".", "$", ".", "┌", "─", "─", "─", "─", "╗", ".", "│", " ", " ", " ", " ", " ", "#", "#"], [" ", " ", " ", "║", ".", ".", "O", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", "O", "┌", "─", "─", "─", "─", "┘", " ", " ", " ", " ", "║", "$", "╚", "═", "═", "═", "┐", " ", "#", "#"], [" ", " ", " ", "║", "˄", ".", ".", ".", "┌", "─", "─", "╗", ".", "O", ".", ".", "$", ".", ".", ".", "│", " ", " ", " ", " ", " ", " ", " ", "╔", "═", "╝", ".", ".", ".", "$", "S", "│", " ", "#", "#"], [" ", " ", " ", "║", ".", ".", ".", ".", "│", " ", " ", "║", ".", ".", ".", ".", ".", ".", ".", "▲", "│", " ", " ", "╔", "═", "═", "═", "═", "╝", "►", ".", ".", "$", ".", ".", ".", "│", " ", "#", "#"], [" ", " ", " ", "└", "─", "╗", ".", "┌", "┘", " ", " ", "║", "˃", ".", ".", "O", ".", ".", ".", "O", "│", " ", " ", "║", "˃", "Z", ".", ".", ".", ".", ".", ".", ".", "Z", ".", ".", "│", " ", "#", "#"], [" ", " ", " ", " ", " ", "║", ".", "│", " ", " ", " ", "└", "─", "─", "─", "╗", ".", "┌", "─", "─", "┘", " ", " ", "└", "─", "─", "─", "─", "╗", "˃", ".", "Z", ".", ".", ".", ".", "│", " ", "#", "#"], [" ", "╔", "═", "═", "═", "╝", ".", "╚", "═", "┐", " ", " ", " ", " ", " ", "║", ".", "│", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", "└", "─", "─", "─", "╗", ".", ".", "O", "│", " ", "#", "#"], [" ", "║", ".", ".", "O", ".", ".", ".", "˂", "│", " ", " ", "╔", "═", "═", "╝", ".", "╚", "═", "═", "═", "═", "═", "═", "═", "═", "┐", " ", " ", " ", " ", " ", "║", ".", "O", ".", "│", " ", "#", "#"], [" ", "║", ".", ".", "Z", ".", "O", ".", ".", "│", " ", " ", "║", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", "│", " ", " ", " ", " ", " ", "║", "O", ".", ".", "│", " ", "#", "#"], [" ", "║", ".", "┌", "─", "─", "─", "─", "─", "┘", " ", " ", "║", ".", "┌", "─", "─", "─", "╗", ".", ".", ".", ".", ".", ".", ".", "╚", "═", "═", "═", "═", "═", "╝", ".", "┌", "─", "┘", " ", "#", "#"], [" ", "║", ".", "│", " ", " ", " ", " ", " ", " ", " ", " ", "║", ".", "│", " ", " ", " ", "║", ".", ".", ".", ".", "O", ".", ".", ".", ".", "Z", ".", ".", "Z", ".", ".", "│", " ", " ", " ", "#", "#"], [" ", "║", ".", "│", " ", "╔", "═", "═", "═", "═", "═", "═", "╝", ".", "╚", "┐", " ", " ", "║", "┌", "─", "╗", ".", ".", ".", ".", "┌", "─", "─", "─", "╗", ".", ".", "┌", "┘", " ", " ", " ", "#", "#"], [" ", "║", ".", "│", " ", "║", ".", "$", ".", "Z", ".", "˂", ".", ".", "$", "╚", "═", "═", "╝", "│", " ", "└", "─", "╗", ".", "┌", "┘", " ", " ", " ", "║", ".", ".", "│", " ", " ", " ", " ", "#", "#"], [" ", "║", ".", "│", " ", "║", ".", ".", "O", ".", ".", ".", ".", "O", ".", ".", ".", ".", ".", "│", " ", " ", " ", "║", ".", "│", " ", " ", " ", " ", "║", ".", ".", "╚", "═", "═", "┐", " ", "#", "#"], [" ", "║", ".", "╚", "═", "╝", ".", ".", "O", ".", ".", "E", ".", ".", ".", "┌", "─", "╗", ".", "╚", "═", "═", "═", "╝", ".", "╚", "═", "═", "┐", " ", "║", ".", ".", ".", ".", ".", "│", " ", "#", "#"], [" ", "║", ".", ".", ".", ".", ".", ".", "O", ".", "Z", "O", ".", ".", ".", "│", " ", "║", "$", ".", ".", "˃", ".", ".", ".", "O", ".", ".", "│", " ", "║", ".", ".", ".", ".", "˂", "│", " ", "#", "#"], [" ", "║", ".", "┌", "─", "─", "─", "╗", ".", ".", ".", ".", ".", ".", ".", "│", " ", "║", ".", ".", ".", ".", ".", ".", "E", ".", ".", ".", "│", " ", "║", "$", ".", "E", ".", ".", "│", " ", "#", "#"], [" ", "║", "˄", "│", " ", " ", " ", "║", ".", ".", ".", ".", ".", ".", "˂", "│", " ", "└", "─", "─", "╗", ".", ".", "O", ".", ".", "O", ".", "│", " ", "║", "˃", ".", ".", ".", ".", "│", " ", "#", "#"], [" ", "└", "─", "┘", " ", " ", " ", "║", ".", "Z", ".", ".", ".", ".", ".", "│", " ", " ", " ", " ", "└", "─", "─", "─", "─", "─", "─", "─", "┘", " ", "║", ".", "Z", ".", ".", ".", "│", " ", "#", "#"], [" ", " ", " ", " ", " ", " ", " ", "└", "─", "─", "─", "─", "─", "─", "─", "┘", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", "└", "─", "─", "─", "─", "─", "┘", " ", "#", "#"]];

// window.getCumulativeLevel = () => {
//     return cumulativeLevel1;
// }


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
const currentGame = new Game()
let renderDone = true;
var processBoard = function (boardString: string) {
    const boardJson = JSON.parse(boardString.replace('board=', '')) as ServerState;
    const size = Math.sqrt(boardJson.layers[0].length);
    var xyl = new LengthToXY(size);

    const level2Board = makeArray(bigBoardSize, bigBoardSize, '-');
    const level3Board = makeArray(bigBoardSize, bigBoardSize, '-');

    const layer1Orig = chunkArray(boardJson.layers[0].split(''), size);
    const layer2Orig = chunkArray(boardJson.layers[1].split(''), size);
    const layer3Orig = chunkArray(boardJson.layers[2].split(''), size);

    for (var x = 0; x < size; x++) {
        for (var y = 0; y < size; y++) {
            const offsetX = x + boardJson.offset.x;
            const offsetY = y + size - boardJson.offset.y;

            cumulativeLevel1[offsetY][offsetX] = layer1Orig[y][x];
            level2Board[offsetY][offsetX] = layer2Orig[y][x];
            level3Board[offsetY][offsetX] = layer3Orig[y][x];
        }
    }
    boardJson.layers[0] = cumulativeLevel1.map(l => l.join('')).join('');
    boardJson.layers[1] = level2Board.map(l => l.join('')).join('');
    boardJson.layers[2] = level3Board.map(l => l.join('')).join('');

    boardJson.heroPosition.x += boardJson.offset.x;
    boardJson.heroPosition.y = size - boardJson.heroPosition.y + size - boardJson.offset.y - 1;

    const time = Date.now();
    if (pressed[38]) {
        canvasDrawer.clear();
        canvasDrawer.renderBoard(boardJson.layers);
        return (pressed[16] ? 'ACT(2),' : '') + Command.go('UP');
    } else if (pressed[40]) {
        canvasDrawer.clear();
        canvasDrawer.renderBoard(boardJson.layers);
        return (pressed[16] ? 'ACT(2),' : '') + Command.go('DOWN');
    } else if (pressed[37]) {
        canvasDrawer.clear();
        canvasDrawer.renderBoard(boardJson.layers);
        return (pressed[16] ? 'ACT(2),' : '') + Command.go('LEFT');
    } else if (pressed[39]) {
            canvasDrawer.clear();
            canvasDrawer.renderBoard(boardJson.layers);
            return (pressed[16] ? 'ACT(2),' : '') + Command.go('RIGHT');
    } else {
        const [answer, distances] = currentGame.tick(boardJson);
        console.info(`${answer} tick: ${currentGame.currentTick}. time: ${Date.now() - time}`);

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





// /**
//  *
//  * @param {Point} from
//  * @param {Point} to
//  */
// function getDistance(from, to) {
//     var a = from.x - to.x;
//     var b = from.y - to.y;

//     return Math.sqrt(a * a + b * b);
// }

// class YourSolver {
//     /**
//      * @return next robot action
//      */
//     whatToDo(board: Board) {
//         tick++;
//         var hero = board.getMe();
//         var exit = board.getExits()[0];
//         /**
//          * @type {Point|undefined}
//          */
//         var shortGold;

//         const hotAround = board.getLasers().some(laser => {
//             var direction = laser.direction;
//             if (direction) {
//                 const dir = DirectionList.get(direction);
//                 if (dir) {
//                     var next = dir.change(laser);
//                     return next.equals(hero);
//                 }
//             }
//         })

//         if (!hotAround && fireTick + 2 <= tick) {
//             const enemies = board.getOtherHeroes().concat(board.getZombies())
//                 .map(goldPt => ({ pos: goldPt, distance: getDistance(hero, goldPt) }))
//                 .sort((a, b) => {
//                     return a.distance - b.distance;
//                 }).filter(a => board.hasClearPath(hero, a.pos));

//             const reachable = enemies.find(pt => hero.getX() === pt.pos.getX() || hero.getY() === pt.pos.getY());

//             if (reachable) {

//                 const dir = DirectionList.where(hero, reachable.pos);
//                 if (dir) {
//                     fireTick = tick;
//                     return Command.fire(dir);
//                 }
//             }
//         }


//         const distancesToGold = board.getGold().map(goldPt => board.getShortestWay(hero, goldPt)).sort((a, b) => {
//             return a.length - b.length;
//         }).filter(a => a.length && a.length < 4)

//         if (exit) {
//             const way = board.getShortestWay(hero, exit);

//             if (distancesToGold && distancesToGold[0] && distancesToGold[0].length < way.length) {
//                 shortGold = distancesToGold[0][1];
//             }

//             if (way && way[1]) {
//                 const nextStep = shortGold || way[1];
//                 const dir = DirectionList.where(hero, nextStep);

//                 if (dir) {
//                     if (board.getBoxes().concat(board.getHoles()).some(hole => nextStep.equals(hole))) {
//                         return Command.jump(dir);
//                     }
//                     return Command.go(dir);
//                 }
//             }
//         }

//         if (distancesToGold.length) {
//             const nearest = distancesToGold[0];
//             const nextStep = nearest[1];

//             const dir = DirectionList.where(hero, nextStep);

//             if (dir) {
//                 if (board.getBoxes().concat(board.getHoles()).some(hole => nextStep.equals(hole))) {
//                     return Command.jump(dir);
//                 }
//                 return Command.go(dir);
//             }
//         }

//         const enemiesPath = board.getOtherHeroes().concat(board.getZombies())
//             .map(goldPt => board.getShortestWay(hero, goldPt)).sort((a, b) => {
//                 return a.length - b.length;
//             }).filter(a => a.length > 2)

//         if (enemiesPath.length) {
//             const nearest = enemiesPath[0];
//             const nextStep = nearest[1];

//             if (nextStep) {
//                 const dir = DirectionList.where(hero, nextStep);

//                 if (dir) {
//                     if (board.getBoxes().concat(board.getHoles()).some(hole => nextStep.equals(hole))) {
//                         return Command.jump(dir);
//                     }
//                     return Command.go(dir);
//                 }
//             }

//         }

//         return Command.die();
//     }
// }
