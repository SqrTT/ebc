import { createDebuggerStatement } from 'typescript';
import Board, { calcDepth, range, Player } from './Board';
import Command from './Command';
import DirectionList, { Direction } from './Direction';
import elementsList from './Element';
import ElementsList, { Element } from './Element';
import Point from './Point';

const myRobotElements = ElementsList.getElementsOfType('MY_ROBOT').map(e => e.char);

function makeArray<T>(x: number, y: number, fillValue: T) {
    return (new Array<T>(x)).fill(fillValue)
        .map(() => (new Array<T>(y)).fill(fillValue));
}
enum GameState {
    WAIT,
    PLAY,
    DIED
};

const DEFAULT_OPTIONS = {
    roomSize: 5,
    roundWin: 25,
    goldValue: 10,
    playerKill: 10,
    zombieKill: 5,
    diePenalty: -5,
    // Частота випадання перків :  (50)
    perkAvailable: 10,
    parkEffect: 10,
    rayLength: 10,
    gunReload: 4
}
function getDistance(from: Point, to: Point) {
    var a = from.x - to.x;
    var b = from.y - to.y;

    return Math.sqrt(a * a + b * b);
}
export interface ServerState {
    heroPosition: {
        x: number,
        y: number
    },
    showName: boolean,
    offset: {
        x: number,
        y: number
    },
    levelFinished: boolean,
    layers: [string, string, string],
    levelProgress: {
        total: number,
        current: number,
        lastPassed: number
    }
}
declare global {
    interface Window {
        dieOnce: boolean | undefined
    }
}

