
var battleship = angular.module('battleship', ['ngRoute']);

// Setup the Routes
battleship.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
        $routeProvider
            .when('/gamehub', {
                templateUrl: '/views/gamehub.html',
                controller: 'gamehub'
            })
            .when('/game/:gameId', {
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
battleship.factory('io', ['$rootScope', '$location', function($rootScope, $location) {
    var socket = null;
    var errorHandler = function(err) {
        console.warn('App Error: ', err);

        var cssClass = 'alert-danger';
        if (err.type == 'warning') {
            cssClass = 'alert-warning';
        }
        err['class'] = cssClass;

        if (!angular.isArray($rootScope.messages)) {
            $rootScope.messages = [];
        }
        $rootScope.messages.push(err);

        if (err.redirect) {
            $location.path(err.navigateTo);
        }
    };
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

    var factory = function(namespace) {
        socket = io(namespace);
        socketWrapper.on('app-error', errorHandler);
        return socketWrapper;
    };
    factory.getSocket = function() {
        return socketWrapper;
    };
    factory.getRawSocket = function() {
        return socket;
    };

    return factory;
}]);


// ----------------------
//     Controllers

battleship.controller('gamehub', ['$scope', '$location', 'io', function($scope, $location, io) {
    var socket = io('/games');
    var user;

    // Define the socket events
    socket.on('user-info', function(userInfo) {
        user = userInfo;
    });
    socket.on('game-add', function(game) {
        if (user && (game.player1 == user.username || game.player2 == user.username)) {
            $scope.games.private.push(game);
        } else {
            $scope.games.public.push(game);
        }
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

    $scope.joinGame = function(game) {
        $location.path('/game/' + game._id);
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
