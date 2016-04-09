battleship.controller("battleController", function($scope, $routeParams, io) {
	// Get the unique game ID
	var gameId = $routeParams.gameId,
		player = null;

	// Get the socket and then join the game
	var socket = io('/battle');
	socket.emit('join', gameId);

	// Socket events
	socket.on('disconnect', function() {
		// TODO display to the user that we have been disconnected from the server
		console.log('Disconnected', arguments);
	});
	socket.on('user-info', function(userInfo) {
 		//console.log(userInfo);
 		player = userInfo;
 	});
	socket.on('join', function(gameData) {
		// Server has acknowledged that we joined the game, update the game data with the current data from the server
		console.log("Join Data: ", gameData);
		if (gameData.game) {
			$scope.gameSchema = gameData.game;
			$scope.players = [{
				name: gameData.game.player1,
				status: ''
			}];
			if (gameData.game.player2) {
				$scope.players.push({
					name: gameData.game.player2,
					status: ''
				});
			}
		}
		if (gameData.boards && gameData.boards.length == 2) {
			if (gameData.boards[0].player_id == player.id) {
				$scope.enemyBoardSchema = gameData.boards[0];
				$scope.playerBoardSchema = gameData.boards[1];
			} else {
				$scope.playerBoardSchema = gameData.boards[0];
				$scope.enemyBoardSchema = gameData.boards[1];
			}
		}
		if (gameData.shipSchema) {
			$scope.playerShipSchema = gameData.shipSchema;
		}
	});
	socket.on('rejoin', function() {
		// Rejoin the game, this typically only happens if the server was restarted
		socket.emit('join', gameId);
		socket.emit('user-info');
	});
	socket.on('fire-shot', function(shotData) {
		//console.log(shotData);
        var board;
        if (shotData.player == player.id){
			board = $scope.enemyBoardSchema;
        }
        else{
			board = $scope.playerBoardSchema;
        }
        
		if (shotData.hit) {
			// Do hit
			board[shotData.coords].type = "hit";
		} else {
			// Do miss
			board[shotData.coords].type = "miss";
		}

		$scope.endTurn();
	});
	socket.on('setup-ready', function(setupState) {
		//console.log(setupState);
        $scope.gameSchema.status = setupState.gameStatus;
	});

	$scope.test = "color: red";
	$scope.currentSelectedShip = "none";
	$scope.currentShipOrientation = "none";
	$scope.currentShipLength = 0;
	$scope.selectedCells = [];
	$scope.myPlayer = "1";
	$scope.players = [];
	$scope.ownHoverColor = "";
	$scope.enemyHoverColor = "";
	$scope.currentEnemyCell = -1;

	$scope.cellHover = function(e) {
		if ($scope.gameSchema.status == "Setup" && $scope.currentSelectedShip != "none") {
			$scope.test = "color: blue";
			var id = e.target.id, i;
			var cellCoords = id.substr(1, 2);
			cellCoords = parseInt(cellCoords);
			console.log("_____" + cellCoords);
			$scope.populateArray(cellCoords);
			console.log($scope.selectedCells);

			if ($scope.canPlaceShip(cellCoords)) {
				console.log("can place the ship!");
				for(i = 0; i < $scope.selectedCells.length; i++) {
					id = $scope.stringifyCoords($scope.selectedCells[i]);
					$scope.ownHoverColor = "green";
				}
			} else {
				console.log("Cannot place the ship!");
				for(i = 0; i < $scope.selectedCells.length; i++) {
					id = $scope.stringifyCoords($scope.selectedCells[i]);
					if($scope.currentShipOrientation == "Left" && ($scope.selectedCells[i] % 10) - ($scope.selectedCells[0] % 10) <= 0 && $scope.selectedCells[i] >= 0) {
						//document.getElementById(id).style.background = "red";
						$scope.ownHoverColor = "red";
					}
					if($scope.currentShipOrientation == "Right" && ($scope.selectedCells[i] % 10) - ($scope.selectedCells[0] % 10) >= 0 && $scope.selectedCells[i] < 100) {
						//document.getElementById(id).style.background = "red";
						$scope.ownHoverColor = "red";
					}
					if($scope.currentShipOrientation == "Down" && $scope.selectedCells[i] < 100) {
						//document.getElementById(id).style.background = "red";
						$scope.ownHoverColor = "red";
					}
					if($scope.currentShipOrientation == "Up" && $scope.selectedCells[i] >= 0) {
						//document.getElementById(id).style.background = "red";
						$scope.ownHoverColor = "red";
					}
				}
			}
			console.log("_____" + cellCoords);
		}
	};
	
	$scope.isCellHit = function(board, cell) {
		if(board != "enemy" && board != "own") {
			return false;
		}
		if(board == "enemy" && ($scope.enemyBoardSchema[cell].type == "hit" || $scope.enemyBoardSchema[cell].type == "miss")) {
			return true;
		} else if(board == "own" && ($scope.playerBoardSchema[cell].type == "hit" || $scope.playerBoardSchema[cell].type == "miss")) {
			return true;
		}
		return false;
	};

	$scope.getCellClass = function(board, cell) {
		if(board != "enemy" && board != "own") {
			return;
		}
		if(board == "enemy" && $scope.enemyBoardSchema[cell]) {
			if($scope.enemyBoardSchema[cell].type == "hit") {
				document.getElementById('E' + cell).removeAttribute('style');
				return "backRed";
			} else if($scope.currentEnemyCell == parseInt(cell.substr(1,2)) && $scope.enemyHoverColor == "green") {
				document.getElementById('E' + cell).removeAttribute('style');
				return "backGreen";
			} else {
				document.getElementById('E' + cell).removeAttribute('style');
				return;
			}
		} else if(board == "own" && $scope.enemyBoardSchema[cell]) {
			if($scope.selectedCells.indexOf(parseInt(cell.substr(1,2))) != -1) {
				if(($scope.currentShipOrientation == "Left" && (parseInt(cell.substr(1,2)) % 10) - ($scope.selectedCells[0] % 10) <= 0) ||
					($scope.currentShipOrientation == "Right" && (parseInt(cell.substr(1,2)) % 10) - ($scope.selectedCells[0] % 10) >= 0) ||
					($scope.currentShipOrientation == "Down") ||
					($scope.currentShipOrientation == "Up"))
				{
					if($scope.ownHoverColor == "red") {
						console.log("RED");
						return "backRed";
					} else if($scope.ownHoverColor == "green") {
						console.log("GREEN");
						return "backGreen";
					}
				}
			} else if($scope.playerBoardSchema[cell].type == "hit") {
				document.getElementById(cell).removeAttribute('style');
				return "backRed";
			} else if($scope.playerBoardSchema[cell].isOccupied == true) {
				document.getElementById(cell).removeAttribute('style');
				return "backGray";
			} else {
				document.getElementById(cell).removeAttribute('style');
				return;
			}
		}
		return;
	};

	$scope.isPlayersTurn = function() {
		// TODO
		return true;
	};

	$scope.enemyCellHover = function(e) {
		// TODO
		if(!$scope.isPlayersTurn()) {
			return; // We only allow fire investigation if it is the players turn
		}
		var id = e.target.id;
       		if (id) {
       	    		var cellCoords = id.substr(1, 3);
            		if ($scope.enemyBoardSchema[cellCoords].type == "none" && $scope.isCurrentPlayersTurn()) {
            		    //document.getElementById(id).style.background = "green";
            			$scope.enemyHoverColor = "green";
			}
        	}
	};

	$scope.populateArray = function(cellCoords) {
		console.log("Came to populate Array function");
		$scope.selectedCells = [];
		$scope.selectedCells.push(cellCoords);
		for (var i = 1; i < $scope.currentShipLength; i++) {
			switch($scope.currentShipOrientation) {
				case "Down" : 
					cellCoords += 10;
					$scope.selectedCells.push(cellCoords);
					break;
				case "Left" :
					cellCoords -= 1;
					$scope.selectedCells.push(cellCoords);
					break;
				case "Up" :
					cellCoords -= 10;
					$scope.selectedCells.push(cellCoords);
					break;
				case "Right" :
					cellCoords += 1;
					$scope.selectedCells.push(cellCoords);
					break;
			}
		}
		//console.log($scope.selectedCells);
	};

	$scope.canPlaceShip = function() {
		for(var i = 0; i < $scope.currentShipLength; i++) {
			var cellCoords = $scope.selectedCells[i];
			
			if( $scope.currentShipOrientation == "Right" && 	// 1) we are going right
																// 2) we are still in bounds
				(cellCoords % 10) == 0 && 						// 3) we are in the furthest left collumn
				i > 0 || cellCoords > 99) 						// 4) we are not the first cell to be checked
			{
				return false; // We have leaked from the right side back to the left
			}
			else if( $scope.currentShipOrientation == "Left" && // 1) we are going left
				 												// 2) we are still in bounds
				(cellCoords % 10) == 9 &&						// 3) we are in the furthest right collumn
				i > 0 || cellCoords < 0)						// 4) we are not the first cell to be checked
			{
				return false; // We have leaked from the left side back to the right
			}
			else if( $scope.currentShipOrientation == "Down" && // 1) we are going down
				cellCoords > 99)								// 2) we have left the board
			{
				return false; // We have leaked from the bottom side
			}
			else if( $scope.currentShipOrientation == "Up" && 	// 1) we are going up
				cellCoords < 0)									// 2) we have left the board
			{
				return false; // We have leaked from the top side
			}

			var id = $scope.stringifyCoords(cellCoords);
			if ($scope.playerBoardSchema[id] && $scope.playerBoardSchema[id].isOccupied) {
				return false;
			}
		}
		return true;
	};

	$scope.isCurrentPlayersTurn = function() {
 		if ($scope.players.length != 2) {
 			return false;
 		}
 		if ($scope.players[0].name == player.username && $scope.gameSchema.status == "PlayerOneTurn") {
 			return true;
 		}
 		else if ($scope.players[1].name == player.username && $scope.gameSchema.status == "PlayerTwoTurn") {
 			return true;
 		}
 		else {
 			return false;
 		}
 	};

	$scope.stringifyCoords = function(cellCoords) {
		var id = "C";
		if (cellCoords < 10) id += "0" + cellCoords;
		if (cellCoords >= 10) id += cellCoords;
		return id;
	};

	$scope.cellLeave = function(e) {
		if ($scope.gameSchema.status == "Setup" && $scope.currentSelectedShip != "none") {

			for(var i = 0; i < $scope.selectedCells.length; i++) {
				var id = $scope.stringifyCoords($scope.selectedCells[i]);
				if ($scope.playerBoardSchema[id] && $scope.playerBoardSchema[id].isOccupied) {
	 				//document.getElementById(id).style.background = "grey";
	 			}
				else if ($scope.playerBoardSchema[id]) {
					//document.getElementById(id).style.background = "white";
				}
			}
		}		
		
	};

	$scope.enemyCellLeave = function(e) {
		// TODO
		var id = e.target.id;
        	if (id) {
        	    var cellCoords = id.substr(1, 3);
        	    if ($scope.enemyBoardSchema[cellCoords].type == "none") {
        	        document.getElementById(id).removeAttribute('style');
        	    }
        	}
	};

	$scope.selectShip = function(shipName) {
		// Don't do anything if it isn't the setup phase
		if ($scope.gameSchema.status != "Setup") {
			alert("We are no longer in the Setup Phase");
			return;
		}

		$scope.currentSelectedShip = shipName;
		switch ($scope.currentSelectedShip) {
			case "Carrier" :
				if ($scope.playerShipSchema.carrier_location != "none") {
					alert("You have already placed a Carrier.");
					$scope.currentSelectedShip = "none";
					return;
				}
				break;
			case "Battleship" :
				if ($scope.playerShipSchema.battleship_location != "none") {
					alert("You have already placed a Battleship.");
					$scope.currentSelectedShip = "none";
					return;
				}
				break;
			case "Submarine" :
				if ($scope.playerShipSchema.submarine_location != "none") {
					alert("You have already placed a Submarine.");
					$scope.currentSelectedShip = "none";
					return;
				}
				break;
			case "Cruiser" :
				if ($scope.playerShipSchema.cruiser_location != "none") {
					alert("You have already placed a Cruiser.");
					$scope.currentSelectedShip = "none";
					return;
				}
				break;
			case "Destroyer" :
				if ($scope.playerShipSchema.destroyer_location != "none") {
					alert("You have already placed a Destroyer.");
					$scope.currentSelectedShip = "none";
					return;
				}
				break;
		}

		if ($scope.currentShipOrientation == "none") {
	 		$scope.currentShipOrientation = "Down";
	 	}
		switch($scope.currentSelectedShip) {
			case "Carrier" :
				$scope.currentShipLength = 5;
				break;
			case "Battleship" :
				$scope.currentShipLength = 4;
				break;
			case "Submarine" :
				$scope.currentShipLength = 3;
				break;
			case "Cruiser" :
				$scope.currentShipLength = 3;
				break;
			case "Destroyer" :
				$scope.currentShipLength = 2;
				break;
		}
	};
	$scope.changeOrientation = function() {
		switch($scope.currentShipOrientation) {
			case "Down" : 
				$scope.currentShipOrientation = "Left";
				break;
			case "Left" :
				$scope.currentShipOrientation = "Up";
				break;
			case "Up" :
				$scope.currentShipOrientation = "Right";
				break;
			case "Right" :
				$scope.currentShipOrientation = "Down";
				break;
		}
	};

	$scope.changeStateDebug = function() {
		switch($scope.gameSchema.status) {
			case "Setup" : 
				$scope.gameSchema.status = "PlayerOneTurn";
				break;
			case "PlayerOneTurn" :
				$scope.gameSchema.status = "PlayerTwoTurn";
				break;
			case "PlayerTwoTurn" :
				$scope.gameSchema.status = "EndGame";
				break;
			case "EndGame" :
				$scope.gameSchema.status = "Setup";
				break;
		}
	};

	$scope.endTurn = function() {
		if ($scope.gameSchema.status == "PlayerOneTurn") {
			$scope.gameSchema.status = "PlayerTwoTurn";
		}
		else if ($scope.gameSchema.status == "PlayerTwoTurn") {
			$scope.gameSchema.status = "PlayerOneTurn";
		}
	};

	$scope.fireOnCell = function(e) {
		if ($scope.gameSchema.status == "Setup") {
			alert("You cannot fire during setup!");
			return;
		}
		if ($scope.gameSchema.status == "EndGame") {
			alert("You cannot fire, the game is over!");
			return;
		}
		// TODO Check if it is current player's turn to fire
		if (!$scope.isCurrentPlayersTurn()) {
 			alert("You cannot fire unless it is your turn.");
 			return;
 		}			
	
		var id = e.target.id;
		var cellCoords = id.substr(1, 3);



		if ($scope.enemyBoardSchema[cellCoords].type == "none") {
			socket.emit('fire-shot', cellCoords);
		}
		else {
			alert("You have already fired on this location!");
		}
	};

	$scope.placeShip = function(e) {
		if ($scope.gameSchema.status == "Setup" && $scope.canPlaceShip()) {
			switch($scope.currentSelectedShip) {
				case "Carrier" :
					$scope.playerShipSchema.carrier_orientation = $scope.currentShipOrientation;
					var id = e.target.id;
					var cellCoords = id.substr(1, 2);
					$scope.playerShipSchema.carrier_location = cellCoords;
					break;
				case "Battleship" :
					$scope.playerShipSchema.battleship_orientation = $scope.currentShipOrientation;
					var id = e.target.id;
					var cellCoords = id.substr(1, 2);
					$scope.playerShipSchema.battleship_location = cellCoords;
					break;
				case "Submarine" :
					$scope.playerShipSchema.submarine_orientation = $scope.currentShipOrientation;
					var id = e.target.id;
					var cellCoords = id.substr(1, 2);
					$scope.playerShipSchema.submarine_location = cellCoords;
					break;
				case "Cruiser" :
					$scope.playerShipSchema.cruiser_orientation = $scope.currentShipOrientation;
					var id = e.target.id;
					var cellCoords = id.substr(1, 2);
					$scope.playerShipSchema.cruiser_location = cellCoords;
					break;
				case "Destroyer" :
					$scope.playerShipSchema.destroyer_orientation = $scope.currentShipOrientation;
					var id = e.target.id;
					var cellCoords = id.substr(1, 2);
					$scope.playerShipSchema.destroyer_location = cellCoords;
					break;
				// Default to error dialog pop-up
			}

			//console.log($scope.playerShipSchema);
			//console.log($scope.selectedCells);
			for (var i = 0; i < $scope.selectedCells.length; i++) {
				$scope.playerBoardSchema[$scope.stringifyCoords($scope.selectedCells[i])].isOccupied = true;
				//console.log($scope.playerBoardSchema[$scope.stringifyCoords($scope.selectedCells[i])].isOccupied);
				$scope.playerBoardSchema[$scope.stringifyCoords($scope.selectedCells[i])].ship = $scope.currentSelectedShip;
				//console.log($scope.playerBoardSchema[$scope.stringifyCoords($scope.selectedCells[i])].ship);	
				document.getElementById($scope.stringifyCoords($scope.selectedCells[i])).style.background = "grey";
			}
			$scope.currentSelectedShip = "none";
			$scope.currentShipOrientation = "none";
            
            if ($scope.playerShipSchema.carrier_location != "none" && $scope.playerShipSchema.battleship_location != "none" && $scope.playerShipSchema.cruiser_location != "none" && $scope.playerShipSchema.submarine_location != "none" && $scope.playerShipSchema.destroyer_location != "none"){
                var ships = {shipSchema: $scope.playerShipSchema, boardSchema: $scope.playerBoardSchema};  
                socket.emit('setup-ready', ships);
            }
		}
	};

	// Initalize the boards and schema
	$scope.playerShipSchema = {
	    battleship_orientation: "none",
	    battleship_location: "none",
	    carrier_orientation: "none",
	    carrier_location: "none",
	    cruiser_orientation: "none",
	    cruiser_location: "none",
	    submarine_orientation: "none",
	    submarine_location: "none",
	    destroyer_orientation: "none",
	    destroyer_location: "none"
	};

	$scope.playerBoardSchema = {
	    C00: {type: 'none', isOccupied: false, ship: 'none'},
	    C01: {type: 'none', isOccupied: false, ship: 'none'},
	    C02: {type: 'none', isOccupied: false, ship: 'none'},
	    C03: {type: 'none', isOccupied: false, ship: 'none'},
	    C04: {type: 'none', isOccupied: false, ship: 'none'},
	    C05: {type: 'none', isOccupied: false, ship: 'none'},
	    C06: {type: 'none', isOccupied: false, ship: 'none'},
	    C07: {type: 'none', isOccupied: false, ship: 'none'},
	    C08: {type: 'none', isOccupied: false, ship: 'none'},
	    C09: {type: 'none', isOccupied: false, ship: 'none'},
	    C10: {type: 'none', isOccupied: false, ship: 'none'},
	    C11: {type: 'none', isOccupied: false, ship: 'none'},
	    C12: {type: 'none', isOccupied: false, ship: 'none'},
	    C13: {type: 'none', isOccupied: false, ship: 'none'},
	    C14: {type: 'none', isOccupied: false, ship: 'none'},
	    C15: {type: 'none', isOccupied: false, ship: 'none'},
	    C16: {type: 'none', isOccupied: false, ship: 'none'},
	    C17: {type: 'none', isOccupied: false, ship: 'none'},
	    C18: {type: 'none', isOccupied: false, ship: 'none'},
	    C19: {type: 'none', isOccupied: false, ship: 'none'},
	    C20: {type: 'none', isOccupied: false, ship: 'none'},
	    C21: {type: 'none', isOccupied: false, ship: 'none'},
	    C22: {type: 'none', isOccupied: false, ship: 'none'},
	    C23: {type: 'none', isOccupied: false, ship: 'none'},
	    C24: {type: 'none', isOccupied: false, ship: 'none'},
	    C25: {type: 'none', isOccupied: false, ship: 'none'},
	    C26: {type: 'none', isOccupied: false, ship: 'none'},
	    C27: {type: 'none', isOccupied: false, ship: 'none'},
	    C28: {type: 'none', isOccupied: false, ship: 'none'},
	    C29: {type: 'none', isOccupied: false, ship: 'none'},
	    C30: {type: 'none', isOccupied: false, ship: 'none'},
	    C31: {type: 'none', isOccupied: false, ship: 'none'},
	    C32: {type: 'none', isOccupied: false, ship: 'none'},
	    C33: {type: 'none', isOccupied: false, ship: 'none'},
	    C34: {type: 'none', isOccupied: false, ship: 'none'},
	    C35: {type: 'none', isOccupied: false, ship: 'none'},
	    C36: {type: 'none', isOccupied: false, ship: 'none'},
	    C37: {type: 'none', isOccupied: false, ship: 'none'},
	    C38: {type: 'none', isOccupied: false, ship: 'none'},
	    C39: {type: 'none', isOccupied: false, ship: 'none'},
	    C40: {type: 'none', isOccupied: false, ship: 'none'},
	    C41: {type: 'none', isOccupied: false, ship: 'none'},
	    C42: {type: 'none', isOccupied: false, ship: 'none'},
	    C43: {type: 'none', isOccupied: false, ship: 'none'},
	    C44: {type: 'none', isOccupied: false, ship: 'none'},
	    C45: {type: 'none', isOccupied: false, ship: 'none'},
	    C46: {type: 'none', isOccupied: false, ship: 'none'},
	    C47: {type: 'none', isOccupied: false, ship: 'none'},
	    C48: {type: 'none', isOccupied: false, ship: 'none'},
	    C49: {type: 'none', isOccupied: false, ship: 'none'},
	    C50: {type: 'none', isOccupied: false, ship: 'none'},
	    C51: {type: 'none', isOccupied: false, ship: 'none'},
	    C52: {type: 'none', isOccupied: false, ship: 'none'},
	    C53: {type: 'none', isOccupied: false, ship: 'none'},
	    C54: {type: 'none', isOccupied: false, ship: 'none'},
	    C55: {type: 'none', isOccupied: false, ship: 'none'},
	    C56: {type: 'none', isOccupied: false, ship: 'none'},
	    C57: {type: 'none', isOccupied: false, ship: 'none'},
	    C58: {type: 'none', isOccupied: false, ship: 'none'},
	    C59: {type: 'none', isOccupied: false, ship: 'none'},
	    C60: {type: 'none', isOccupied: false, ship: 'none'},
	    C61: {type: 'none', isOccupied: false, ship: 'none'},
	    C62: {type: 'none', isOccupied: false, ship: 'none'},
	    C63: {type: 'none', isOccupied: false, ship: 'none'},
	    C64: {type: 'none', isOccupied: false, ship: 'none'},
	    C65: {type: 'none', isOccupied: false, ship: 'none'},
	    C66: {type: 'none', isOccupied: false, ship: 'none'},
	    C67: {type: 'none', isOccupied: false, ship: 'none'},
	    C68: {type: 'none', isOccupied: false, ship: 'none'},
	    C69: {type: 'none', isOccupied: false, ship: 'none'},
	    C70: {type: 'none', isOccupied: false, ship: 'none'},
	    C71: {type: 'none', isOccupied: false, ship: 'none'},
	    C72: {type: 'none', isOccupied: false, ship: 'none'},
	    C73: {type: 'none', isOccupied: false, ship: 'none'},
	    C74: {type: 'none', isOccupied: false, ship: 'none'},
	    C75: {type: 'none', isOccupied: false, ship: 'none'},
	    C76: {type: 'none', isOccupied: false, ship: 'none'},
	    C77: {type: 'none', isOccupied: false, ship: 'none'},
	    C78: {type: 'none', isOccupied: false, ship: 'none'},
	    C79: {type: 'none', isOccupied: false, ship: 'none'},
	    C80: {type: 'none', isOccupied: false, ship: 'none'},
	    C81: {type: 'none', isOccupied: false, ship: 'none'},
	    C82: {type: 'none', isOccupied: false, ship: 'none'},
	    C83: {type: 'none', isOccupied: false, ship: 'none'},
	    C84: {type: 'none', isOccupied: false, ship: 'none'},
	    C85: {type: 'none', isOccupied: false, ship: 'none'},
	    C86: {type: 'none', isOccupied: false, ship: 'none'},
	    C87: {type: 'none', isOccupied: false, ship: 'none'},
	    C88: {type: 'none', isOccupied: false, ship: 'none'},
	    C89: {type: 'none', isOccupied: false, ship: 'none'},
	    C90: {type: 'none', isOccupied: false, ship: 'none'},
	    C91: {type: 'none', isOccupied: false, ship: 'none'},
	    C92: {type: 'none', isOccupied: false, ship: 'none'},
	    C93: {type: 'none', isOccupied: false, ship: 'none'},
	    C94: {type: 'none', isOccupied: false, ship: 'none'},
	    C95: {type: 'none', isOccupied: false, ship: 'none'},
	    C96: {type: 'none', isOccupied: false, ship: 'none'},
	    C97: {type: 'none', isOccupied: false, ship: 'none'},
	    C98: {type: 'none', isOccupied: false, ship: 'none'},
	    C99: {type: 'none', isOccupied: false, ship: 'none'}
	};

	$scope.enemyBoardSchema = angular.copy($scope.playerBoardSchema);


	$scope.gameSchema = {
		player1: "1",
	    player1_ships: String,
	    player1_board: String,
	    player2: "2",
	    player2_ships: String,
	    player2_board: String,
	    history: [String],
	    status: "Setup"
	}
});
