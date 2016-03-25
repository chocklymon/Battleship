/**
 * WebSockets code.
 * Resources:
 * http://socket.io/docs/
 * http://psitsmike.com/2011/10/node-js-and-socket-io-multiroom-chat-tutorial/
 * http://stackoverflow.com/a/10099325
 */

module.exports = function(server) {
    // Example for making a simple chat application
    var io = require('socket.io')(server);

    // GameHub
    var gameHubSocket = io.of('/games');

    gameHubSocket.on('connection', function(socket) {
        //console.log('Socket.io Connection Received');

        // Send a list of all current games when the user joins
        // TODO
        socket.emit('games-list', {});


        socket.on('game-add', function(game) {
            // TODO add a game
            gameHubSocket.emit('game-add', game);
        });
        socket.on('game-join', function(game) {
            // TODO mark a game as joined
            gameHubSocket.emit('game-join', game);
        });
        socket.on('chat-message', function(msg) {
            //console.log('Socket.io Message Received: ' + msg);
            gameHubSocket.emit('chat-message', msg);
        });
    });

    // Game
    var battleSocket = io.of('/battle');

    battleSocket.on('connection', function(socket) {
        socket.on('join', function(gameId) {
            // TODO user joined game code
            socket.join(gameId);
            socket.gameId = gameId;
        });
        socket.on('disconnect', function() {
            // TODO user left game code
            console.log('User left game: ', socket.gameId);
        });

        // Room (game) specific events
        socket.on('fire-shot', function(shot) {
            if (socket.gameId) {
                // TODO handle a player firing a shot
                battleSocket.to(socket.gameId).emit('fire-shot', shot);
            }
        });
        socket.on('setup-ready', function(shipLocations) {
            if (socket.gameId) {
                // TODO handle a player finished setting up their board
                battleSocket.to(socket.gameId).emit('setup-ready', socket.id);
            }
        });
        socket.on('chat-message', function(msg) {
            if (socket.gameId) {
                battleSocket.to(socket.gameId).emit('chat-message', msg);
            }
        });
    });
};
