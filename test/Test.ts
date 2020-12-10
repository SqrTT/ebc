/*-
 * #%L
 * Codenjoy - it's a dojo-like platform from developers to developers.
 * %%
 * Copyright (C) 2016 - 2020 Codenjoy
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public
 * License along with this program.  If not, see
 * <http://www.gnu.org/licenses/gpl-3.0.html>.
 * #L%
 */

import Board from '../src/Board';
import Game from '../src/Game';
import ElementsList from '../src/Element'
import DirectionList from '../src/Direction'
import Point, { pt } from '../src/Point'
const LAYER1 = 0;
const LAYER2 = 1;
const LAYER3 = 2;

var toString = function (data) {
    if (data === undefined || data == null) {
        return data;
    }
    return JSON.stringify(data).split('"').join('\'');
}

var assertEquals = function (expected, actual) {
    expected = toString(expected);
    actual = toString(actual);
    if (expected !== actual) {
        console.log('Expected:');
        console.log(expected);

        console.log('Actual:');
        console.log(actual);

        throw Error('Expected: "' + expected + '" but was: "' + actual + '"');
    }
}

const boardGoldLaser3String = '{"offset":{"x":0,"y":0},' +
    '"heroPosition":{"x":6,"1":6},' +
    '"layers":["' +
    '╔═══════┐' + // 8
    '║.......│' + // 7
    '║.......│' + // 6
    '║.......│' + // 5
    '║.......│' + // 4
    '║.......│' + // 3
    '║.......│' + // 2
    '║..$....│' + // 1
    '└───────┘",' + // 0
    // 012345678
    '"---------' + // 8
    '---------' + // 7
    '---------' + // 6
    '--B------' + // 5
    '----BBB--' + // 4
    '---BBBBB-' + // 3
    '---BBXBB-' + // 2
    '------☺--' + // 1
    '---------",' + // 0
    // 012345678
    '"---------' + // 0
    '---------' + // 1
    '---------' + // 2
    '---------' + // 3
    '---------' + // 4
    '---------' + // 5
    '---------' + // 6
    '---------' + // 7
    '---------"' + // 8
    ']}';

const laserGold3Game = new Game();
const laserGold3Move = laserGold3Game.tick(JSON.parse(boardGoldLaser3String), true)[0];
console.assert(laserGold3Move.includes('ACT(3),LEFT'))


const boardGoldLaser2String = '{"offset":{"x":0,"y":0},' +
    '"heroPosition":{"x":6,"1":6},' +
    '"layers":["' +
    '╔═══════┐' + // 8
    '║.......│' + // 7
    '║.......│' + // 6
    '║.......│' + // 5
    '║.......│' + // 4
    '║.......│' + // 3
    '║.......│' + // 2
    '║..$....│' + // 1
    '└───────┘",' + // 0
    // 012345678
    '"---------' + // 8
    '---------' + // 7
    '---------' + // 6
    '--B------' + // 5
    '---------' + // 4
    '---------' + // 3
    '-----X---' + // 2
    '---→-☺---' + // 1
    '---------",' + // 0
    // 012345678
    '"---------' + // 0
    '---------' + // 1
    '---------' + // 2
    '---------' + // 3
    '---------' + // 4
    '---------' + // 5
    '---------' + // 6
    '---------' + // 7
    '---------"' + // 8
    ']}';

const laserGold2Game = new Game();
const laserGold2Move = laserGold2Game.tick(JSON.parse(boardGoldLaser2String), true)[0];
console.assert(laserGold2Move.includes('ACT(1),LEFT'))






const boardGoldLaserString = '{"offset":{"x":0,"y":0},' +
    '"heroPosition":{"x":6,"1":6},' +
    '"layers":["' +
    '╔═══════┐' + // 8
    '║.......│' + // 7
    '║.......│' + // 6
    '║.......│' + // 5
    '║.......│' + // 4
    '║.......│' + // 3
    '║.......│' + // 2
    '║...$...│' + // 1
    '└───────┘",' + // 0
    // 012345678
    '"---------' + // 8
    '---------' + // 7
    '---------' + // 6
    '--B------' + // 5
    '---------' + // 4
    '---------' + // 3
    '---------' + // 2
    '---→-☺---' + // 1
    '---------",' + // 0
    // 012345678
    '"---------' + // 0
    '---------' + // 1
    '---------' + // 2
    '---------' + // 3
    '---------' + // 4
    '---------' + // 5
    '---------' + // 6
    '---------' + // 7
    '---------"' + // 8
    ']}';

