var mongoose = require('mongoose');
var Game = mongoose.model('Game');
var Ship = mongoose.model('Ship');
var Board = mongoose.model('Board');



module.exports = function (app) {

    app.get('/mongo.html', function (req, res, next) {
        res.sendFile('mongo.html', {
				root: 'app/public/'
			});
    });

    //MongoDB schema for Game and Board
    app.get('/mongo_games', function (req, res, next) {
        console.log(req);
        Game.find(function (err, games) {
            if (err) {
                console.log(err);
                return next(err);
            }
            res.json(games);
        });
    });

    app.post('/mongo_games', function (req, res, next) {
        var games = new Game(req.body);
        games.save(function (err, games) {
            if (err) {
                return next(err);
            }
            res.json(games);
        });
    });

    app.get('/mongo_boards', function (req, res, next) {
        Board.find(function (err, boards) {
            if (err) {
                return next(err);
            }
            res.json(boards);
        });
    });

    app.post('/mongo_boards', function (req, res, next) {
        console.log("mongo_boards: made it");
        var boards = new Board(req.body);
        boards.save(function (err, boards) {
            if (err) {
                return next(err);
            }
            res.json(boards);
        });
    });

    app.get('/mongo_ships', function (req, res, next) {
        Ship.find(function (err, ships) {
            if (err) {
                console.log(err);
                return next(err);
            }
            res.json(ships);
        });
    });

    app.post('/mongo_ships', function (req, res, next) {
        var ships = new Ship(req.body);
        ships.save(function (err, ships) {
            if (err) {
                return next(err);
            }
            res.json(ships);
        });
    });

};