// @ts-check

import connectionEnv from '../env';
import WSocket from './ws';
import elementsList from './Element';
import Board from './Board'
import Direction from './Direction';
import Command from './Command';
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
    console.log(string);
    if (!!printBoardOnTextArea) {
        printLogOnTextArea(string);
    }
};

const canvasDrawer = new CanvasDrawer('board-canvas');

var processBoard = function (boardString: string) {
    var boardJson = JSON.parse(boardString.replace('board=', ''));
    var board = new Board(boardJson);
    tick++;
    canvasDrawer.renderBoard(board);
    printBoardOnTextArea("Tick: " + tick + "\n" + board.toString());

    var logMessage = board + "\n\n";
    var answer = new YourSolver(board).whatToDo().toString();
    logMessage += "Tick: " + tick + " Answer: " + answer + "\n";
    logMessage += "---------------------------------------------------------------------------------------------------------\n";

    log(logMessage);


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





/**
 *
 * @param {Point} from
 * @param {Point} to
 */
function getDistance(from, to) {
    var a = from.x - to.x;
    var b = from.y - to.y;

    return Math.sqrt(a * a + b * b);
}

let fireTick = -Infinity;
/**
 *
 * @param {ReturnType<Board>} board
 */
var YourSolver = function (board) {

    return {
        /**
         * @return next robot action
         */
        whatToDo: function () {
            tick++;
            var hero = board.getMe();
            var exit = board.getExits()[0];
            /**
             * @type {Point|undefined}
             */
            var shortGold;

            if (fireTick + 3 <= tick) {
                const enemies = board.getOtherHeroes().concat(board.getZombies())
                    .map(goldPt => ({ pos: goldPt, distance: getDistance(hero, goldPt) }))
                    .sort((a, b) => {
                        return a.distance - b.distance;
                    }).filter(a => board.hasClearPath(hero, a.pos));

                const reachable = enemies.find(pt => hero.getX() === pt.pos.getX() || hero.getY() === pt.pos.getY());

                if (reachable) {

                    const dir = Direction.where(hero, reachable.pos);
                    if (dir) {
                        fireTick = tick;
                        return Command.fire(dir);
                    }
                }
            }


            const distancesToGold = board.getGold().map(goldPt => board.getShortestWay(hero, goldPt)).sort((a, b) => {
                return a.length - b.length;
            }).filter(a => a.length)

            if (exit) {

                const way = board.getShortestWay(hero, exit);

                if (distancesToGold && distancesToGold[0] && distancesToGold[0].length < way.length) {
                    shortGold = distancesToGold[0][1];
                }

                if (way && way[1]) {
                    const nextStep = shortGold || way[1];
                    const dir = Direction.where(hero, nextStep);

                    if (dir) {
                        if (board.getBoxes().concat(board.getHoles()).some(hole => nextStep.equals(hole))) {
                            return Command.jump(dir);
                        }
                        return Command.go(dir);
                    }
                }
            }

            if (distancesToGold.length) {
                const nearest = distancesToGold[0];
                const nextStep = nearest[1];

                const dir = Direction.where(hero, nextStep);

                if (dir) {
                    if (board.getBoxes().concat(board.getHoles()).some(hole => nextStep.equals(hole))) {
                        return Command.jump(dir);
                    }
                    return Command.go(dir);
                }
            }

            const enemiesPath = board.getOtherHeroes().concat(board.getZombies())
                .map(goldPt => board.getShortestWay(hero, goldPt)).sort((a, b) => {
                    return a.length - b.length;
                }).filter(a => a.length)

            if (enemiesPath.length) {
                const nearest = enemiesPath[0];
                const nextStep = nearest[1];

                if (nextStep) {
                    const dir = Direction.where(hero, nextStep);

                    if (dir) {
                        if (board.getBoxes().concat(board.getHoles()).some(hole => nextStep.equals(hole))) {
                            return Command.jump(dir);
                        }
                        return Command.go(dir);
                    }
                }

            }

            return Command.die();
        }
    };
};