const laserGoldGame = new Game();
const laserGoldMove = laserGoldGame.tick(JSON.parse(boardGoldLaserString))[0];
console.assert(!laserGoldMove.includes('LEFT'))


const boardLaserString = '{"offset":{"x":0,"y":0},' +
    '"heroPosition":{"x":6,"1":6},' +
    '"layers":["' +
    '╔═══════┐' + // 8
    '║.......│' + // 7
    '║.......│' + // 6
    '║.......│' + // 5
    '║.......│' + // 4
    '║.......│' + // 3
    '║.......│' + // 2
    '║$......│' + // 1
    '└───────┘",' + // 0
    // 012345678
    '"---------' + // 8
    '---------' + // 7
    '---------' + // 6
    '--B------' + // 5
    '---------' + // 4
    '---------' + // 3
    '---------' + // 2
    '---→-☺---' + // 1
    '---------",' + // 0
    // 012345678
    '"---------' + // 0
    '---------' + // 1
    '---------' + // 2
    '---------' + // 3
    '---------' + // 4
    '---------' + // 5
    '---------' + // 6
    '---------' + // 7
    '---------"' + // 8
    ']}';

const laserGame = new Game();
const laserMove = laserGame.tick(JSON.parse(boardLaserString))[0];
console.assert(laserMove.includes('ACT(1),LEFT'))




const boardFlyLaserString = '{"offset":{"x":0,"y":0},' +
    '"heroPosition":{"x":3,"y":6},' +
    '"layers":["' +
    '╔═══════┐' + // 8
    '║.......│' + // 7
    '║.......│' + // 6
    '║.......│' + // 5
    '║.......│' + // 4
    '║.......│' + // 3
    '║.......│' + // 2
    '║$......│' + // 1
    '└───────┘",' + // 0
    // 012345678
    '"---------' + // 8
    '---------' + // 7
    '--☺------' + // 6
    '--B------' + // 5
    '→--------' + // 4
    '---------' + // 3
    '---------' + // 2
    '---------' + // 1
    '---------",' + // 0
    // 012345678
    '"---------' + // 0
    '---------' + // 1
    '---------' + // 2
    '---------' + // 3
    '---------' + // 4
    '---------' + // 5
    '---------' + // 6
    '---------' + // 7
    '---------"' + // 8
    ']}';

const flyGame = new Game();
const flyMove = flyGame.tick(JSON.parse(boardFlyLaserString))[0];
console.assert(!flyMove.includes('DOWN'))


// // --------- board.layerN -----------

// assertEquals('╔═══════┐\n' +
//     '║S.$◄..O│\n' +
//     '║....$O.│\n' +
//     '║.$E....│\n' +
//     '║˃..O...│\n' +
//     '║.O...Z.│\n' +
//     '║..˄....│\n' +
//     '║..˅˂▼►▲│\n' +
//     '└───────┘\n',
//     board.layer1());

// assertEquals('---------\n' +
//     '--☺----o-\n' +
//     '-X----x☻-\n' +
//     '-X---B---\n' +
//     '--→B-↓B--\n' +
//     '-♂♂♀✝B---\n' +
//     '--&--↑←--\n' +
//     '---------\n' +
//     '---------\n',
//     board.layer2());

// assertEquals('---------\n' +
//     '------*--\n' +
//     '---------\n' +
//     '---------\n' +
//     '------^--\n' +
//     '---------\n' +
//     '---------\n' +
//     '---------\n' +
//     '---------\n',
//     board.layer3());

// // --------- getScanner --------------
// // getAt

// assertEquals(ElementsList.GOLD,
//     board.getAt(LAYER1, 2, 5));

// assertEquals(ElementsList.ROBOT_OTHER,
//     board.getAt(LAYER2, 1, 6));

// assertEquals(ElementsList.ROBOT_OTHER,
//     board.getAt(LAYER2, 1, 6));

// assertEquals(ElementsList.HOLE,
//     board.getAt(LAYER1, 6, 6));

// assertEquals(ElementsList.ROBOT_OTHER_FALLING,
//     board.getAt(LAYER2, 6, 6));

// assertEquals(ElementsList.BOX,
//     board.getAt(LAYER2, 6, 4));

// assertEquals(ElementsList.ROBOT_OTHER_FLYING,
//     board.getAt(LAYER3, 6, 4));

