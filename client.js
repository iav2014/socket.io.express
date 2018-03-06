/**
 * Created by ariza on 15/6/15.
 */

var argv = require('optimist')
	.usage('Usage: $0 --ip --port --num --split --mode --app [appId]')
	.demand(['ip', 'port', 'num', 'app', 'split', 'mode'])
	.argv;

var port = argv.port || 8500,
	num = argv.num || 10,
	split = argv.split || 10,
	ip = argv.ip || 'localhost',
mode = argv.mode || 0,
app = argv.app || 0;
var request = require('request');
var uuid_generator = 1;

var options = {
	uri: 'http://' + ip + '/free',
	json: {}
};
console.log(options);
process.setMaxListeners(100000);
var seq = 0;
if (mode == 1) {   //Balancing rest
	console.log('BALANCING REST');
	var num_cli = [];

	for (var i = 0; i < num; i++) {
		num_cli.push(i);
	}

	var i = 0;

	var forEach = require('async-foreach').forEach;
	forEach(num_cli, function (worker, index, arr) {
		var done = this.async();
		request.post(options, function (err, result) {
			if (err) {
				console.log(JSON.stringify(options));
				console.log(JSON.stringify(err));
				process.exit(1);
			} else {
				console.log('response:' + JSON.stringify(result.body));
				start({
					uri: result.body.host,
					host: result.body.host,
					port: result.body.port,
					seq: i++
				}, function (err, result) {
					if (err) console.log('ERROR', result);
					done();
				});

			}

		});


	}, function (done, array) {
		console.log('done num_cli  workers');

	});


} else {
if(mode == 2){

	console.log('NOT BALANCING REST, PROXY SOCKET');
	for(var i=0;i<num;i++){
		start({host: ip, port: port, seq: i}, function (err, result) {
			if(!err) err = 'ok! ';


			console.log(err, result);

		})

	}


} else
if(mode == 3){
	console.log('NOt BALANCING SPLIT PORT MODE');
	console.log(port, num, split, ip);
	port = parseInt(port, 10);
	num = parseInt(num, 10);
	split = parseInt(split, 10);

	for (var p = port; p < port + split; p++) {
		for (var c = 0; c < num; c++) {
			console.log('puerto:' + p, ' sockets:' + c, ' sequential:' + seq);
			seq++;
			start({host: ip, port: p, seq: seq}, function (err, result) {
				console.log(err, result);

			})
		}
	}
}

}


function start(data, callback) {
	if (data.uri == false) {
		console.log('URI=FALSE, top limit exceed');
		callback(true, 'URI=FALSE, top limit exceed');
		return;
	}

	var idObject = require('socket.io-client');
	console.log('data:', data.host, data.port);

	var io = idObject.connect('http://'+data.host+':'+data.port,
		{'reconnection': true,
			'max reconnection attempts' :10,
		'reconnectionDelay': 500,
		'reconnectionAttempts': 10, "force new connection": true });
	io.on('error', function () {
		console.log('Error connection');
		callback(true, 'Error connection');
	});


	io.on('done', function () {
		console.log('done!');
		callback(null, 'done!');
	});
	io.on('connect', function () {
		console.log('[' + data.seq + '] - Connected to:' + data.host + ' port ' + data.port);
		console.log('emit - register');
		io.emit('register', {app: argv.app, uid: uuid_generator,screen:'principal'});
		uuid_generator++;

		var data_shared_roberto =
		{ app: '22',
			config: { type: '2', action: 1 },
			screen:'principal',
			method: 'playsound',
			to:
				[ '577b72b0646aec00004c0796',
					'577b7243d69a0900008fabf0',
					'577c2e0dd69a0900008fac26',
					'577ce5dfc5d1d90000786d4a' ],
			name: 'Roberto ',
			from: '577b6de181c6c30000cb1032' }

		console.log('emit - shared');
		io.emit('shared', data_shared_roberto);


		callback(null, 'connected');

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
	io.on('subscription confirm', function (msg) {
		switch (msg.data) {
			case 0:
				console.log('[' + data.seq + '] (0) connection confirm from ' + data.host + ' port ' + data.port);
				break;
			case 1:
				console.log('[' + data.seq + '] (1) connection confirm from ' + data.host + ' port ' + data.port);
				break;
			default:
				console.log('data not recognized');
				break;
		}
	});
	io.on('sendEvent', function (msg) {
		console.log('[' + data.seq + '] message sendEvent received from ' + data.host + ' port ' + data.port + ' content ' + JSON.stringify(msg));
	});
	io.on('reloadJSON', function (msg) {
		console.log('[' + data.seq + '] message reloadJSON received from ' + data.host + ' port ' + data.port + ' content ' + JSON.stringify(msg));
	});

	io.on('startsyncro', function (msg) {
		console.log('[' + data.seq + '] message startsyncro received from ' + data.host + ' port ' + data.port + ' content ' + JSON.stringify(msg));
	});

	io.on('easyshare', function (msg) {
		console.log('[' + data.seq + '] message easyshare received from ' + data.host + ' port ' + data.port + ' content ' + JSON.stringify(msg));
	});
	io.on('error', function (msg) {
		console.log('[' + data.seq + '] message error received from ' + data.host + ' port ' + data.port + ' content ' + JSON.stringify(msg));
	});


	process.on('message', msgFromMaster);
	function msgFromMaster(m) {
	}


}
