import Board from './Board';
import Command from './Command';
import DirectionList from './Direction';
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
    gunReload: 3
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
    constructor(options?: typeof DEFAULT_OPTIONS) {
        this.options = { ...DEFAULT_OPTIONS, ...options }
        this.state = GameState.WAIT;
        this.currentTick = 0;
    }
    reset() {
        this.currentTick = 0;
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
        const { distances, parent } = board.bfs();
        const me = board.getMe();
        const scores = makeArray(board.size, board.size, 0);

        for (const wall of board.getWalls()) {
            scores[wall.x][wall.y] =- 1e9;
        }

        for (const exit of board.getExits()) {
            scores[exit.x][exit.y] =+ this.options.roundWin;
        }
        for (const gold of board.getGold()) {
            scores[gold.x][gold.y] =+ this.options.goldValue;
        }
        for (const zombie of board.getZombies()) {
            for (const [blastX, blastY] of board.blasts(zombie.x, zombie.y)) {
                scores[blastX][blastY] =+ this.options.zombieKill;
            };
        }
        for (const players of board.getOtherHeroes()) {
            scores[players.x][players.y] =+ this.options.playerKill;
        }
        for (const perk of board.getPerks()) {
            scores[perk.x][perk.y] =+ 3;
        }

        let best = -1;
        let tx : number | undefined;
        let ty : number | undefined;
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
        var ptx, pty;
        if (best < 0) {
            return Command.die();
        } else if (tx && ty) {
            let [Tx, Ty] = [tx, ty];
            [ptx, pty] = [tx, ty];
            while (tx != me.x || ty != me.y) {  // Looking for next point on the way to target
                [ptx, pty] = [tx, ty];
                [tx, ty] = parent[tx][ty];
            }
        }
        var nextDir = DirectionList.where(me, new Point(ptx, pty));
        console.log(`tx ${tx} ty ${ty} sc ${best} ${nextDir}`);

        this.distances = distances;

        if (nextDir) {
            const nextPoint = nextDir.change(me);
            if (
                board.getAt(1, nextPoint.x, nextPoint.y) === elementsList.BOX ||
                ['LASER_MACHINE', 'LASER_MACHINE_READY', 'HOLE'].includes(board.getAt(0, nextPoint.x, nextPoint.y).type)
            ) {
                return Command.jump(nextDir);
            }
            return nextDir;
        }

        return Command.doNothing();
    }
}


export default Game;
