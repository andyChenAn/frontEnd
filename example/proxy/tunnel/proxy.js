const http = require('http');
const https = require('https');
const net = require('net');
const url = require('url');
const fs = require('fs');
let proxy = http.createServer();
proxy.on('connect' , function (req , cltSocket , head) {
    let u = url.parse('http://' + req.url);
    let pSock = net.connect(u.port , u.hostname , function () {
        cltSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        pSock.pipe(cltSocket);
    });
    cltSocket.pipe(pSock);
});
proxy.listen(8080);
console.log('listening port 8080');