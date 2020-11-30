import Direction from "./Direction";

 const Command = {

    /**
     * Says to Hero do nothing
     */
    doNothing: function () {
        return Direction.STOP.toString();
    },

    /**
     * Reset current level
     */
    die: function () {
        return Direction.DIE.toString();
    },

    /**
     * Says to Hero jump to direction
     */
    jump: function (direction) {
        return Direction.JUMP.toString() + "," + direction.toString();
    },

    /**
     * Says to Hero pull box on this direction
     */
    pull: function (direction) {
        return Direction.PULL.toString() + "," + direction.toString();
    },

    /**
     * Says to Hero fire on this direction
     */
    fire: function (direction) {
        return Direction.FIRE.toString() + "," + direction.toString();
    },

    /**
     * Says to Hero go to direction
     */
    go: function (direction) {
        return Direction.valueOf(direction.toString()).toString();
    },

    /**
     * Says to Hero goes to start point
     */
    reset: function () {
        return Direction.DIE.toString();
    }
}


export default Command;
