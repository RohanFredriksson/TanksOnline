const Player = require('./player.js');
// Projectile = require('./projectile.js');

module.exports = class Room {

    constructor(room,wss) {

        // Important Variables
        this.room = room;
        this.wss = wss;
        this.tickLength = 10;
        this.buyTime = 20000;

        // Player Variables
        this.players = [];
        this.currentTurn = 0;
        
        // Projectiles
        this.projectiles = [],
        
        // Game Variables
        this.started = false;
        this.inBuyPeriod = false;
        this.terrainSetting = null;

        // Map Variables
        this.map = {
            currentTerrainType: null,
            mapWidth: 100,
            terrain: [],
            trees: [],
            wind: 0
        }

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
                this.map.currentTerrainType = preset.name;
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
            this.map.currentTerrainType = preset.name;
            amplitude = preset.amplitude;
            treeDensity = preset.treeDensity;
        }

        var sampleDistance = 0.02;
        var randomOffset = randomIntFromInterval(0,255);
        this.map.terrain = [];

        var a = amplitude;
        var r = randomOffset;
        var s = sampleDistance;

        var i = 0;
        var n = this.map.mapWidth;
        while (i < n) {
            this.map.terrain.push(a * Math.pow(Math.sin(i * s - r),2) + 
                                  a * Math.pow(Math.cos(2 * i * s + 2 * r),2) + 
                                  a * Math.pow(Math.sin(12 * i * s + r),2));
            i = i + 1;
        }

    }

    addPlayer(id) {

        // Check if the player is already in the room.
        this.players.forEach(player => {
            if (player.id == id) {
                return;
            }
        });

        this.players.push(new Player(id));

        // If the room does not have any host.
        if (!this.hasHost()) {
            this.players[0].promote();
        }

        // Broadcast changes to all players.
        this.broadcast(JSON.stringify(this.toJSON()));
        
    }

    removePlayer(id) {

        // Find the player and then remove it.
        var i = 0;
        var n = this.players.length;
        while (i < n) {
            if (this.players[i].id == id) {
                this.players.splice(i,1);
                n = n - 1;
            }
            i = i + 1;
        }

        // If the room does not have a host anymore, then promote one player. 
        // If there are no players, the room will get closed in socket.js
        if (!this.hasHost()) {
            if (this.players.length != 0) {
                this.players[0].promote();
            }
        }

        // Broadcast changes to all players.
        this.broadcast(JSON.stringify(this.toJSON()));

    }

    isEmpty() {
        if (this.players.length == 0) {
            return true;
        }
        return false;
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
        var command = args.shift();

        // Start up sequence.
        if (player.isHost && !this.started) {

            // Set the terrain type.
            if (command == "choose_map_type") {
                this.terrainSetting = args[0];
                this.broadcast(JSON.stringify(this.toJSON()));
            } 
            
            // Start the game.
            else if (command == "start") {
                this.started = true;
                this.generateMap(this.terrainSetting);
                this.broadcast(JSON.stringify(this.toJSON()));
            }

        } 

    }

    tick() {

    }

    toJSON() {

        var playersJSONList = [];
        this.players.forEach(player => {
            playersJSONList.push(player.toJSON());
        });

        var projectilesJSONList = [];
        /*
        this.projectiles.forEach(projectile => {
            projectilesJSONList.push(projectile.toJSON());
        }); 
        */

        return {
            room: this.room,
            players: playersJSONList,
            currentTurn: this.currentTurn,
            projectiles: projectilesJSONList,
            started: this.started,
            inBuyPeriod: this.inBuyPeriod,
            terrainSetting: this.terrainSetting,
            map: this.map
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