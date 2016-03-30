
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
                controller: 'battle'
            })
            .otherwise('/gamehub');

        $locationProvider.html5Mode(true);
    }]
);

battleship.controller('gamehub', ['$scope', function($scope) {
    var socket = io('/games');

    socket.on('game-add', function(game) {
        // TODO get the currently logged in user.
        //if (game.player1 == currentUser) {
        //    $scope.personalGames.push(game);
        //} else {
            $scope.publicGames.push(game);
        //}
        $scope.$digest();
    });
    //socket.on('games-list', function(games) {
    //    $scope.publicGames = games;
    //});

    $scope.publicGames = [];
    $scope.personalGames = [];
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