// assertEquals(ElementsList.FLOOR,
//     board.getAt(LAYER1, 2, 2));

// assertEquals(ElementsList.ROBOT_OTHER_LASER,
//     board.getAt(LAYER2, 2, 2));

// assertEquals(ElementsList.FLOOR,
//     board.getAt(LAYER1, 2, 7));

// assertEquals(ElementsList.ROBOT,
//     board.getAt(LAYER2, 2, 7));

// assertEquals(ElementsList.FLOOR,
//     board.getAt(LAYER1, 2, 6));

// assertEquals(ElementsList.EMPTY,
//     board.getAt(LAYER2, 2, 6));

// assertEquals(ElementsList.EMPTY,
//     board.getAt(LAYER3, 2, 6));

// assertEquals(ElementsList.EXIT,
//     board.getAt(LAYER1, 3, 5));

// assertEquals(ElementsList.GOLD,
//     board.getAt(LAYER1, 3, 7));

// assertEquals(ElementsList.FLOOR,
//     board.getAt(LAYER1, 6, 7));

// assertEquals(ElementsList.EMPTY,
//     board.getAt(LAYER2, 6, 7));

// assertEquals(ElementsList.ROBOT_FLYING,
//     board.getAt(LAYER3, 6, 7));

// assertEquals(ElementsList.BOX,
//     board.getAt(LAYER2, 6, 4));

// assertEquals(ElementsList.ROBOT_OTHER_FLYING,
//     board.getAt(LAYER3, 6, 4));

// // isNear

// assertEquals(false,
//     board.isNear(LAYER2, -1, 7, [ElementsList.ROBOT_OTHER])); // координаты невалидные

// // мoй другой робот что летает LAYER3
// assertEquals(ElementsList.ROBOT_OTHER_FLYING,
//     board.getAt(LAYER3, 6, 4));
// assertEquals(true,
//     board.isNear(LAYER3, 5, 4, [ElementsList.ROBOT_OTHER_FLYING]));

// // чужой робот, что летает LAYER3
// assertEquals(ElementsList.ROBOT_FLYING,
//     board.getAt(LAYER3, 6, 7));
// assertEquals(true,
//     board.isNear(LAYER3, 6, 8, [ElementsList.ROBOT_FLYING]));

// assertEquals(true,
//     board.isNear(LAYER2, 2, 6, [ElementsList.ROBOT_OTHER]));

// assertEquals(true,
//     board.isNear(LAYER2, 2, 6, [ElementsList.ROBOT]));

// assertEquals(false,
//     board.isNear(LAYER2, 2, 6, [ElementsList.FEMALE_ZOMBIE]));

// assertEquals(false,
//     board.isNear(LAYER2, 2, 6, [ElementsList.FEMALE_ZOMBIE, ElementsList.HOLE]));

// assertEquals(false,
//     board.isNear(LAYER2, 5, 7, [ElementsList.ROBOT_OTHER, ElementsList.ROBOT_FLYING]));

// assertEquals(true,
//     board.isNear(LAYER3, 5, 7, [ElementsList.ROBOT_OTHER, ElementsList.ROBOT_FLYING]));

// assertEquals(false,
//     board.isNear(LAYER2, 5, 4, [ElementsList.ROBOT_OTHER_FLYING, ElementsList.ROBOT]));

// assertEquals(true,
//     board.isNear(LAYER3, 5, 4, [ElementsList.ROBOT_OTHER_FLYING, ElementsList.ROBOT]));

// assertEquals(true,
//     board.isNear(LAYER2, 2, 6, [ElementsList.ROBOT, ElementsList.GOLD]));

// assertEquals(true,
//     board.isNear(LAYER2, 2, 6, [ElementsList.ROBOT_OTHER, ElementsList.HOLE, ElementsList.FEMALE_ZOMBIE]));

// // getMe

// assertEquals({ 'x': 2, 'y': 7 }, board.getMe());

// // TODO what if Hero not on board?
// // TODO what if Hero is flying
// // TODO ...or falling to hole
// // TODO ...or die on laser?

// // isAt

// assertEquals(false,
//     board.isAt(LAYER2, 2, 7, [ElementsList.ROBOT_OTHER]));
// assertEquals(true,
//     board.isAt(LAYER2, 2, 7, [ElementsList.ROBOT]));

