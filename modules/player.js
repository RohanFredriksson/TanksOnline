module.exports = class Player {

    constructor(id) {
        this.id = id;
        this.isHost = false;
        this.hp = 100;
        this.location = {x: 0, y: 0}
    }

}