const pools = [];
const child_process = require('child_process');
// EVENTEMITER (Not used so far)
const util = require('util');
const EventEmitter = require('events').EventEmitter;
const net = require("net");
// These never change...
const spawn = child_process.spawn;
let server = net.createServer((socket) => {
    socket.on('data', (data) => {
        console.log('data:', data);
    });

    socket.on('end', () => {
        console.log('one client end');
    });

    socket.on('close', (handleError) => {
        console.error(handleError);
    });

    socket.on('error', (err) => {
        console.error('error', err);
    });

    socket.on('drain', () => {
        console.log('drain event fired.');
    });
});

server.on("connection", function (socket) {
    console.log("client connect....host:%s#port:%s", socket.remoteAddress, socket.remotePort);
});

server.listen({host: '0.0.0.0', port: 12346}, () => {
    /* 获取地址信息，得到的是一个json { address: '::', family: 'IPv6', port: 8000 } */
    const address = server.address();
    /* TCP服务器监听的端口号 */
    console.log("the port of server is " + address.port);

    /* TCP服务器监听的地址 */
    console.log("the address of server is " + address.address);

    /* 说明TCP服务器监听的地址是 IPv6 还是 IPv4 */
    console.log("the family of server is " + address.family);
});

server.on("listening", () => {
    console.log('listening');
    const args = ['-i', 'pipe:0', '-f', 'mp3', '-ac', '2', '-ab', '128k', '-acodec', 'libmp3lame', 'pipe:1'];
    for (let i = 0; i < 10; i++) {
        const ffmpeg = spawn('ffmpeg', args);
        pools[i] = ffmpeg;
    }
});

server.on("close", () => {
    console.log("server closed!");
});

server.on("error", (err) => {
    console.log("error#code%s#info#%s", err.code, err.toString());
});