// assertEquals(false,
//     board.isAt(LAYER1, 2, 7, [ElementsList.ROBOT_OTHER]));
// assertEquals(false,
//     board.isAt(LAYER1, 2, 7, [ElementsList.ROBOT]));

// assertEquals(false,
//     board.isAt(LAYER1, 2, 7, [ElementsList.GOLD, ElementsList.ROBOT]));
// assertEquals(true,
//     board.isAt(LAYER2, 2, 7, [ElementsList.GOLD, ElementsList.ROBOT]));

// assertEquals(true,
//     board.isAt(LAYER2, 2, 7, [ElementsList.ROBOT, ElementsList.FLOOR]));

// assertEquals(false,
//     board.isAt(LAYER2, 2, 7, [ElementsList.ROBOT_OTHER, ElementsList.HOLE, ElementsList.FEMALE_ZOMBIE]));

// // мой летает на LAYER3
// assertEquals(true,
//     board.isAt(LAYER3, 6, 7, [ElementsList.ROBOT_FLYING]));

// assertEquals(false,
//     board.isAt(LAYER2, 6, 7, [ElementsList.ROBOT_FLYING]));

// // чужой летает на LAYER3
// assertEquals(true,
//     board.isAt(LAYER3, 6, 4, [ElementsList.ROBOT_OTHER_FLYING]));

// assertEquals(false,
//     board.isAt(LAYER3, 6, 4, [ElementsList.ROBOT_OTHER]));

// // at corners

// assertEquals(true,
//     board.isAt(LAYER1, 0, 8, [ElementsList.ANGLE_IN_LEFT]));

// assertEquals(true,
//     board.isAt(LAYER1, 0, 0, [ElementsList.ROBOT_OTHER, ElementsList.ANGLE_BACK_LEFT]));

// assertEquals(false,
//     board.isAt(LAYER1, 8, 8, [ElementsList.GOLD]));

// assertEquals(false,
//     board.isAt(LAYER1, 8, 0, [ElementsList.GOLD, ElementsList.HOLE]));

// // get

// assertEquals([{ 'x': 2, 'y': 5 }, { 'x': 3, 'y': 7 }, { 'x': 5, 'y': 6 }],
//     board.get(LAYER1, [ElementsList.GOLD]));

// assertEquals([{ 'x': 1, 'y': 5 }, { 'x': 1, 'y': 6 }],
//     board.get(LAYER2, [ElementsList.ROBOT_OTHER]));

// assertEquals([{ 'x': 6, 'y': 4 }],
//     board.get(LAYER3, [ElementsList.ROBOT_OTHER_FLYING]));

// assertEquals([{ 'x': 6, 'y': 6 }],
//     board.get(LAYER2, [ElementsList.ROBOT_OTHER_FALLING]));

// assertEquals([{ 'x': 2, 'y': 2 }],
//     board.get(LAYER2, [ElementsList.ROBOT_OTHER_LASER]));

// assertEquals([{ 'x': 2, 'y': 7 }],
//     board.get(LAYER2, [ElementsList.ROBOT]));

// assertEquals([{ 'x': 6, 'y': 7 }],
//     board.get(LAYER3, [ElementsList.ROBOT_FLYING]));

// assertEquals([{ 'x': 7, 'y': 7 }],
//     board.get(LAYER2, [ElementsList.ROBOT_FALLING]));

// assertEquals([{ 'x': 7, 'y': 6 }],
//     board.get(LAYER2, [ElementsList.ROBOT_LASER]));

// assertEquals([{ 'x': 1, 'y': 5 }, { 'x': 1, 'y': 6 }, { 'x': 2, 'y': 2 }, { 'x': 2, 'y': 7 }, { 'x': 6, 'y': 6 }, { 'x': 7, 'y': 6 }, { 'x': 7, 'y': 7 }],
//     board.get(LAYER2, [ElementsList.ROBOT, ElementsList.ROBOT_FLYING, ElementsList.ROBOT_FALLING, ElementsList.ROBOT_LASER,
//     ElementsList.ROBOT_OTHER, ElementsList.ROBOT_OTHER_FLYING, ElementsList.ROBOT_OTHER_FALLING, ElementsList.ROBOT_OTHER_LASER]));

// assertEquals([{ 'x': 6, 'y': 4 }, { 'x': 6, 'y': 7 }],
//     board.get(LAYER3, [ElementsList.ROBOT, ElementsList.ROBOT_FLYING, ElementsList.ROBOT_FALLING, ElementsList.ROBOT_LASER,
//     ElementsList.ROBOT_OTHER, ElementsList.ROBOT_OTHER_FLYING, ElementsList.ROBOT_OTHER_FALLING, ElementsList.ROBOT_OTHER_LASER]));

