// Node Modules
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const sha256 = require('js-sha256').sha256;

// My Modules
const Room = require('./modules/game.js')

const app = express();

// Initialize a http server.
const server = http.createServer(app);

// Initialize the WebSocket server instance.
const wss = new WebSocket.Server({ server });

users = new Map();
rooms = new Map();

wss.on('connection', ws => {

    // Get the id of the user.
    ws.id = sha256(ws._socket.remoteAddress);

    // Add the user to the map.
    users.set(ws.id,null);
    console.log("+ User: " + ws.id);

    // When the user sends an input.
    ws.on('message', message => {

        // Parse the message into JSON.
        try {
            message = JSON.parse(message);
        } catch (e) {
            // If the message is not JSON, return.
            return;
        }
        
        command = message.command;
        args = message.args;

        // Check if the message had the right keys. If not return.
        if (command == null || args == null) {
            return;
        }

        // Check if args is an array. If not return.
        if (!Array.isArray(args)) {
            return;
        }
        
        // User wants to join a room.
        if (command == 'join') {

            // If no room number provided return.
            if (args.length == 0) {
                return;
            }

            // Get the room number from the arguments.
            roomNumber = args[0];

            // Check whether the room exists.
            if (rooms.has(roomNumber)) {

                // Get the room object for the room.
                room = rooms.get(roomNumber);

                // Check if the player is not in a room.
                if (users.get(ws.id) == null) {

                    // Add player to the room.
                    room.addPlayer(ws.id);
                    console.log("+ User: " + ws.id + " in Room: " + room.room);

                    // Update the player map to include the room that they're in.
                    users.set(ws.id,roomNumber);

                }
            }
            
        } else if (command == 'create') {

            // Check if the player is not in a room.
            if (users.get(ws.id) == null) {

                // Create a new room.
                room = new Room(generateNewRoomNumber(), wss);

                // Add room to the rooms map.
                rooms.set(room.room,room);
                console.log("+ Room: " + room.room);

                // Add player to the room.
                room.addPlayer(ws.id);
                console.log("+ User: " + ws.id + " in Room: " + room.room);

                // Update the player map to include the room that they're in.
                users.set(ws.id,room.room);

            }

        } else if (command == 'input') {

            // Get the room the player is in.
            roomNumber = users.get(ws.id)

            // Check if the player is in a room.
            if (roomNumber != null) {

                // If no input was given, return.
                if (args.length == 0) {
                    return;
                }

                // Get the room number.
                room = rooms.get(roomNumber);

                // Send the input to the room, with the given id.
                room.input(ws.id, args[0]);

            }

        }

    });

});

// Keep track of user disconnections.
setInterval(function () {

    // Create a set to store the active connections.
    currentUsers = new Set();

    // Store all active users in the set.
    wss.clients.forEach(client => {
        currentUsers.add(client.id);    
    });

    // Get a list of all users that are stored in the system.
    userList = Array.from(users.keys());

    // Attempt to remove all users that are disconnected but are still in the system.
    userList.forEach(user => {

        // If the user is in the map but not connected, try to remove this user.
        if (!currentUsers.has(user)) {
            
            // Get the room number that the user is in.
            usersRoomNumber = users.get(user);

            // If the player was in a room remove the player from the room.
            if (usersRoomNumber != null) {

                // Find the room object of the given room number.
                usersRoom = rooms.get(usersRoomNumber);

                // Remove the player from the room.
                usersRoom.removePlayer(user);
                console.log("- User: " + user + " in Room: " + usersRoom.room);

                // If removing the player makes the room empty remove the room.
                if (usersRoom.isEmpty()) {
                    rooms.delete(usersRoom.room);
                    console.log("- Room: " + usersRoom.room);
                }

            }

            // Remove the player from the users map.
            users.delete(user);
            console.log("- User: " + user);

        }

    });

}, 10);

// Start server.
server.listen(process.env.PORT || 8999, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});

// Extra Methods

// When creating a new room to store, its important that each room has a unique identifier.
// This method generates a new identifier for a room, ensuring that there are no duplicates.
function generateNewRoomNumber() {

    // Get all current room numbers.
    var currentRoomNumbers = Array.from(rooms.keys());

    // Create a random string for the room number.
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
    for ( var i = 0; i < 4; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // If there is a collision with one of the existing room numbers, generate a new number.
    if (currentRoomNumbers.includes(result)) {
        return this.generateNewRoomNumber();
    }

    // Else return the new number.
    return result;
    
}