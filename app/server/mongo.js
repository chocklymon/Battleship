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
    
    //Returns a GameSchema for all games without a player2 that are in setup
    //Needs to exclude games where the user is present
    app.get('/mongo_findgames', function (req, res, next) {
        
        var query = Game.find({
            status: 'setup'
        }).where('player2').exists(false);
        query.exec(function (err, games) {
            if (err) {
                console.log(err);
                return next(err);
            }
            res.json(games);
        });
    });

    //Returns a GameSchema for all games with the player that are not finished
    app.get('/mongo_findplayergames', function (req, res, next) {
        var query = Game.find({
            status: {
                '$ne': 'finished'
            }
        });
        query.or({
            player1: req.session.user.user
        }, {
            status: {
                '$ne': 'finished'
            }
        });
        query.or({
            player2: req.session.user.user
        }, {
            status: {
                '$ne': 'finished'
            }
        });
        query.exec(function (err, games) {
            if (err) {
                console.log(err);
                return next(err);
            }
            res.json(games);
        });
    });

    //Creates a new game with a player1, player1_ships, and player1_boards. Default is setup.
    //The request body needs: {name: name, player1: player1}
    app.post('/mongo_newgame', function (req, res, next) {
        
        var name = req.body.name;
        var player1 = req.body.player1;
        
        var games = new Game();

        games.name = name;
        games.player1 = player1;

        var ships = new Ship();
        ships.game_id = games.id;
        ships.player_name = player1;
        ships.save(function (err, ships) {
            if (err) {
                return next(err);
            }
            console.log("ships save");
        });

        var boards = new Board();
        boards.game_id = games.id;
        boards.player_name = player1;
        boards.save(function (err, ships) {
            if (err) {
                return next(err);
            }
            console.log("boards save");
        });

        games.player1_ships = ships.id;
        games.player1_board = boards.id;

        games.save(function (err, games) {
            if (err) {
                return next(err);
            }
            console.log(games);
            res.json(games);
        });
    });

    //Updates GameSchema to include player2 details.
    //The request body needs: {game_id: "the object id for the game", p2_name: "joining players username"}
    app.put('/mongo_player2', function (req, res, next) {
        var game_id = req.body.id;
        var p2_name = req.body.p2_name;
        
        var ships = new Ship();
        ships.game_id = game_id;
        ships.player_name = p2_name;
        ships.save(function (err, ships) {
            if (err) {
                return next(err);
            }
            console.log("ships save");
        });

        var boards = new Board();
        boards.game_id = game_id;
        boards.player_name = p2_name;
        boards.save(function (err, ships) {
            if (err) {
                return next(err);
            }
            console.log("boards save");
        });

        var player2_ships = ships.id;
        var player2_board = boards.id;

        Game.findOneAndUpdate({_id: game_id}, {player2: p2_name, player2_ships: player2_ships, player2_board: player2_board}, {
                safe: true
            },
            function (err, model) {
                console.log(err);
                res.json(model);
            }
        );
    });
    
    //Updates chat history
    //The request body needs: {id: "the game's id", message: "string to be added to chat history"}
    app.put('/mongo_updatehistory', function (req, res, next) {
        var message = req.body.message;
        var id = req.body.id;

        Game.findOneAndUpdate({
                _id: req.body.id
            }, {
                $push: {
                    history: message
                }
            }, {
                safe: true,
                upsert: true
            },
            function (err, model) {
                console.log(err);
                res.json(model);
            }
        );
    });

    //Update Game Status
    //The request body needs: {id: "game id", status: "p1_turn, p2_turn, or finished"}
    app.put('/mongo_updatestatus', function (req, res, next) {
        var status = req.body.status;
        var id = req.body.id;

        Game.findOneAndUpdate({_id: id}, {status: status}, {
                safe: true
            },
            function (err, model) {
                console.log(err);
                res.json(model);
            }
        );
    });
    
    //Find ShipSchema for game id and player name
    //The request body needs: {game_id: "the id for the associated game", user: "the user the ships belong to"}
    app.get('/mongo_findships', function (req, res, next) {
        var game_id = req.body.game_id;
        var user = req.body.user;
        
        //var game_id = "56fc8eaf03eef06b28c72431";
        //var user = "fmgustave";
        
        var query = Ship.find({game_id: game_id});
        query.find({player_name: user});
        //query.or([{player1: user}, {game_id: game_id}]);
        query.exec(function (err, ships) {
            if (err) {
                console.log(err);
                return next(err);
            }
            res.json(ships);
        });
    });
    
    //Find BoardSchema for game id and player name
    //The request body needs: {game_id: "the id for the associated game", user: "the user the board belongs to"}
    app.get('/mongo_findboards', function (req, res, next) {
        var game_id = req.body.game_id;
        var user = req.body.user;
        
        //var game_id = "56fc8eaf03eef06b28c72431";
        //var user = "test";
        
        var query = Board.find({game_id: game_id});
        query.find({player_name: user});
        //query.or([{player1: user}, {game_id: game_id}]);
        query.exec(function (err, boards) {
            if (err) {
                console.log(err);
                return next(err);
            }
            res.json(boards);
        });
    });
    
    //Update Board with Hit or Miss
    app.put('/mongo_updateboard', function (req, res, next) {
        
        console.log(req.body);
        var id = req.body.id;
        var position = req.body.position;
        var status = req.body.status;
        
        var this_key = position;
        var push = {};
        push[this_key] = status;   // here, it will use the variable
        
        console.log(push);
        
        Board.findOneAndUpdate({_id: id}, {$set: push}, {new: true},
            function (err, model) {
                console.log(err);
                res.json(model);
            }
        );
    });
    
    //Updates ShipSchema to include positions and locations
    //The request body needs an object that matches ShipSchema.
    //The id needed is the objectid for the board itself
    app.put('/mongo_updateships', function (req, res, next) {
        
        var id = req.body.id;
        var battleship_position = req.body.battleship_position;
        var battleship_location = req.body.battleship_location;
        var carrier_position = req.body.carrier_position;
        var carrier_location = req.body.carrier_location;
        var cruiser_position = req.body.cruiser_position;
        var cruiser_location = req.body.cruiser_location;
        var submarine_position = req.body.submarine_position;
        var submarine_location = req.body.submarine_location;
        var destroyer_position = req.body.destroyer_position;
        var destroyer_location = req.body.destroyer_location;
        
        Ship.findOneAndUpdate({_id: id}, req.body, {new: true},
            function (err, model) {
                console.log(err);
                res.json(model);
            }
        );
    });

    //Go to this link to view the games in your MongoDB
    app.get('/mongo_games', function (req, res, next) {
        console.log(req.session.user.user);
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

    //Go to this link to view the boards in your MongoDB
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

    //Go to this link to view the ships in your MongoDB
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