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
        ERROR: 'error',
        NOTICE: 'notice'
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
        socket.on('game-join', function(gameId) {
            //console.log("game-join", gameId);
            // Have the user join the given game
            Game.findById(gameId).exec().then(
                function(game) {
                    if (game.player1 == user._id) {
                        // Player is the first player
                        socket.emit('game-join', gameId);
                    } else if (!game.player2) {
                        // Player is joining as the second player
                        game.player2 = user._id;
                        game.save(function(err) {
                            if (err) {
                                console.warn('Player two unable to join: ', err);
                                emitError(socket, 'Failed to join game');
                            } else {
                                // Player was able to join, update all clients about this
                                Utils.userIdsToNames(game, ['player1', 'player2'], true).then(
                                    function() {
                                        gameHubSocket.emit('game-update', game);
                                        socket.emit('game-join', gameId);
                                    },
                                    function() {
                                        console.warn('Problem getting user names: ', err);
                                        emitError(socket, 'Failed to join game');
                                    }
                                );

                            }
                        });
                    } else if (game.player2 == user._id) {
                        // Player is the scond player
                        socket.emit('game-join', gameId);
                    } else {
                        // Attempting to join a game that the player isn't part of
                        emitError(socket, 'Game is already filled', errorTypes.WARNING);
                    }
                },
                function(err) {
                    console.warn('Problem during game join: ', err);
                    emitError(socket, 'Failed to join game');
                }
            );
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
	sendUserInfo(socket);

        socket.on('join', function(gameId) {
            //console.log('User ', user._id, ' joined game ', gameId);
            // Get the game data
            var gameData = {};
            var gameFoundPromise = Game.findById(gameId).exec().then(function(game) {
                // Verify the user is in this game
                if (game.player1 == user._id || game.player2 == user._id) {
                    // User in the game
                    socket.join(gameId);
                    socket.gameId = gameId;

                    gameData.game = game;
                } else {
                    // Attempted to join a game that they are not part of
                    emitError(socket, 'Game already filled', errorTypes.WARNING, true);
                }
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
                    emitError(socket, 'Problem joining game', errorTypes.ERROR, true);
                }
            );
        });
        socket.on('disconnect', function() {
            // TODO user left game code
            console.log('User left game: ', socket.gameId);
        });

        // Room (game) specific events
        socket.on('fire-shot', function(shot) {
            console.log('Shot fired: ', socket.gameId);
            if (checkInGame(socket)) {
                var shotData = {hit: false, coords: shot, player: user._id};

                Utils.getGameData(socket.gameId).then(function(gameData) {
                    //console.log(gameData);
                    if (gameData.game.status == 'setup') {
                        emitError(socket, 'Unable to fire shots during setup', errorTypes.NOTICE);
                    } else if (gameData.game.status == 'EndGame') {
                        emitError(socket, 'Unable to fire shots in a completed game', errorTypes.NOTICE);
                    } else {
                        var enemyBoard, playerBoard;
                        if (gameData.game.status == 'PlayerOneTurn') {
                            enemyBoard = gameData.board2;
                            playerBoard = gameData.board1;
                            gameData.game.status = 'PlayerTwoTurn';
                        } else {
                            enemyBoard = gameData.board1;
                            playerBoard = gameData.board2;
                            gameData.game.status = 'PlayerOneTurn';
                        }

                        if (enemyBoard[shot].isOccupied) {
                            // Hit
                            playerBoard[shot].type = 'hit';
                            shotData.hit = true;
                        } else {
                            // Miss
                            playerBoard[shot].type = 'miss';
                        }
                        return Promise.all([playerBoard.save(), gameData.game.save()]).then(
                            function() {
                                // Data updated and shot was registered
                                battleSocket.to(socket.gameId).emit('fire-shot', shotData);
                            },
                            function(err) {
                                console.warn('Problem with fire-shot event: ', err);
                                emitError(socket, 'Error with shot', errorTypes.ERROR);
                            }
                        );
                    }
                });
            }
        });
        socket.on('setup-ready', function(shipLocations) {
            console.log('setup finished: ', shipLocations);
            if (checkInGame(socket)) {
                // TODO handle a player finished setting up their board
                var setupState = {};
                Utils.getGameData(socket.gameId).exec().then(
                    function(gameData) {
                        if (gameData.game.player1 == user._id) {
                            gameData.game.player1_ready = true;
                        } else {
                            gameData.game.player2_ready = true;
                        }
                        setupState.player1Ready = gameData.game.player1_ready;
                        setupState.player2Ready = gameData.game.player2_ready;
                        return gameData.game.save();
                    }
                ).then(
                    function() {
                        battleSocket.to(socket.gameId).emit('setup-ready', setupState);
                    },
                    function(err) {
                        console.warn('Problem marking the setup as ready: ', err);
                        emitError(socket, 'Unable to mark as setup complete', errorTypes.ERROR);
                    }
                );
            }
        });
        socket.on('chat-message', function(msg) {
            console.log('Chat message', msg);
            if (checkInGame(socket)) {
                battleSocket.to(socket.gameId).emit('chat-message', {user: user.user, msg: msg});
            }
        });
    });
};
