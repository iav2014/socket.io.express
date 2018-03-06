/**
 * Created by ariza on 15/6/15.
 */
var argv = require('optimist')
	.usage('Usage: $0 --ip --port --num')
	.demand(['ip', 'port', 'num'])
	.argv;
var port = argv.port || 8500,
	num = argv.num || 10,
	ip = argv.ip || 'localhost';
var uuid_generator = 1;

var options = {
	uri: 'http://' + ip + '/free',
	json: {}
};
process.setMaxListeners(100000);
for (var i = 0; i < num; i++) {
	start({host: ip, port: port, seq: i}, function (err, result) {
		console.log(err, result);
	})
}
function start(data, callback) {
	var socket = require('socket.io-client');
	console.log('try connect to :', data.host, data.port);
	var io = socket.connect('http://' + data.host + ':' + data.port,
		{
			'reconnection': true,
			transports: ['polling', 'websocket', 'xhr-polling'],
			'max reconnection attempts': 10,
			'reconnectionDelay': 500,
			'reconnectionAttempts': 10, "force new connection": true
		});
	io.on('error', function () {
		console.log('Error connection');
		callback(true, 'Error connection');
	});
	io.on('done', function () {
		console.log('connection done!!');
		callback(null, 'done!');
	});
	io.on('connect', function () {
		console.log('[' + data.seq + '] - socket:['+io.id+'] - Connected to:' + data.host + ' port ' + data.port);
		console.log('emit - register');
		io.emit('register', {evt: 0, data: uuid_generator++});

	});
	io.on('connecting', function () {
		console.log('trying connected to ' + data.host + ' port ' + data.port);
	});
	io.on('disconnect', function () {
		console.log('[' + data.seq + '] disconnect from ' + data.host + ' port ' + data.port);
		console.log('disconnect');
		io.disconnect();
		callback(true, 'disconnect!');
	});
	io.on('ack', function (msg) {
		console.log('[' + data.seq + ']-socket:['+io.id+'] - connection confirm from ' + data.host + ' port ' + data.port+' data:'+JSON.stringify(msg));
		io.on(msg.socket.toString(),function(msg){
			console.log('[received] message to ['+io.id+']:'+JSON.stringify(msg));
		})
	});
	io.on('broadcast', function (msg) {
		console.log(io.id);
		console.log('[socket:'+io.id+']-[broadcast]' + data.host + ' port ' + data.port+' data:'+JSON.stringify(msg));
	});
}
