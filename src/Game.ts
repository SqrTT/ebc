import Board from './Board';
import Command from './Command';
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
        const bar = board.getBarriers();



        return Command.doNothing();
    }
}


export default Game;
