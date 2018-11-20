var http = require('http');
var https = require('https');
var options = {
    hostname : '127.0.0.1',
    port     : 8080,
    path     : 'www.jobui.com:80',
    method     : 'CONNECT'
};
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var req = https.request(options);
req.on('connect', function(res, socket) {
    socket.write('GET / HTTP/1.1\r\n' +
                 'Host: www.jobui.com:80\r\n' +
                 'Connection: Close\r\n' +
                 '\r\n');

    socket.on('data', function(chunk) {
        console.log(chunk.toString());
    });

    socket.on('end', function() {
        console.log('socket end.');
    });
});

req.end();