// assertEquals([{ 'x': 2, 'y': 5 }, { 'x': 3, 'y': 7 }, { 'x': 5, 'y': 6 }],
//     board.get(LAYER1, [ElementsList.GOLD]));

// assertEquals([],
//     board.get(LAYER1, []));

// assertEquals([{ 'x': 1, 'y': 7 }, { 'x': 2, 'y': 5 }, { 'x': 3, 'y': 5 }, { 'x': 3, 'y': 7 }, { 'x': 5, 'y': 6 }],
//     board.get(LAYER1, [ElementsList.GOLD, ElementsList.START, ElementsList.EXIT]));

// // isBarrierAt

// assertEquals(false,
//     board.isBarrierAt(2, 6));

// assertEquals(true,
//     board.isBarrierAt(0, 8));

// assertEquals(true,
//     board.isBarrierAt(0, 8));

// assertEquals(true,
//     board.isBarrierAt(3, 4));

// assertEquals(true,
//     board.isBarrierAt(4, 7));

// // countNear

// assertEquals(1,
//     board.countNear(LAYER1, 2, 6, ElementsList.GOLD));

// assertEquals(1,
//     board.countNear(LAYER2, 2, 6, ElementsList.ROBOT));

// assertEquals(0,
//     board.countNear(LAYER2, 5, 7, [ElementsList.ROBOT_OTHER]));

// assertEquals(1,
//     board.countNear(LAYER3, 5, 7, [ElementsList.ROBOT_FLYING]));

// assertEquals(1,
//     board.countNear(LAYER3, 5, 4, [ElementsList.ROBOT_OTHER_FLYING, ElementsList.ROBOT]));

// assertEquals(1,
//     board.countNear(LAYER2, 2, 6, ElementsList.ROBOT_OTHER));

// assertEquals(4,
//     board.countNear(LAYER2, 3, 6, ElementsList.EMPTY));

// assertEquals(2,
//     board.countNear(LAYER1, 1, 7, [ElementsList.WALL_FRONT, ElementsList.WALL_LEFT]));

// // getOtherRobots

// assertEquals([{ 'x': 1, 'y': 5 }, { 'x': 1, 'y': 6 }, { 'x': 2, 'y': 2 },
// { 'x': 6, 'y': 6 }, { 'x': 6, 'y': 4 }], // TODO не сортируется, должно быть наоборот по Y 4 потом 6
//     board.getOtherHeroes());

// // getLaserMachines

// assertEquals([{ 'x': 1, 'y': 4, 'direction': 'RIGHT' }, { 'x': 3, 'y': 1, 'direction': 'DOWN' },
// { 'x': 3, 'y': 2, 'direction': 'UP' }, { 'x': 4, 'y': 1, 'direction': 'LEFT' },
// { 'x': 4, 'y': 7, 'direction': 'LEFT' }, { 'x': 5, 'y': 1, 'direction': 'DOWN' },
// { 'x': 6, 'y': 1, 'direction': 'RIGHT' }, { 'x': 7, 'y': 1, 'direction': 'UP' }],
//     board.getLaserMachines());

// // getLasers

// assertEquals([{ 'x': 2, 'y': 4, 'direction': 'RIGHT' }, { 'x': 5, 'y': 2, 'direction': 'UP' },
// { 'x': 5, 'y': 4, 'direction': 'DOWN' }, { 'x': 6, 'y': 2, 'direction': 'LEFT' }],
//     board.getLasers());

// // getWalls

// assertEquals([{ 'x': 0, 'y': 0 }, { 'x': 0, 'y': 1 }, { 'x': 0, 'y': 2 }, { 'x': 0, 'y': 3 }, { 'x': 0, 'y': 4 },
// { 'x': 0, 'y': 5 }, { 'x': 0, 'y': 6 }, { 'x': 0, 'y': 7 }, { 'x': 0, 'y': 8 }, { 'x': 1, 'y': 0 }, { 'x': 1, 'y': 8 },
// { 'x': 2, 'y': 0 }, { 'x': 2, 'y': 8 }, { 'x': 3, 'y': 0 }, { 'x': 3, 'y': 8 }, { 'x': 4, 'y': 0 }, { 'x': 4, 'y': 8 },
// { 'x': 5, 'y': 0 }, { 'x': 5, 'y': 8 }, { 'x': 6, 'y': 0 }, { 'x': 6, 'y': 8 }, { 'x': 7, 'y': 0 }, { 'x': 7, 'y': 8 },
// { 'x': 8, 'y': 0 }, { 'x': 8, 'y': 1 }, { 'x': 8, 'y': 2 }, { 'x': 8, 'y': 3 }, { 'x': 8, 'y': 4 }, { 'x': 8, 'y': 5 },
// { 'x': 8, 'y': 6 }, { 'x': 8, 'y': 7 }, { 'x': 8, 'y': 8 }],
//     board.getWalls());

