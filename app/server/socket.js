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
var Account = mongoose.model('Account');
var _ = require('lodash');

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

    /**
     * Converts an object's user ids to usernames
     * @param {Array} objects An array of one or more objects to replace ids with usernames
     * @param {Array} keys An array of one or more keys that contain user ids that should be replaced
     * @returns {Promise}
     */
    function userIdsToNames(objects, keys) {
        var userIds = {}, idsList, usersById;

        var addUserIds = function(value) {
            _.forEach(keys, function(key) {
                if (value[key]) {
                    userIds[value[key]] = true;
                }
            });
        };
        var addUserNames = function(value) {
            _.forEach(keys, function(key) {
                if (value[key]) {
                    value[key] = usersById[value[key]].user;
                }
            });
        };

        _.forEach(objects, function (obj) {
            _.forEach(obj, addUserIds);
        });

        idsList = _.keys(userIds);

        return Account.find({
            _id: {$in: idsList}
        }).select('_id user').exec().then(
            function(users) {
                usersById = _.keyBy(users, '_id');
                _.forEach(objects, function (obj) {
                    _.forEach(obj, addUserNames);
                });
                return objects;
            }
        );
    }

    function userIdsToNamesSimple(object, keys) {
        var userIds = {}, idsList, usersById;

        var addUserIds = function(value) {
            _.forEach(keys, function(key) {
                if (value[key]) {
                    userIds[value[key]] = true;
                }
            });
        };
        var addUserNames = function(value) {
            _.forEach(keys, function(key) {
                if (value[key]) {
                    value[key] = usersById[value[key]].user;
                }
            });
        };

        addUserIds(object);

        idsList = _.keys(userIds);

        return Account.find({
            _id: {$in: idsList}
        }).select('_id user').exec().then(
            function(users) {
                usersById = _.keyBy(users, '_id');
                addUserNames(object);
                return object;
            }
        );
    }

    var sendGamesList = function(socket) {
        var userId = socket.request.session.user._id;
        var publicGames, privateGames;

        // Get the open games
        var openGameQuery = Game.find({
            status: 'setup'
        }).where('player2').exists(false);
        var openGamePromise = openGameQuery.exec().then(function(games) {
            //console.log('Public Games: ', games);
            publicGames = games;
        });

        // Get the user's games
        var userGameQuery = Game.find({
            status: {
                '$ne': 'finished'
            }
        });
        userGameQuery.or(
            {
                player1: userId
            },
            {
                status: {
                    '$ne': 'finished'
                }
            }
        );
        userGameQuery.or(
            {
                player2: userId
            },
            {
                status: {
                    '$ne': 'finished'
                }
            }
        );
        var userGamePromise = userGameQuery.exec().then(function(games) {
            //console.log('Private Games: ', games);
            privateGames = games;
        });

        // Once both types of games have been found send them to the user
        Promise.all([openGamePromise, userGamePromise]).then(
            function() {
                // Change the IDs to usernames
                userIdsToNames([publicGames, privateGames], ['player1', 'player2']).then(
                    function() {
                        // Send the list of games
                        socket.emit('games-list', {
                            public: publicGames,
                            private: privateGames
                        });
                    },
                    function(err) {
                        // Some sort of error
                        console.warn("Query Error: ", err);
                        socket.emit('app-error', 'Problem loading games');
                    }
                );
            },
            function(err) {
                // One or both of the queries had an error
                console.warn('Error with getting a list of games: ', err);
                socket.emit('app-error', 'Error getting games');
            }
        )
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
            var newGame = {name: name, player1: user._id};
            var games = new Game(newGame);
            games.save(function (err, game) {
                if (err) {
                    console.warn("Error with 'game-add' socket event: ", err);
                    socket.emit('app-error', 'Error adding game to database');
                } else {
                    gameHubSocket.emit('game-add', game);
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
                            socket.emit('app-error', 'Failed to join game');
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
                    userIdsToNamesSimple(gameData.game, ['player1', 'player2']).then(
                        function() {
                            socket.emit('join', gameData);
                        },
                        function(err) {
                            console.warn('Problem getting game information', err);
                            socket.emit('app-error', 'Problem joining game');
                        }
                    );
                },
                function(err) {
                    console.warn('Problem getting game information', err);
                    socket.emit('app-error', 'Problem joining game');
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
