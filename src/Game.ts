import Board from './Board';
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
    roundWin: 50,
    goldValue: 20,
    playerKill: 10,
    zombieKill: 5,
    diePenalty: 0,
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
interface ServerState {
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

class Game {
    currentTick: number
    state: GameState;
    readonly options: typeof DEFAULT_OPTIONS;
    distances?: number[][]
    firedAtTick: number;
    constructor(options?: typeof DEFAULT_OPTIONS) {
        this.options = { ...DEFAULT_OPTIONS, ...options }
        this.state = GameState.WAIT;
        this.currentTick = 0;
        this.firedAtTick = -Infinity;
    }
    reset() {
        this.currentTick = 0;
        this.firedAtTick = -Infinity;
    }
    tick(boardJson: ServerState) {
        const playerEl = boardJson.layers[1].split('').concat(boardJson.layers[2].split('')).find(char => myRobotElements.includes(char))


        if (playerEl) {
            if (ElementsList.ROBOT_LASER.char === playerEl || ElementsList.ROBOT_FALLING.char === playerEl) {
                this.state = GameState.DIED;
                console.log('Died. Do nothing');
                return Command.doNothing();
            } else {
                if (this.state !== GameState.PLAY) {
                    this.state = GameState.PLAY;
                    this.reset();
                }
                this.currentTick++;
                return this.move(new Board(boardJson));
            }
        } else {
            this.state = GameState.WAIT;
            console.log('No Player?. Do nothing');

            return Command.doNothing();
        }
    }
    move(board: Board) {
        const me = board.getMe();
        const scores = makeArray(board.size, board.size, 0);

        const haveAmmo = this.currentTick >= this.firedAtTick + this.options.gunReload;

        const isSafe = !board.getLasers().some(laser => {
            var direction = laser.direction;
            if (direction) {
                const dir = DirectionList.get(direction);
                if (dir) {
                    var next = dir.change(laser);
                    return next.equals(me);
                }
            }
        })

        if (isSafe && haveAmmo) {
            const enemies = board.getOtherLiveHeroes().concat(board.getLiveZombies())
                .map(goldPt => ({ pos: goldPt, distance: getDistance(me, goldPt) }))
                .sort((a, b) => {
                    return a.distance - b.distance;
                }).filter(a => board.hasClearPath(me, a.pos));

            const reachable = enemies.find(pt => me.getX() === pt.pos.getX() || me.getY() === pt.pos.getY());

            if (reachable) {

                const dir = DirectionList.where(me, reachable.pos);
                if (dir) {
                    this.firedAtTick = this.currentTick;
                    return Command.fire(dir);
                }
            }
        }

        for (const wall of board.getWalls()) {
            scores[wall.x][wall.y] = - 1e9;
        }

        for (const exit of board.getExits()) {
            scores[exit.x][exit.y] += this.options.roundWin;
        }
        for (const gold of board.getGold()) {
            scores[gold.x][gold.y] += this.options.goldValue;
        }

        if (haveAmmo) {
            for (const zombie of board.getLiveZombies()) {
                for (const [blastX, blastY] of board.blasts(zombie.x, zombie.y)) {
                    scores[blastX][blastY] += this.options.zombieKill;
                };
            }
            for (const players of board.getOtherLiveHeroes()) {
                for (const [blastX, blastY] of board.blasts(players.x, players.y)) {
                    scores[blastX][blastY] +=  this.options.playerKill;
                };
            }
        }

        for (const perk of board.getPerks()) {
            scores[perk.x][perk.y] += 3;
        }

        const { distances, parent } = board.bfs();

        let best = -1;
        let tx: number | undefined;
        let ty: number | undefined;
        for (var x = 0; x < board.size; x++) {
            for (var y = 0; y < board.size; y++) {
                if (scores[x][y] < 0) {
                    continue;
                }
                if (distances[x][y] < 0 || distances[x][y] > 1e8) {
                    continue
                }
                var sc = scores[x][y];
                var cur = sc / (distances[x][y] + 1);
                if (cur > best) {
                    best = cur
                    tx = x
                    ty = y
                    //tt = t
                }
            }
        }

        if (best < 0) {
            return Command.die();
        } else if (tx && ty) {
            // var ptx: number, pty: number;
            var pDir: Direction | undefined;

            let [Tx, Ty] = [tx, ty];
            //[ptx, pty] = [tx, ty];
            while (tx != me.x || ty != me.y) {  // Looking for next point on the way to target
                // [ptx, pty] = [tx, ty];
                [tx, ty, , pDir] = parent[tx][ty];
            }

            console.log(`tx ${tx} ty ${ty} sc ${best} ${pDir}`);

            this.distances = scores;

            if (pDir) {

                return pDir;
            }

            return Command.doNothing();
        }
    }
}


export default Game;
