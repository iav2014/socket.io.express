/**
 * Created by ariza on 14/8/16.
 */
//
// sender outside the main socket.io process
// the module reads from redis all configuration and info server
// to use for sending example message to all clients
// msg.socket info:
// socket:'broadcast' to send to all sockets at redis,
// socket: id, to send to specific socket at redis
var argv = require('optimist')
	.usage('Usage: $0 --type --msg')
	.demand(['type', 'msg'])
	.argv;
var logger = require('./logger').logger(__filename);
var io = require('socket.io-emitter')('localhost');
var _timeLapse = 5000;
logger.debug('outsideSender ready to send any data example using redis apply');
setInterval(function () {
	var json = {evt: 1, socket: argv.type||'broadcast', data: argv.msg||'msg from outsider'};
	io.emit(json.socket.toString(), json);
	logger.debug('msg sent to all:' + JSON.stringify(json));
}, _timeLapse);