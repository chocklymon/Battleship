/**
 * WebSockets code.
 * Resources:
 * http://socket.io/docs/
 * http://psitsmike.com/2011/10/node-js-and-socket-io-multiroom-chat-tutorial/
 * http://stackoverflow.com/a/10099325
 */
var Promise = require('bluebird');
var mongoose = require('mongoose');
var Game = mongoose.model('Game');
var Ship = mongoose.model('Ship');
var Board = mongoose.model('Board');

module.exports = function(server, sessionHandler) {
    // Example for making a simple chat application
    var io = require('socket.io')(server);

    // Authorization Handling Code
    io.use(function(socket, next) {
        // First load the session from the socket request
        sessionHandler(socket.request, {}, next);
    });
    io.use(function(socket, next) {
        // Second verify that the user is logged in
        if (socket.request.session.user == null) {
            next(new Error('Not authorized'));
        } else {
            next();
        }
    });

    var sendGamesList = function(socket) {
        var username = socket.request.session.user.user;
        var foundGames = {
            public: [],
            private: []
        };

        // Get the open games
        var openGameQuery = Game.find({
            status: 'setup'
        }).where('player2').exists(false);
        var openGamePromise = openGameQuery.exec(function(err, games) {
            if (err) {
                throw err;
            }
            foundGames.public = games;
        });

        // Get the user's games
        var userGameQuery = Game.find({
            status: {
                '$ne': 'finished'
            }
        });
        userGameQuery.or(
            {
                player1: username
            },
            {
                status: {
                    '$ne': 'finished'
                }
            }
        );
        userGameQuery.or(
            {
                player2: username
            },
            {
                status: {
                    '$ne': 'finished'
                }
            }
        );
        var userGamePromise = userGameQuery.exec(function(err, games) {
            if (err) {
                throw err;
            }
            foundGames.public = games;
        });

        // Once both types of games have been found send them to the user
        Promise.all([openGamePromise, userGamePromise]).then(
            function() {
                // Send the list of games
                socket.emit('games-list', foundGames);
            },
            function(err) {
                // One or both of the queries had an error
                console.warn('Error with getting a list of games: ', err);
                socket.emit('error', 'Error getting games');
            }
        )
    };

    // GameHub
    var gameHubSocket = io.of('/games');

    gameHubSocket.on('connection', function(socket) {
        // Save the user information for easy access
        var user = socket.request.session.user;

        // Send a list of all current games when the user joins
        sendGamesList(socket);

        // Handle events //

        // Send a list of games when requested
        socket.on('games-list', function() {
            sendGamesList(socket);
        });

        // Handle adding a new game
        socket.on('game-add', function(name) {
            // Create and add a new game to the database
            var newGame = {name: name, player1: user.user};
            var games = new Game(newGame);
            games.save(function (err, games) {
                if (err) {
                    console.warn("Error with 'game-add' socket event: ", err);
                    socket.emit('error', 'Error adding game to database');
                } else {
                    gameHubSocket.emit('game-add', newGame);
                }
            });
        });

        // Handle a player joining a game
        socket.on('game-join', function(game) {
            // TODO mark a game as joined
            gameHubSocket.emit('game-join', game);
        });

        // Handle a player sending a chat message
        socket.on('chat-message', function(msg) {
            //console.log('Socket.io Message Received: ' + msg);
            gameHubSocket.emit('chat-message', {user: user.user, msg: msg});
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
