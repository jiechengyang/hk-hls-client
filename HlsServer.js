const hlsServer = require('hls-server');
const http = require('http');
const fs = require('fs');
const path = require('path');
const DateFormat = require('dateformat');
let hlsConfig = require('./config');

const server = http.createServer((req, response) => {
    response.end();
});

server.on('listening', () => {
    console.log('Hls Server started, localAddress:%s,localPort:%s', server.address().address, server.address().port);
});

server.on('connect', (request, socket) => {
    // console.log(request, socket)
    console.log('connect:' + request.getHeader('referer') + "\n");
});

server.on('request', (request, response) => {
    // console.log('response:', response);
});

server.on('connection', (socket) => {
    console.log('connection time is ' + DateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'));
});

server.on('close', (socket) => {
    console.log('The server is down' + "\n");
});
server.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

const hls = new hlsServer(server);
server.setTimeout(0);
server.listen({
    host: hlsConfig.hlsHost,
    port: hlsConfig.hlsPort
});