const directionsAround = [DirectionList.UP, DirectionList.DOWN, DirectionList.LEFT, DirectionList.RIGHT];
class Game {
    players: Player[]
    currentTick: number
    state: GameState;
    readonly options: typeof DEFAULT_OPTIONS;
    distances?: number[][]
    firedAtTick: number;
    previousBoard: Board | undefined;
    goldAmountCollected: number = 0;
    constructor(options?: typeof DEFAULT_OPTIONS) {
        this.options = { ...DEFAULT_OPTIONS, ...options }
        this.state = GameState.WAIT;
        this.currentTick = 0;
        this.firedAtTick = -Infinity;
    }
    reset() {
        this.currentTick = 0;
        this.firedAtTick = -Infinity;
        this.goldAmountCollected = 0;
        this.players = [];
    }
    tick(boardJson: ServerState): [string, number[][] | undefined] {
        const playerEl = boardJson.layers[1].split('').concat(boardJson.layers[2].split('')).find(char => myRobotElements.includes(char))


        if (playerEl) {
            if (ElementsList.ROBOT_LASER.char === playerEl || ElementsList.ROBOT_FALLING.char === playerEl) {
                this.state = GameState.DIED;
                console.log('Died. Do nothing');
                return [Command.doNothing(), undefined];
            } else {
                if (this.state !== GameState.PLAY) {
                    this.state = GameState.PLAY;
                    this.reset();
                }
                if (window.dieOnce) {
                    window.dieOnce = false;
                    return [Command.die(), undefined];
                }
                this.currentTick++;
                const currentBoard = new Board(boardJson);
                if (currentBoard.getExits().some(exit => exit.equals(currentBoard.getMe())) && !currentBoard.get(2, [elementsList.ROBOT_FLYING]).length) {
                    this.reset();
                    return [Command.doNothing(), undefined];
                }
                const step = this.move(currentBoard);
                this.previousBoard = currentBoard;
                return step;
            }
        } else {
            this.state = GameState.WAIT;
            console.log('No Player?. Do nothing');

            return [Command.doNothing(), undefined];
        }
    }
    checkCollected(board: Board) {
        if (this.previousBoard) {
            const me = board.getMe();
            const el = this.previousBoard.getAt(0, me.x, me.y);

            if (el === elementsList.GOLD) {
                this.goldAmountCollected++;
                console.info('Gold collected');
            }
        }
    }
    move(board: Board): [string, number[][] | undefined] {
        this.checkCollected(board);
        this.trackPlayers(board);

        const me = board.getMe();
        const scores = makeArray(board.size, board.size, 0);

        const haveAmmo = this.currentTick >= this.firedAtTick + this.options.gunReload;

        const isSafe = this.noLasersAround(me, board)
            && this.noZombieAround(board)
            && this.noOtherPlayersAround(board)
            && this.noLasersOnPreviousStep(me);

        if (isSafe && haveAmmo) {
            const enemies = board.getOtherLiveHeroes().concat(board.getLiveZombies())
                .map(goldPt => ({ pos: goldPt, distance: getDistance(me, goldPt) }))
                .sort((a, b) => {
                    return a.distance - b.distance;
                }).filter(a => board.hasClearPath(me, a.pos));

            const reachable = enemies.find(pt => board.getAt(2, pt.pos.x, pt.pos.y).char !== ElementsList.ROBOT_OTHER_FLYING.char && (me.getX() === pt.pos.getX() || me.getY() === pt.pos.getY()));

            if (reachable) {
                const dir = DirectionList.where(me, reachable.pos);
                if (dir) {
                    this.firedAtTick = this.currentTick;
                    return [Command.fire(dir), undefined];
                }
            }

            if (this.previousBoard) {
                const flyRobots = board.get(2, [ElementsList.ROBOT_OTHER_FLYING]);

                for (const flyRobot of flyRobots) {
                    const robot = this.previousBoard.getNear(1, flyRobot.x, flyRobot.y)
                        .find(r => r.el === ElementsList.ROBOT_OTHER);

                    if (robot) {
                        const nextR = robot.dir.inverted().change(flyRobot);
                        const nearMe = board.getNear(1, me.x, me.y).find(nearMe => nextR.equals(nearMe.pt));

                        if (nearMe) {
                            [Command.fire(nearMe), undefined];
                        }
                    }
                }
            }
        }

        if (!isSafe) {
            scores[me.y][me.x] = -100;
        }

        for (const wall of board.getWalls()) {
            scores[wall.y][wall.x] = - 1e9;
        }
        const exits = board.getExits();
        const golds = board.getGold();
        let existHaveGold = false;
        for (const exit of exits) {
            if (!golds.length) {
                scores[exit.y][exit.x] += this.options.roundWin;
            } else {
                const { distances } = board.bfs(exit.x, exit.y);
                const exitDistances = golds.map(gold => distances[gold.y][gold.x]).filter(goldDistance => goldDistance < 15);
                if (!exitDistances.length || this.goldAmountCollected > 20) {
                    scores[exit.y][exit.x] += this.options.roundWin + this.goldAmountCollected * 10;
                } else {
                    existHaveGold = true;
                    board.barriersMap[exit.y][exit.x] = true;
                }
            }
            //scores[gold.y][gold.x] += this.options.goldValue + this.options.roundWin * 7 / exitDistances[0];
        }
        if (!existHaveGold) {
            for (const exit of exits) {
                scores[exit.y][exit.x] += this.options.roundWin + this.goldAmountCollected * 10;
            }
        }
        for (const gold of golds) {
            scores[gold.y][gold.x] += this.options.goldValue;
        }

        for (const unvisited of board.getUnvisited()) {
            scores[unvisited.y][unvisited.x] += 30;
        }

        if (haveAmmo) {
            for (const zombie of board.getLiveZombies()) {
                for (const [blastX, blastY] of board.blasts(zombie.x, zombie.y)) {
                    scores[blastY][blastX] += this.options.zombieKill;
                };
            }
            for (const player of this.players) {
                for (const [blastX, blastY] of board.blasts(player.pt.x, player.pt.y)) {
                    scores[blastY][blastX] += player.isAfk ? this.options.playerKill : this.options.playerKill / 4;
                };
            }
        }

        for (const perk of board.getPerks()) {
            if (!me.equals(perk)) {
                scores[perk.y][perk.x] += 3;
            }
        }

        const { distances, parent } = board.bfs(undefined, undefined, this.players);

        let best = -1;
        let tx: number | undefined;
        let ty: number | undefined;
        let tt: number | undefined;
        for (var x = 0; x < board.size; x++) {
            for (var y = 0; y < board.size; y++) {
                if (scores[y][x] < 0) {
                    continue;
                }
                if (distances[y][x] < 0 || distances[y][x] > 1e8) {
                    continue
                }
                var sc = scores[y][x];
                var cur = sc / (distances[y][x] + 1);
                if (cur > best) {
                    best = cur
                    tx = x
                    ty = y
                }
            }
        }

        if (best < 0) {
            return [Command.die(), undefined];
        } else if (tx && ty) {
            // var ptx: number, pty: number;
            var pDir: Direction | undefined;

            let [Tx, Ty, Tt] = [tx, ty, tt];
            //[ptx, pty] = [tx, ty];
            while ((tx != me.x || ty != me.y) && ty && tx) {  // Looking for next point on the way to target
                // [ptx, pty] = [tx, ty];
                var pPoint = parent[ty][tx];
                if (pPoint) {
                    [tx, ty, tt, pDir] = pPoint;
                } else {
                    console.error('No track to object');
                    return [Command.die(), distances];
                }
            }

            console.log(`gold ${this.goldAmountCollected} ${pDir}`);


            if (pDir) {
                if ([
                    DirectionList.DOWN,
                    DirectionList.UP,
                    DirectionList.LEFT,
                    DirectionList.RIGHT
                ].includes(pDir) && board.isNear(1, me.x, me.y, [elementsList.BOX])) {
                    return [Command.pull(pDir), distances];
                }

                return [pDir.toString(), distances];
            }
        }
        return [Command.doNothing(), undefined];
    }
    trackPlayers(board: Board) {
        const tick = this.currentTick;
        const prevPlayers = this.players || [];

        this.players = board.getOtherLiveHeroes().map(her0 => {
            const player = new Player(her0);

            const playerStays = prevPlayers.find(pp => pp.pt.equals(her0));

            if (playerStays) {
                prevPlayers.splice(prevPlayers.indexOf(playerStays), 1);
                player.fireTick = playerStays.fireTick;
                player.moveTick = playerStays.moveTick;
                player.isAfk = player.moveTick + 3 < tick || player.fireTick + 2 < tick;
                directionsAround.some(dir => {
                    const elAtPos = board.getAt(1, dir.changeX(her0.x), dir.changeY(her0.y));
                    if ([ElementsList.LASER_DOWN, ElementsList.LASER_LEFT, ElementsList.LASER_UP, ElementsList.LASER_RIGHT].includes(elAtPos) && elAtPos.direction === dir) {
                        player.fireTick = tick;
                        player.isAfk = false;
                    }
                });
            } else {
                const prefPlayer = prevPlayers.find(pp => directionsAround.some(dir => dir.change(pp.pt).equals(her0)));
                player.moveTick = tick;
                player.isAfk = false;

                if (prefPlayer) {
                    prevPlayers.splice(prevPlayers.indexOf(prefPlayer), 1);
                    player.fireTick = prefPlayer.fireTick;
                } else {
                    player.fireTick = -Infinity;
                }
            }
            return player;
        });

        console.log(JSON.parse(JSON.stringify(this.players)));
    }
    noLasersOnPreviousStep(me: Point) {
        if (this.previousBoard) {
            return !this.previousBoard.getLasers().some(laser => {
                var direction = laser.direction;
                if (direction) {
                    const dir = DirectionList.get(direction);
                    if (dir) {
                        var next = dir.change(dir.change(laser));
                        return next.equals(me);
                    }
                }
            })
        }
        return true;
    }
    noLasersAround(me: Point, board: Board) {
        return !board.getLasers().some(laser => {
            var direction = laser.direction;
            if (direction) {
                const dir = DirectionList.get(direction);
                if (dir) {
                    var next = dir.change(laser);
                    return next.equals(me);
                } else {
                    console.error('laser without direction');
                }
            }
        })
    }
    noZombieAround(board: Board) {
        const me = board.getMe();
        return !board.isNear(1, me.x, me.y, [elementsList.MALE_ZOMBIE, elementsList.FEMALE_ZOMBIE])
    }
    noOtherPlayersAround(board: Board) {
        const me = board.getMe();
        return !directionsAround.some(dir => this.players.some(p => !p.isAfk && dir.change(me).equals(p.pt)))
    }
}


export default Game;
