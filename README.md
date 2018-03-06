socket.io & express  & client examples
server.js: socket server module launched at the same machine os different machine (with redis link)
server.js --ip 0.0.0.0 --port 8500 (2500 sockets enabled by port)
server.js --ip 0.0.0.0 --port 8501 (2500 sockets enabled by port)
..
server.js --ip a.b.c.d --port 8600

50 listen ports = 100.000 sockets clients
100 listen ports = 200.000 sockets clients

broadcast.js --type broadcast --msg "alert: probably of 45% tsunami"
send a broadcast message using redis, to all clients 

socket.io.clients.js --ip 0.0.0.0 --port 8500 --num 2
send n socket connections to server port.

rest services (server.js)
localhost:port/clients : count socket clients for this local port
localhost:port/total : count total sockets clients all ports
