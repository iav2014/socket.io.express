var argv = require('optimist')
	.usage('Usage: $0 --ip [public a.b.c.d] --port [port]')
	.demand(['ip', 'port'])
	.argv;
var logger = require('./logger').logger(__filename);
var app = require('express')();
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);
// redis store
var redisLink0 = require('redis');
var redisLink1 = require('redis');

var config = require('./config/config.js');
var cookieParser = require('cookie-parser');

var sockets = [];
app.use(cookieParser());
//*****************
// redis store link
//*****************
var storeDB0 = createClient(redisLink0, config.redis.host, config.redis.port);
var storeDB1 = createClient(redisLink1, config.redis.host, config.redis.port);
function createClient(redis, host, port) {
	return redis.createClient({
		host: host, port: port,
		retry_strategy: function (options) {
			logger.info(JSON.stringify(options));
			if (!options.error) {
				try {
					if (options.error.code === 'ECONNREFUSED') {
						// End reconnecting on a specific error and flush all commands with a individual error
						logger.error('redis error:' + options.error.code);
						return new Error('The server refused the connection');
					}
					if (options.total_retry_time > 1000 * 60 * 60) {
						// End reconnecting after a specific timeout and flush all commands with a individual error
						return new Error('Retry time exhausted');
					}
					if (options.times_connected > 10) {
						// End reconnecting with built in error
						return undefined;
					}
				} catch (err) {
					logger.error(err);
				}
			}
			// reconnect after
			return Math.max(options.attempt * 100, 3000);
		}
	});
}
storeDB0.select(0, function (err, res) {
	if (err) logger.error('redis error set db0:' + err);
	else
		logger.debug('storeDB0 set:'+ res);
});
storeDB1.select(1, function (err, res) {
	if (err) logger.error('redis error set db1:' + err);
	else
		logger.debug('storeDB1 set:'+ res);
});
storeDB0.on("error", function (err) {
	logger.error("redis DB0 error: " + err);
});
storeDB0.on("connect", function () {
	logger.debug("redis DB0 online ");
});
storeDB1.on("error", function (err) {
	logger.error("redis DB1 error: " + err);
});
storeDB1.on("connect", function () {
	logger.debug("redis DB1 online ");
	start(storeDB0, storeDB1);
});
var redisAdapter = require('socket.io-redis');
function start(storeDB0, storeDB1) {

	io.adapter(redisAdapter({host: config.redis.host, port: config.redis.port}));
	io.set('transports', ['polling', 'websocket', 'xhr-polling']);
	storeDB0.set(argv.ip + ':' + argv.port, io.sockets.sockets.length);
	storeDB1.smembers('onlineUsers', function (err, reply) {
		// first time delete all redis entry for ip and port
		var objArr = eval(reply);
		var json = {};
		for (var i = 0; i < objArr.length; i++) {
			json = JSON.parse(objArr[i]);
			if (json.ip == argv.ip && json.port == argv.port) {
				storeDB1.srem('onlineUsers', JSON.stringify(json));
			}
		}
	});
	//*****************
	// common functions
	//*****************
	function leadZero(number) {
		return (number < 10) ? '0' + number : number;
	}

	function getTime(timestamp) {
		var t, h, m, s, year, month, day;
		t = new Date(timestamp);
		year = leadZero(t.getFullYear());
		month = leadZero(t.getMonth());
		month++;
		day = leadZero(t.getDate());
		h = leadZero(t.getHours());
		m = leadZero(t.getMinutes());
		s = leadZero(t.getSeconds());
		return '' + h + ':' + m + ':' + s + ' - ' + day + '/' + month + '/' + year;
	}

// ******************
// rest api interface
// ******************
	app.use(express.static(process.cwd() + '/public')); // for public contents
	app.get('/clients', function (req, res) {
		res.send(io.sockets.sockets.length.toString());
	});
	app.get('/total', function (req, res) {
		storeDB1.smembers('onlineUsers', function (err, reply) {
			// reply is null when the key is missing
			if(!err){
				res.send('established:'+eval(reply).length.toString());
			} else {
				res.send('error retrieving data from redis');
			}

		});
	});
// ***********************
// socket events listeners
// ***********************
	io.sockets.on('connection', function (socket) {
		logger.debug('on connection event detected');
		logger.warn('[sockets established]:' + io.sockets.sockets.length);
		storeDB0.set(argv.ip + ':' + argv.port, io.sockets.sockets.length);
		var state = {
			subscription: 0
		}
		socket.on('register', function (msg) {
			logger.warn('[sockets established]:' + io.engine.clientsCount);
			console.log(msg);
			switch (msg.evt) {
				case state.subscription: //  phone and optional room
					var date = getTime(new Date().getTime());
					var json = {
						ip: argv.ip,
						port: argv.port,
						event: 0,
						socket: socket.id,
						date: date
					};
					socket.date = date;
					socket.join(socket.id.toString());
					socket.join('broadcast');
					logger.debug('new sobscription arrived at:' + JSON.stringify(json));
					storeDB1.sadd('onlineUsers', JSON.stringify(json));
					socket.emit('ack', json)
					break;

			}
		});
		socket.on('disconnect', function () {
			logger.debug('[disconnect]:' + socket.id);
			var json = {
				ip: argv.ip,
				port: argv.port,
				event: 0,
				socket: socket.id,
				date: socket.date
			};
			storeDB1.srem('onlineUsers', JSON.stringify(json));
			socket.leave(socket.id);
			socket.leave('broadcast');
			socket.disconnect();
			storeDB0.set(argv.ip + ':' + argv.port, io.sockets.sockets.length);
			logger.warn('[sockets established]:' + io.engine.clientsCount);
		});
	});
	http.listen(argv.port, function () {
		logger.info('[socket.ioserver] - server is listening on *:' + argv.port);
	});
}


