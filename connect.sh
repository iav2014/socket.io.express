ulimit -u 200000
ulimit -n 200000
ulimit -s 100000
node socket-io-client.js --ip $1 --port $2  --num $3