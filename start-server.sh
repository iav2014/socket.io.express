#!/bin/bash
ulimit -u 200000
ulimit -n 200000
ulimit -i 200000
for i in {0..40}
do
 port=`expr 8500 + $i`
 forever start -c "node --max-new-space-size=2048 --max-old-space-size=8192" server.js --ip 0.0.0.0 --port $port $i
done