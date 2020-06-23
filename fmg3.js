const pools = [];
const child_process = require('child_process');
// EVENTEMITER (Not used so far)
const util = require('util');
const EventEmitter = require('events').EventEmitter;
const net = require("net");
const spawn = child_process.spawn;
const fs = require('fs');
const fluentFfmpeg = require('fluent-ffmpeg');
// These never change...
const spawn = child_process.spawn;
const Stream = require('node-rtsp-stream');
let server = net.createServer((socket) => {
    socket.on('data', (data) => {
        console.log('data:', data);
        let ffmpeg  = null;
        if (data == 1) {
            // stream = new Stream({
            //     name: 'name',
            //     streamUrl: 'rtsp://admin:byt2016!@192.168.0.203/h264/ch1/main/av_stream',
            //     wsPort: 19999,
            //     // ffmpegOptions: { // options ffmpeg flags
            //     //     '-stats': '', // an option with no neccessary value uses a blank string
            //     //     '-r': '30', // options with required values specify the value after the key
            //     //     '-s': '160x120',
            //     // }
            // })
            ffmpeg = pools[0];
            ffmpeg.stdout.on('data', (data) => {
                console.log('mpeg1data', data)
            })

            ffmpeg.stderr.on('data', (data) => {
                console.log('ffmpegStderr', data)
            })

            ffmpeg.on('exit', (code, signal) => {
                if (code === 1) {
                    console.error('RTSP stream exited with error')
                }
            })

            ffmpeg.stdout.pipe(fs.createWriteStream('test.m3u8'));
        }
>>>>>>> a14e9331ba3ce9958758cd2d8ea2733022945395
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
    for (let i = 0; i < 3; i++) {
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