
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

    // TODO make this run in angular?
    jQuery(document).ready(function($) {

        $("#createGameButton").click(function() {
            $(".createGameOverlay").css("display", "block");
            $(".createGameModal").css("display", "block");
        });

        $("#cancelCreateGameButton").click(function() {
            $(".createGameOverlay").css("display", "none");
            $(".createGameModal").css("display", "none");
        });

        $("#finalCreateGameButton").click(function() {
            console.log("We should actually send information to the server at this point");
            $(".createGameOverlay").css("display", "none");
            $(".createGameModal").css("display", "none");
        });
    });

}]);

battleship.controller('battle', [function() {}]);
