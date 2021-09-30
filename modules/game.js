Player = require('./player.js');
// Projectile = require('./projectile.js');

module.exports = class Room {

    constructor(room) {

        // Important Variables
        this.room = room;
        this.maxPlayers = 4;
        this.tickLength = 10;
        this.buyTime = 20000;
        this.broadcastChanges = false;

        // Player Variables
        this.players = [];
        var i = 0;
        var n = this.maxPlayers;
        while (i < n) {
            this.players.push(null);
            i = i + 1;
        }
        this.currentTurn = 0;

        // Game Variables
        this.started = false;
        this.inBuyPeriod = false;
        this.terrainSetting = null;

        // Map Variables
        this.currentMapType = null;
        this.mapWidth = 100;
        this.terrain = [];
        this.trees = [];
        this.projectiles = [];
        this.wind = 0;

    }

    generateMap(mapType) {

        var amplitude = 0;
        var treeDensity = 0;

        var presets = [{
            name: 'desert',
            amplitude: 0.05,
            treeDensity: 0
        },
        {   
            name: 'mountains',
            amplitude: 0.3,
            treeDensity: 0.4
        },
        {
            name: 'forest',
            amplitude: 0.12,
            treeDensity: 0.7
        }];

        var mapChosen = false;

        // Find the map in the preset list.
        presets.forEach(preset => {
            if (mapType == preset.name) {
                this.currentMapType = preset.name;
                amplitude = preset.amplitude;
                treeDensity = preset.treeDensity;
                mapChosen = true;
            }
        });

        // Random Method.
        function randomIntFromInterval(min, max) { // min and max included 
            return Math.floor(Math.random() * (max - min + 1) + min)
        }

        // If map not in preset list, just choose a random preset.
        if (!mapChosen) {
            preset = presets[randomIntFromInterval(0,presets.length-1)];
            this.currentMapType = preset.name;
            amplitude = preset.amplitude;
            treeDensity = preset.treeDensity;
        }

        var sampleDistance = 0.02;
        var randomOffset = randomIntFromInterval(0,255);
        this.terrain = [];

        var a = amplitude;
        var r = randomOffset;
        var s = sampleDistance;

        var i = 0;
        var n = this.mapWidth;
        while (i < n) {
            this.terrain.push(a * Math.pow(Math.sin(i * s - r),2) + 
                              a * Math.pow(Math.cos(2 * i * s + 2 * r),2) + 
                              a * Math.pow(Math.sin(2 * Math.pi * i * s + r),2));
            i = i + 1;
        }

        console.log(this.terrain);

    }

    addPlayer(id) {

        // Check if the player is already in the room.
        this.players.forEach(player => {
            if (player != null) {
                if (player.id == id) {
                    return;
                }
            }
        });

        // Add the new player to the list if there is a free spot.
        var i = 0;
        var n = this.players.length;
        while (i < n) {
            if (this.players[i] == null) {
                this.players[i] = new Player(id);
                return;
            }
            i = i + 1;
        }
        
    }

    removePlayer(id) {

        // Find the player and then remove it.
        var i = 0;
        var n = this.players.length;
        while (i < n) {
            if (this.players[i] != null) {
                if (this.players[i].id == id) {
                    this.players[i] = null;
                }
            }
            i = i + 1;
        }

    }

    isEmpty() {

        // Check if all players are null.
        var i = 0;
        var n = this.players.length;
        while (i < n) {
            if (this.players[i] != null) {
                return false;
            }
            i = i + 1;
        }
        return true;

    }

    input(id,input) {

    }

    tick() {

    }

    toJSON() {

    }

}