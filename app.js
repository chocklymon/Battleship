
/**
	* Node.js Login Boilerplate
	* More Info : http://kitchen.braitsch.io/building-a-login-system-in-node-js-and-mongodb/
	* Copyright (c) 2013-2016 Stephen Braitsch
**/

var http = require('http');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(session);

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/battleship');

require('./app/server/models/Schemas');

var app = express();

var sessionHandler = session({
	secret: 'faeb4453e5d14fe6f6d04637f78077c76c73d1b4',
	proxy: true,
	resave: true,
	saveUninitialized: true,
	store: new MongoStore({ host: 'localhost', port: 27017, db: 'battleship'})
});

app.set('port', process.env.PORT || 3002);
app.set('views', __dirname + '/app/server/views');
app.set('view engine', 'jade');
app.use(cookieParser());
app.use(sessionHandler);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('stylus').middleware({ src: __dirname + '/app/public' }));
app.use(express.static(__dirname + '/app/public'));

require('./app/server/routes')(app);
require('./app/server/mongo')(app);

if (app.get('env') == 'development') app.use(errorHandler());

var server = http.createServer(app);
server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});

// Socket.io WebSocket Code
require('./app/server/socket')(server, sessionHandler);
