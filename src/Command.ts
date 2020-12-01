import DirectionList from "./Direction";

 const Command = {

    /**
     * Says to Hero do nothing
     */
    doNothing: function () {
        return DirectionList.STOP.toString();
    },

    /**
     * Reset current level
     */
    die: function () {
        return DirectionList.DIE.toString();
    },

    /**
     * Says to Hero jump to direction
     */
    jump: function (direction) {
        return DirectionList.JUMP.toString() + "," + direction.toString();
    },

    /**
     * Says to Hero pull box on this direction
     */
    pull: function (direction) {
        return DirectionList.PULL.toString() + "," + direction.toString();
    },

    /**
     * Says to Hero fire on this direction
     */
    fire: function (direction) {
        return DirectionList.FIRE.toString() + "," + direction.toString();
    },

    /**
     * Says to Hero go to direction
     */
    go: function (direction) {
        return DirectionList.valueOf(direction.toString()).toString();
    },

    /**
     * Says to Hero goes to start point
     */
    reset: function () {
        return DirectionList.DIE.toString();
    }
}


export default Command;
