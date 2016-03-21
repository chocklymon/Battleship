/**
 * Node.js Login Boilerplate
 * More Info : http://kitchen.braitsch.io/building-a-login-system-in-node-js-and-mongodb/
 * Copyright (c) 2013-2016 Stephen Braitsch
 *
 * Additional Modifications:
 * Copyright (c) 2016 Dallin Andersen, Nate Campbell, Cody Davis, or Curtis Oakley
 */

var express = require('express');
var app = express();

var http = require('http').Server(app);
//var session = require('express-session');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
//var cookieParser = require('cookie-parser');
//var MongoStore = require('connect-mongo')(session);

app.set('port', process.env.PORT || 3002);
//app.set('views', __dirname + '/app/server/views');
//app.set('view engine', 'jade');
//app.use(cookieParser());
//app.use(session({
//	secret: 'faeb4453e5d14fe6f6d04637f78077c76c73d1b4',
//	proxy: true,
//	resave: true,
//	saveUninitialized: true,
//	store: new MongoStore({ host: 'localhost', port: 27017, db: 'node-login'})
//	})
//);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('stylus').middleware({ src: __dirname + '/app/public' }));
app.use(express.static(__dirname + '/app/public'));

require('./app/server/routes')(app);

if (app.get('env') == 'development') app.use(errorHandler());

http.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});

// Socket.io WebSocket Code
// Example for making a simple chat application
var io = require('socket.io')(http);

io.on('connection', function(socket) {
    console.log('Socket.io Connection Received');

    socket.on('disconnect', function() {
        console.log('Socket.io Connection Terminated');
    });
    socket.on('chat message', function(msg) {
        console.log('Socket.io Message Received: ' + msg);
        io.emit('chat message', msg);
    })
});
