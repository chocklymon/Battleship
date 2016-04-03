
var battleship = angular.module('battleship', ['ngRoute']);

// Setup the Routes
battleship.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
        $routeProvider
            .when('/gamehub', {
                templateUrl: '/views/gamehub.html',
                controller: 'gamehub'
            })
            .when('/game', {
                templateUrl: '/views/battle.html',
                controller: 'battleController'
            })
            .otherwise('/gamehub');

        $locationProvider.html5Mode(true);
    }]
);


// ----------------------
// Factories and Services

/**
 * The IO factory wraps the socket.io library so that calls to it will automatically trigger an update to the views
 * in angular.
 */
battleship.factory('io', ['$rootScope', function($rootScope) {
    var socket = null;
    var socketWrapper = {
        on: function(event, callback) {
            socket.on(event, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };

    return function(namespace) {
        socket = io(namespace);
        return socketWrapper;
    };
}]);


// ----------------------
//     Controllers

battleship.controller('gamehub', ['$scope', 'io', function($scope, io) {
    var socket = io('/games');

    // Define the socket events
    socket.on('game-add', function(game) {
        // TODO get the currently logged in user.
        //if (game.player1 == currentUser) {
        //    $scope.games.private.push(game);
        //} else {
            $scope.games.public.push(game);
        //}
    });
    socket.on('games-list', function(games) {
        if (games) {
            $scope.games = games;
        }
    });

    $scope.games = {
        public: [],
        private: []
    };
    $scope.openCreateGameDialog = function() {
        $(".createGameOverlay").css("display", "block");
        $(".createGameModal").css("display", "block");
    };
    $scope.createGame = function() {
        //console.log("We should actually send information to the server at this point");
        $(".createGameOverlay").css("display", "none");
        $(".createGameModal").css("display", "none");

        socket.emit('game-add', $scope.gameName);
    };

    // TODO make this run in angular?
    jQuery(document).ready(function($) {

        $("#cancelCreateGameButton").click(function() {
            $(".createGameOverlay").css("display", "none");
            $(".createGameModal").css("display", "none");
        });
    });

}]);

battleship.controller('battle', [function() {}]);
