var mongoose = require('mongoose');
var GameSchema = new mongoose.Schema({
    name: String,
    player1: String,
    player1_ships: String,
    player1_board: String,
    player2: String,
    player2_ships: String,
    player2_board: String,
    history: [String],
    status: {type: String, default: 'setup'} //setup, p1_turn, p2_turn, finished
});

var ShipSchema = new mongoose.Schema({
    game_id: String,
    player_id: String,
    battleship_position: String, //number ex. 01, 35, 99, etc
    battleship_location: String, //up, down, left, right
    carrier_position: String,
    carrier_location: String,
    cruiser_position: String,
    cruiser_location: String,
    submarine_position: String,
    submarine_location: String,
    destroyer_position: String,
    destroyer_location: String
});

var BoardSchema = new mongoose.Schema({
    game_id: String,
    player_id: String,
    00: {type: String, default: 'none'}, //none, hit, miss
    01: {type: String, default: 'none'},
    02: {type: String, default: 'none'},
    03: {type: String, default: 'none'},
    04: {type: String, default: 'none'},
    05: {type: String, default: 'none'},
    06: {type: String, default: 'none'},
    07: {type: String, default: 'none'},
    08: {type: String, default: 'none'},
    09: {type: String, default: 'none'},
    10: {type: String, default: 'none'},
    11: {type: String, default: 'none'},
    12: {type: String, default: 'none'},
    13: {type: String, default: 'none'},
    14: {type: String, default: 'none'},
    15: {type: String, default: 'none'},
    16: {type: String, default: 'none'},
    17: {type: String, default: 'none'},
    18: {type: String, default: 'none'},
    19: {type: String, default: 'none'},
    20: {type: String, default: 'none'},
    21: {type: String, default: 'none'},
    22: {type: String, default: 'none'},
    23: {type: String, default: 'none'},
    24: {type: String, default: 'none'},
    25: {type: String, default: 'none'},
    26: {type: String, default: 'none'},
    27: {type: String, default: 'none'},
    28: {type: String, default: 'none'},
    29: {type: String, default: 'none'},
    30: {type: String, default: 'none'},
    31: {type: String, default: 'none'},
    32: {type: String, default: 'none'},
    33: {type: String, default: 'none'},
    34: {type: String, default: 'none'},
    35: {type: String, default: 'none'},
    36: {type: String, default: 'none'},
    37: {type: String, default: 'none'},
    38: {type: String, default: 'none'},
    39: {type: String, default: 'none'},
    40: {type: String, default: 'none'},
    41: {type: String, default: 'none'},
    42: {type: String, default: 'none'},
    43: {type: String, default: 'none'},
    44: {type: String, default: 'none'},
    45: {type: String, default: 'none'},
    46: {type: String, default: 'none'},
    47: {type: String, default: 'none'},
    48: {type: String, default: 'none'},
    49: {type: String, default: 'none'},
    50: {type: String, default: 'none'},
    51: {type: String, default: 'none'},
    52: {type: String, default: 'none'},
    53: {type: String, default: 'none'},
    54: {type: String, default: 'none'},
    55: {type: String, default: 'none'},
    56: {type: String, default: 'none'},
    57: {type: String, default: 'none'},
    58: {type: String, default: 'none'},
    59: {type: String, default: 'none'},
    60: {type: String, default: 'none'},
    61: {type: String, default: 'none'},
    62: {type: String, default: 'none'},
    63: {type: String, default: 'none'},
    64: {type: String, default: 'none'},
    65: {type: String, default: 'none'},
    66: {type: String, default: 'none'},
    67: {type: String, default: 'none'},
    68: {type: String, default: 'none'},
    69: {type: String, default: 'none'},
    70: {type: String, default: 'none'},
    71: {type: String, default: 'none'},
    72: {type: String, default: 'none'},
    73: {type: String, default: 'none'},
    74: {type: String, default: 'none'},
    75: {type: String, default: 'none'},
    76: {type: String, default: 'none'},
    77: {type: String, default: 'none'},
    78: {type: String, default: 'none'},
    79: {type: String, default: 'none'},
    80: {type: String, default: 'none'},
    81: {type: String, default: 'none'},
    82: {type: String, default: 'none'},
    83: {type: String, default: 'none'},
    84: {type: String, default: 'none'},
    85: {type: String, default: 'none'},
    86: {type: String, default: 'none'},
    87: {type: String, default: 'none'},
    88: {type: String, default: 'none'},
    89: {type: String, default: 'none'},
    90: {type: String, default: 'none'},
    91: {type: String, default: 'none'},
    92: {type: String, default: 'none'},
    93: {type: String, default: 'none'},
    94: {type: String, default: 'none'},
    95: {type: String, default: 'none'},
    96: {type: String, default: 'none'},
    97: {type: String, default: 'none'},
    98: {type: String, default: 'none'},
    99: {type: String, default: 'none'}
});

var AccountSchema = new mongoose.Schema({
    name: String,
    email: String,
    user: String,
    pass: String,
    country: String,
    date: String
});

mongoose.model('Game', GameSchema);
mongoose.model('Ship', ShipSchema);
mongoose.model('Board', BoardSchema);
mongoose.model('Account', AccountSchema);
