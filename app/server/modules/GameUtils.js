
var Promise = require('bluebird');
var mongoose = require('mongoose');
var Game = mongoose.model('Game');
var Ship = mongoose.model('Ship');
var Board = mongoose.model('Board');
var Account = mongoose.model('Account');
var _ = require('lodash');

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

/**
 * Gets the games for a user.
 * @param userId
 * @returns {Promise}
 */
function getGamesFor(userId) {
    var publicGames, privateGames;

    // Get the open games
    var openGameQuery = Game.find({
        player1: {'$ne': userId}
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
    return Promise.all([openGamePromise, userGamePromise]).then(
        function() {
            // Change the IDs to usernames
            return userIdsToNames([publicGames, privateGames], ['player1', 'player2']).then(
                function() {
                    return {
                        public: publicGames,
                        private: privateGames
                    };
                }
            );
        }
    );
}

var getGameData = function(gameId) {
    return Board.find({
        game_id: gameId
    }).exec().then(function(boards) {
        return Game.findById(gameId).exec().then(function(game) {
            if (boards.length == 0) {
                // Create the boards
                var board1 = new Board({game_id: game._id, player_id: game.player1});
                var board2 = new Board({game_id: game._id, player_id: game.player2});
                return Promise.all([board1.save(), board2.save()]).then(function(board1, board2) {
                    return {board1: board1, board2: board2, game: game};
                });
            } else {
                return {board1: boards[0], board2: boards[1], game: game};
            }
        });
    });
};

module.exports = {
    getGamesFor: getGamesFor,
    getGameData: getGameData,
    userIdsToNames: function(objects, keys, simple) {
        if (simple) {
            return userIdsToNames([[objects]], keys)
        } else {
            return userIdsToNames(objects, keys);
        }
    }
};
