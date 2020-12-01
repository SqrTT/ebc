// @ts-check

import connectionEnv from '../env';
import WSocket from './ws';
import elementsList from './Element';
import Board from './Board'
import DirectionList from './Direction';
import Command from './Command';
import Game from './Game';
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


var log = function (string) {
    //console.log(string);
    if (!!printBoardOnTextArea) {
        printLogOnTextArea(string);
    }
};

const canvasDrawer = new CanvasDrawer('board-canvas');

const currentGame = new Game()

var processBoard = function (boardString: string) {
    var boardJson = JSON.parse(boardString.replace('board=', ''));


    const time = Date.now();
    const answer = currentGame.tick(boardJson);
    console.info(`Tick: ${currentGame.currentTick}. Processing time: ${Date.now() - time}`);

    canvasDrawer.renderBoard(boardJson.layers);

    return answer;
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
