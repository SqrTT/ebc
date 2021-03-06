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

const potentialMovies = [
    DirectionList.JUMP,
    DirectionList.STOP,
    DirectionList.DOWN,
    DirectionList.DOWN_JUMP,
    DirectionList.UP_JUMP,
    DirectionList.UP,
    DirectionList.LEFT,
    DirectionList.LEFT_JUMP,
    DirectionList.RIGHT,
    DirectionList.RIGHT_JUMP,
    DirectionList.FIRE_UP,
    DirectionList.FIRE_DOWN,
    DirectionList.FIRE_LEFT,
    DirectionList.FIRE_RIGHT
];

const fireDirectionMap = new Map<Direction, Direction>();
fireDirectionMap.set(DirectionList.FIRE_UP, DirectionList.UP);
fireDirectionMap.set(DirectionList.FIRE_DOWN, DirectionList.DOWN);
fireDirectionMap.set(DirectionList.FIRE_LEFT, DirectionList.LEFT);
fireDirectionMap.set(DirectionList.FIRE_RIGHT, DirectionList.RIGHT);

const potentialZombieMovies = [
    DirectionList.STOP,
    DirectionList.DOWN,
    DirectionList.UP,
    DirectionList.LEFT,
    DirectionList.RIGHT
];

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
    gunReload: 3
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
    levelProgress?: {
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
const airMove = [
    DirectionList.JUMP,
    DirectionList.LEFT_JUMP,
    DirectionList.RIGHT_JUMP,
    DirectionList.DOWN_JUMP,
    DirectionList.UP_JUMP
]
class Game {
    players: Player[]
    currentTick: number
    state: GameState;
    readonly options: typeof DEFAULT_OPTIONS;
    distances?: number[][]
    firedAtTick: number;
    previousBoard: Board | undefined;
    goldAmountCollected: number = 0;
    level: number;
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
        this.level = boardJson?.levelProgress?.current || 0;

        if (window.dieOnce) {
            window.dieOnce = false;
            return [Command.die(), undefined];
        }
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

    isLegalMove(board: Board, player: Player, dir: Direction) {
        const newP = dir.change(player.pt);
        return !board.isOutOf(newP.x, newP.y)
            && !board.barriersMap[newP.y][newP.x]
            && !board.getBoxesMap().get(`${newP.x}-${newP.y}`)
            && !board.getHolesMap().get(`${newP.x}-${newP.y}`)
            && (player.inAir ? !airMove.includes(dir) && newP.equals(player.dir.change(player.pt)) : true);
    }

    minimax(inBoard: Board, mePoint: Point, players: Player[], distances: number[][]) {
        const playersAmount = players.length

        const max = (board: Board, me: Player, depth = 1): [number, Direction] => {
            board.lasers = board.lasers.map(([pt, dir]) => [dir.change(pt), dir]); // move forward

            let maxMoveScore = -Infinity;
            let bestMove: Direction = DirectionList.JUMP;

            for (const moveDirection of potentialMovies) {
                if (this.isLegalMove(board, me, moveDirection)) {
                    this.simpleMove(me, moveDirection, board);
                    var [moveScore] = min(board, 0, maxMoveScore, me, depth);
                    this.undoSimpleMove(me, moveDirection, board);


                    if (moveScore > maxMoveScore) {
                        maxMoveScore = moveScore;
                        bestMove = moveDirection;
                    }
                }
            }
            board.lasers = board.lasers.map(([pt, dir]) => [dir.inverted().change(pt), dir]); // move back

            return [maxMoveScore, bestMove];
        }

        const min = (board: Board, playerIndex: number, maxMoveScore: number, me: Player, depth = 1): [number, Direction] => {
            let minScore = +Infinity;
            let minMove: Direction = DirectionList.STOP;

            if (playerIndex < playersAmount) {
                for (const move of (players[playerIndex].isZombie ? potentialZombieMovies : potentialMovies)) {
                    if (this.isLegalMove(board, players[playerIndex], move)) {

                        this.simpleMove(players[playerIndex], move, board);

                        var [value] = min(board, playerIndex + 1, maxMoveScore, me, depth);
                        this.undoSimpleMove(players[playerIndex], move, board);

                        if (value < maxMoveScore) {
                            return [-Infinity, DirectionList.STOP];  // cut!
                        }

                        if (value < minScore) {
                            minScore = value;
                        }
                    }
                }
            } else {
                let v = -distances[me.pt.y][me.pt.x];

                // zombie can kill players
                players.filter(p => p.isZombie).forEach(z => {
                    if (!me.inAir && z.pt.equals(me.pt)) {
                        v += -5;
                    } else if (players.some(p => !p.isZombie && !p.inAir && p.pt.equals(z.pt))) {
                        v += 5;
                    }
                })
                let hasLaserReachHer0 = false;
                // other payers can be killed only by laser
                board.lasers.forEach(([laserPoint]) => {
                    if (!me.inAir && laserPoint.equals(me.pt)) {
                        v += -10;
                        hasLaserReachHer0 = true;
                        // me.isAlive = false;
                    }
                    players.forEach(p => {
                        if (!p.inAir && p.pt.equals(laserPoint)) {
                            v += 10;
                        }
                    });
                })
                for (const gold of board.getGold()) {
                    if (!me.inAir && gold.equals(me.pt)) {
                        v += 10;
                    }
                    players.forEach(p => {
                        if (!p.inAir && p.pt.equals(gold)) {
                            v += -10;
                        }
                    });
                }

                if (depth > 0 && !hasLaserReachHer0) {
                    return max(board, me, depth - 1);
                }
                // v += hasLaserReachHer0 ? 0 : 1;
                return [v, DirectionList.STOP];
            }

            return [minScore, minMove];
        }


        const me = new Player(mePoint);

        if (inBoard.getAt(2, me.pt.x, me.pt.y).char === '*' && this.previousBoard) {
            me.inAir = true;
            me.dir = DirectionList.where(this.previousBoard.getMe(), me.pt);
        } else {
            me.inAir = false;
        }
        me.fireTick = this.firedAtTick;
        const result = max(inBoard, me, 1);
        return result;
    }
    undoSimpleMove(player: Player, move: Direction, board: Board) {
        const invertedMove = move.inverted();
        const newPos = invertedMove.change(player.pt);
        if (airMove.includes(invertedMove)) {
            player.inAir = false;
            player.dir = DirectionList.jumpDirection(invertedMove);

            player.pt = player.dir.change(player.pt);
        } else if ([
            DirectionList.FIRE_DOWN,
            DirectionList.FIRE_LEFT,
            DirectionList.FIRE_RIGHT,
            DirectionList.FIRE_UP
        ].includes(invertedMove)) {
            const fd = fireDirectionMap.get(move);
            if (fd) {
                const lm = fd.change(player.pt);
                board.lasers = board.lasers.filter(l => {
                    return !(l[0].equals(lm) && l[1] === fd);
                });
            }
        } else {
            player.pt = newPos;
        }
    }
    simpleMove(player: Player, move: Direction, board: Board) {
        const newPos = move.change(player.pt);
        if (airMove.includes(move)) {
            player.inAir = true;
            player.dir = DirectionList.jumpDirection(move);

            player.pt = player.dir.change(player.pt);
        } else if ([
            DirectionList.FIRE_DOWN,
            DirectionList.FIRE_LEFT,
            DirectionList.FIRE_RIGHT,
            DirectionList.FIRE_UP
        ].includes(move)) {
            const fd = fireDirectionMap.get(move);
            if (fd) {
                board.lasers.push([fd.change(player.pt), fd]);
            }
        } else {
            player.pt = newPos;
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

        console.log(`gold ${this.goldAmountCollected}`);

        const isAngry = this.goldAmountCollected < 5 && this.level > 21;

        // const playersAround = this.players.filter(p => getDistance(me, p.pt) < 3);
        //const isMiniMaxActive = useMiniMax && playersAround.length && playersAround.length < 3;

        const scores = makeArray(board.size, board.size, 0);
        const haveAmmo = this.currentTick >= this.firedAtTick + this.options.gunReload;

        const isSafe = this.noLasersAround(me, board)
            && this.noZombieAround(board)
            && this.noOtherPlayersAround(board, isAngry)
            && this.noLasersOnPreviousStep(me);

        if (isSafe && haveAmmo) {
            for (const player of this.players) {
                if (player.inAir && player.dir) {
                    const nextR = player.dir.change(player.pt);
                    const nearMe = board.getNear(1, me.x, me.y).find(nearMe => nextR.equals(nearMe.pt));

                    if (nearMe) {
                        console.error('FlyFire');
                        return [Command.fire(nearMe.dir), undefined];
                    }
                }

                for (const [blastX, blastY] of board.blasts(player.pt.x, player.pt.y)) {
                    scores[blastY][blastX] += (player.isAfk || player.isZombie) ? this.options.playerKill * 2 : this.options.playerKill / 2;
                };
            }


            const enemies = this.players.map(p => p.pt).concat(board.getLiveZombies())
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
        }

        if (!isSafe) {
            scores[me.y][me.x] = -100;
        }

        for (const wall of board.getWalls()) {
            scores[wall.y][wall.x] = - 1e9;
        }
        const exits = board.getExits();
        const golds = board.getGold();

        for (const exit of exits) {
            scores[exit.y][exit.x] += this.options.roundWin * 2;
            if (golds.length) {
                const { distances } = board.bfs(exit.x, exit.y);

                for (const gold of golds) {
                    const dist = distances[gold.y][gold.x];
                    scores[gold.y][gold.x] += 250 / dist;
                }

                // if (this.goldAmountCollected > 20) {
                //     scores[exit.y][exit.x] += this.options.roundWin + this.goldAmountCollected * 10;
                // } else if (exitDistances.length) {
                //     existHaveGold = true;
                //     scores[exit.y][exit.x] += this.options.roundWin + this.goldAmountCollected * 100;
                //     board.barriersMap[exit.y][exit.x] = true;
                // } else {
                //     if (distances[me.y][me.x] < 15) {
                //         scores[exit.y][exit.x] += this.options.roundWin + this.goldAmountCollected * 10;
                //     } else {
                //         board.barriersMap[exit.y][exit.x] = true;
                //     }
                // }
            }
            //scores[gold.y][gold.x] += this.options.goldValue + this.options.roundWin * 7 / exitDistances[0];
        }

        for (const gold of golds) {
            if (!gold.equals(me) && !board.getNear(0, gold.x, gold.y).some(n => this.players.some(p => p.pt.equals(n.pt)))) {
                scores[gold.y][gold.x] += this.options.goldValue;
            }
        }

        for (const unvisited of board.getUnvisited()) {
            scores[unvisited.y][unvisited.x] += 10;
        }

        if (this.currentTick < 7 && isAngry && this.currentTick >= this.firedAtTick + this.options.gunReload - 1) {
            for (const start of board.getStarts()) {
                for (const [blastX, blastY] of board.blasts(start.x, start.y, 2)) {
                    scores[blastY][blastX] += 15;
                }
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

        // if (isMiniMaxActive) {
        //     const { distances } = board.bfs(tx, ty, undefined, true);
        //     console.log(`Minimax ${playersAround.length}`);
        //     // console.table(target);
        //     const [score, direction] = this.minimax(board, me, playersAround, distances);

        //     return [direction.toString(), undefined];
        // }

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


            if (pDir) {
                // if ([
                //     DirectionList.DOWN,
                //     DirectionList.UP,
                //     DirectionList.LEFT,
                //     DirectionList.RIGHT
                // ].includes(pDir) && board.isNear(1, me.x, me.y, [elementsList.BOX])) {
                //     return [Command.pull(pDir), distances];
                // }

                return [pDir.toString(), scores];
            }
        }
        return [DirectionList.STOP.toString(), undefined];
    }
    trackPlayers(board: Board) {
        const tick = this.currentTick;
        const prevPlayers = this.players || [];

        this.players = board.getOtherLiveHeroes().map(her0 => {
            const player = new Player(her0);

            const playerStays = prevPlayers.find(pp => pp.pt.equals(her0));
            var prefPlayer: Player | undefined;

            if (playerStays) {
                prevPlayers.splice(prevPlayers.indexOf(playerStays), 1);
                player.fireTick = playerStays.fireTick;
                player.moveTick = playerStays.moveTick;
                player.isAfk = this.goldAmountCollected < 11 && (player.moveTick + 4 < tick && player.fireTick + 2 < tick);
                directionsAround.some(dir => {
                    const elAtPos = board.getAt(1, dir.changeX(her0.x), dir.changeY(her0.y));
                    if ([ElementsList.LASER_DOWN, ElementsList.LASER_LEFT, ElementsList.LASER_UP, ElementsList.LASER_RIGHT].includes(elAtPos) && elAtPos.direction === dir) {
                        player.fireTick = tick;
                        player.isAfk = false;
                    }
                });
            } else {
                prefPlayer = prevPlayers.find(pp => directionsAround.some(dir => dir.change(pp.pt).equals(her0)));
                player.moveTick = tick;
                player.isAfk = false;

                if (prefPlayer) {
                    prevPlayers.splice(prevPlayers.indexOf(prefPlayer), 1);
                    player.fireTick = prefPlayer.fireTick;
                } else {
                    player.fireTick = -Infinity;
                }
            }
            player.hasAmmo = player.fireTick + 2 < tick;
            if (board.getAt(2, her0.x, her0.y).char === '^' && this.previousBoard) {
                player.inAir = true;
                player.dir = prefPlayer ? DirectionList.where(prefPlayer.pt, her0) : DirectionList.JUMP;
            } else {
                player.inAir = false;
            }
            player.inAir = board.getAt(2, her0.x, her0.y).char === '^';

            return player;
        }).concat(board.getLiveZombies().map(z => {
            const zombie = new Player(z);
            zombie.isAfk = false;
            zombie.isZombie = true;
            return zombie;
        }));
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
    noOtherPlayersAround(board: Board, isAngry) {
        const me = board.getMe();
        return isAngry || !directionsAround.some(dir => this.players.some(p => !(p.isAfk) && dir.change(me).equals(p.pt)))
    }
}


export default Game;
