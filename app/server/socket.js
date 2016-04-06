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
var Utils = require('./modules/GameUtils');

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

    // Functions //
    var errorTypes = {
        WARNING: 'warning',
        ERROR: 'error'
    };

    var emitError = function(socket, errorMsg, type, redirect, sendTo) {
        if (!type) {
            type = errorTypes.WARNING;
        }
        if (redirect && !sendTo) {
            sendTo = '/';
        }
        socket.emit('app-error', {
            msg: errorMsg,
            type: type,
            redirect: redirect,
            navigateTo: sendTo
        });
    };

    var sendGamesList = function(socket) {
        var userId = socket.request.session.user._id;
        Utils.getGamesFor(userId).then(
            function(games) {
                //console.log(games);
                socket.emit('games-list', games);
            },
            function(err) {
                console.warn('Error with getting a list of games: ', err);
                emitError(socket, 'Error getting games');
            }
        );
    };

    var sendUserInfo = function(socket) {
        var userInfo = {
            'username': socket.request.session.user.user,
            'id': socket.request.session.user._id
        };
        socket.emit('user-info', userInfo);
    };

    var checkInGame = function(socket) {
        if (socket.gameId) {
            return true;
        } else {
            socket.emit('rejoin', true);
            return false;
        }
    };

    // GameHub
    var gameHubSocket = io.of('/games');

    gameHubSocket.on('connection', function(socket) {
        // Save the user information for easy access
        var user = socket.request.session.user;

        // Send a list of all current games and the user's datawhen the user joins
        sendGamesList(socket);
        sendUserInfo(socket);

        // Handle events //

        // Send a list of games when requested
        socket.on('games-list', function() {
            sendGamesList(socket);
        });

        // Send the users information when requested
        socket.on('user-info', function() {
            sendUserInfo(socket);
        });

        // Handle adding a new game
        socket.on('game-add', function(name) {
            // Create and add a new game to the database
            var newGame = {name: name, player1: user._id};
            var games = new Game(newGame);
            games.save(function (err, game) {
                if (err) {
                    console.warn("Error with 'game-add' socket event: ", err);
                    emitError(socket, 'Error adding game to database');
                } else {
                    // Add the usernames to the game and then send out to all players
                    Utils.userIdsToNames(game, ['player1', 'player2'], true).then(
                        function() {
                            gameHubSocket.emit('game-add', game);
                        },
                        function(err) {
                            console.warn("Error with 'game-add' socket event: ", err);
                            emitError(socket, 'Error adding game');
                        }
                    );
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
        // Save the user information for easy access
        var user = socket.request.session.user;

        socket.on('join', function(gameId) {
            // TODO user joined game code
            console.log('User ', user._id, ' joined game ', gameId);
            socket.join(gameId);
            socket.gameId = gameId;

            var gameData = {};
            var gameFoundPromise = Game.findById(gameId).exec().then(function(game) {
                if (game.player1 != user._id && !game.player2) {
                    game.player2 = user._id;
                    game.save(function(err) {
                        if (err) {
                            console.warn('Player two unable to join', err);
                            emitError(socket, 'Failed to join game');
                        }
                    });
                }

                gameData.game = game;
            });
            var boardFoundPromise = Board.findOne({
                game_id: gameId,
                player_id: user._id
            }).exec().then(function(board) {
                gameData.board = board;
            });

            Promise.all([gameFoundPromise, boardFoundPromise]).then(
                function() {
                    Utils.userIdsToNames(gameData.game, ['player1', 'player2'], true).then(
                        function() {
                            socket.emit('join', gameData);
                        },
                        function(err) {
                            console.warn('Problem getting game information', err);
                            emitError(socket, 'Problem joining game');
                        }
                    );
                },
                function(err) {
                    console.warn('Problem getting game information', err);
                    emitError(socket, 'Problem joining game');
                }
            );
        });
        socket.on('disconnect', function() {
            // TODO user left game code
            console.log('User left game: ', socket.gameId);
        });

        // Room (game) specific events
        socket.on('fire-shot', function(shot) {
            console.log('Shot fired');
            if (checkInGame(socket)) {
                // TODO handle a player firing a shot
                battleSocket.to(socket.gameId).emit('fire-shot', shot);
            }
        });
        socket.on('setup-ready', function(shipLocations) {
            console.log('setup finished');
            if (checkInGame(socket)) {
                // TODO handle a player finished setting up their board
                battleSocket.to(socket.gameId).emit('setup-ready', socket.id);
            }
        });
        socket.on('chat-message', function(msg) {
            console.log('Chat message', msg);
            if (checkInGame(socket)) {
                battleSocket.to(socket.gameId).emit('chat-message', msg);
            }
        });
    });
};
