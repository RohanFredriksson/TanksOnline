Player = require('./player.js');
// Projectile = require('./projectile.js');

module.exports = class Room {

    constructor(room,wss) {

        // Important Variables
        this.room = room;
        this.wss = wss;
        this.maxPlayers = 4;
        this.tickLength = 10;
        this.buyTime = 20000;

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
        this.currentTerrainType = null;
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
                this.currentTerrainType = preset.name;
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
            var preset = presets[randomIntFromInterval(0,presets.length-1)];
            this.currentTerrainType = preset.name;
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
                              a * Math.pow(Math.sin(12 * i * s + r),2));
            i = i + 1;
        }

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
                // If the room does not have a host, make this player the host.
                if (!this.hasHost()) {
                    this.players[i].isHost = true;
                }
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

        // If the room does not have a host anymore, then promote one player. 
        // If there are no players, the room will get closed in socket.js
        if (!this.hasHost()) {
            i = 0;
            while (i < n) {
                if (this.players[i] != null) {
                    this.players[i].isHost = true;
                    return;
                }
                i = i + 1;
            }
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

    hasHost() {

        // Check if there is a host.
        var i = 0;
        var n = this.players.length;
        while (i < n) {
            if (this.players[i] != null) {
                if (this.players[i].isHost) {
                    return true;
                }
            }
            i = i + 1;
        }
        return false

    }

    input(id,input) {

        // Check if the id given is in the room.
        var playerNumber = -1;
        var i = 0;
        var n = this.players.length;
        while (i < n) {
            if (this.players[i] != null) {
                if (this.players[i].id == id) {
                    playerNumber = i;
                }
            } 
            i = i + 1;
        }

        // If the player is not in the room return.
        if (playerNumber == -1) {
            return;
        }

        // Get the player object for the given id.
        var player = this.players[playerNumber];

        // Get the command and the arguments.
        var args = input.split(" ");
        var command = args.pop();

        // Start up sequence.
        if (player.isHost && !this.started) {

            // Set the terrain type.
            if (command == "choose_map_type") {
                this.terrainSetting = arguments[0];
            } 
            
            // Start the game.
            else if (command == "start") {
                this.started = true;
                this.generateMap();
                this.broadcast(JSON.stringify(this.toJSON()));
            }

        } 

    }

    tick() {

    }

    toJSON() {
        return {
            terrainType: this.currentTerrainType,
            terrain: this.terrain
        };
    }

    broadcast(message) {

        var users = new Set();

        this.players.forEach(player => {
            if (player != null) {
                users.add(player.id);
            }
        });

        this.wss.clients.forEach(client => {
            if (users.has(client.id)) {
                client.send(message);
            }
        });

    }

}