// // getBoxes

// assertEquals([{ 'x': 3, 'y': 4 }, { 'x': 5, 'y': 3 }, { 'x': 5, 'y': 5 }, { 'x': 6, 'y': 4 }],
//     board.getBoxes());

// // getGold

// assertEquals([{ 'x': 2, 'y': 5 }, { 'x': 3, 'y': 7 }, { 'x': 5, 'y': 6 }],
//     board.getGold());

// // getStart

// assertEquals([{ 'x': 1, 'y': 7 }],
//     board.getStarts());

// // getZombieStart

// assertEquals([{ 'x': 6, 'y': 3 }],
//     board.getZombieStart());

// // getExit

// assertEquals([{ 'x': 3, 'y': 5 }],
//     board.getExits());

// // getHoles

// assertEquals([{ 'x': 2, 'y': 3 }, { 'x': 4, 'y': 4 }, { 'x': 6, 'y': 6 }, { 'x': 7, 'y': 7 }],
//     board.getHoles());

// // // getBarriers

// // assertEquals([{ 'x': 0, 'y': 0 }, { 'x': 0, 'y': 1 }, { 'x': 0, 'y': 2 }, { 'x': 0, 'y': 3 }, { 'x': 0, 'y': 4 },
// // { 'x': 0, 'y': 5 }, { 'x': 0, 'y': 6 }, { 'x': 0, 'y': 7 }, { 'x': 0, 'y': 8 }, { 'x': 1, 'y': 0 }, { 'x': 1, 'y': 4 },
// // { 'x': 1, 'y': 8 }, { 'x': 2, 'y': 0 }, { 'x': 2, 'y': 3 }, { 'x': 2, 'y': 8 }, { 'x': 3, 'y': 0 }, { 'x': 3, 'y': 1 },
// // { 'x': 3, 'y': 2 }, { 'x': 3, 'y': 4 }, { 'x': 3, 'y': 8 }, { 'x': 4, 'y': 0 }, { 'x': 4, 'y': 1 }, { 'x': 4, 'y': 4 },
// // { 'x': 4, 'y': 7 }, { 'x': 4, 'y': 8 }, { 'x': 5, 'y': 0 }, { 'x': 5, 'y': 1 }, { 'x': 5, 'y': 3 }, { 'x': 5, 'y': 5 },
// // { 'x': 5, 'y': 8 }, { 'x': 6, 'y': 0 }, { 'x': 6, 'y': 1 }, { 'x': 6, 'y': 4 }, { 'x': 6, 'y': 6 }, { 'x': 6, 'y': 8 },
// // { 'x': 7, 'y': 0 }, { 'x': 7, 'y': 1 }, { 'x': 7, 'y': 7 }, { 'x': 7, 'y': 8 }, { 'x': 8, 'y': 0 }, { 'x': 8, 'y': 1 },
// // { 'x': 8, 'y': 2 }, { 'x': 8, 'y': 3 }, { 'x': 8, 'y': 4 }, { 'x': 8, 'y': 5 }, { 'x': 8, 'y': 6 }, { 'x': 8, 'y': 7 },
// // { 'x': 8, 'y': 8 }],
// //     board.getBarriers());

// // isMyRobotAlive

// assertEquals(false,
//     board.isMeAlive());

// // Direction

// assertEquals({ 'x': 0, 'y': 1 }, DirectionList.UP.change(pt(0, 0)));
// assertEquals({ 'x': 0, 'y': -1 }, DirectionList.DOWN.change(pt(0, 0)));
// assertEquals({ 'x': -1, 'y': 0 }, DirectionList.LEFT.change(pt(0, 0)));
// assertEquals({ 'x': 1, 'y': 0 }, DirectionList.RIGHT.change(pt(0, 0)));

