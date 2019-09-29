/**
 * tcp转码服务器
 */

const net = require("net");
const Utils = require('./libs/Utils');
const date = require('dateformat');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
let hlsConfig = require('./config');
const validator = require('validator');
const HeartBeatPacket = require('./libs/HeartbeatPacket');
const videoList = require('./videos');
const TransCoding = require('./libs/TransCoding');
let globalCmd = null;
let globalPlayers = [];
let globalWorkers = [];
let heartBeat = HeartBeatPacket.getInstance();
const hlsPath = __dirname + '/' + hlsConfig.hlsPath;

if (!fs.existsSync(hlsPath)) {
    fs.mkdir(hlsPath, {recursive: true}, (err) => {
        !Utils.isNull(err) && console.error('mkdir: ', err);
    });
}

let server = net.createServer((socket) => {
    socket.on('data', (data) => {
        // TODO: api接口发送推流服务通过type区分：type:init:转流api初始化连接，type:request,转流api请求转流,type:end:转流api完成请求并关闭连接  type:ping api客户端定时ping 表示一直连接
        // TODO: api连接init时，会发送握手包，也就是唯一码标识 hls服务器也会发送握手包
        // TODO: hls服务器端判断客户端没人看了之后，发送给tcp服务信息，告诉tcp关闭某个流
        // TODO: 当不是api端和hls端的其他客户端连接发送，将关闭它
        // if (socket.hasOwnProperty('lastMessageTime') && !Utils.isNull(socket.lastMessageTime)) {
        //     console.log('socket.lastMessageTime:', socket.lastMessageTime);
        // }
        data = data.toString('utf8');
        console.log('data:', data);
        socket.lastMessageTime = Utils.getTimestamp();
        const readSize = socket.bytesRead;
        console.log("the size of data is " + readSize);
        if (validator.isJSON(data)) {
            let json = JSON.parse(data);
            let transcode = new TransCoding(socket, json, hlsConfig, videoList);
            if (!json.hasOwnProperty('type')) {
                socket.isCheckHeart = false;
                return transcode.illegal();
            }

            switch (json.type) {
                case 'init':// api 初始化注册
                    transcode.initApi();
                    break;
                case 'request':// api 转码申请
                    transcode.transcoding(globalCmd, globalPlayers);
                    break;
                case 'ping':// api ping-echo
                    transcode.getPingclient();
                    break;
                case 'end' :// api 转码申请结束
                    transcode.closeClient();
                    break;
                case 'hlsRequest':// api hls服务端结束设备转码
                    transcode.endTranscoding(socket, json);
                    break;
                default:
                    return transcode.illegal();
            }
        } else {
            socket.isCheckHeart = false;
            socket.write('Illegal client, server denies access');
            socket.end();
        }
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

/* 设置最大连接数量 */
server.maxConnections = hlsConfig.tcpMaxConnect;

/* 监听 connection 事件 */
server.on("connection", function (socket) {
    console.log("client connect....host:%s#port:%s", socket.remoteAddress, socket.remotePort);
    socket.uniqid = Utils.saltHashStr(socket.remoteAddress + ':' + socket.remotePort);
    socket.isCheckHeart = true;
    globalWorkers.push(socket);
    server.getConnections((err, count) => {
        console.log("the count of client is " + count);
    });
});

/* 获取地址信息 */
server.listen({host: hlsConfig.tcpHost, port: hlsConfig.tcpPort}, () => {
    /* 获取地址信息，得到的是一个json { address: '::', family: 'IPv6', port: 8000 } */
    const address = server.address();
    /* TCP服务器监听的端口号 */
    console.log("the port of server is " + address.port);

    /* TCP服务器监听的地址 */
    console.log("the address of server is " + address.address);

    /* 说明TCP服务器监听的地址是 IPv6 还是 IPv4 */
    console.log("the family of server is " + address.family);
});

/* 设置监听时的回调函数 */
server.on("listening", () => {
    console.log("Creat server on tcp://" + hlsConfig.tcpHost + ':' + hlsConfig.tcpPort + '/');
    heartBeat.detectionLater(globalWorkers, hlsConfig.heartTime);
});

/* 设置关闭时的回调函数 */
server.on("close", () => {
    console.log("server closed!");
    globalWorkers = [];
    // TODO: 杀死所有正在运行的ffmpeg进程
    globalCmd.kill();
    if (!Utils.isNull(globalPlayers)) {
        for (const code in globalPlayers) {
            Utils.delDir(fs, hlsConfig.hlsPath + '/' + code);
        }
    }
});

/* 设置错误时的回调函数 */
server.on("error", (err) => {
    console.log("error#code%s#info#%s", err.code, err.toString());
    globalWorkers = [];
    if (err.code === 'EADDRINUSE') {
        console.log('地址正被使用，重试中...');
        setTimeout(() => {
            server.close();
            server.listen(hlsConfig.tcpPort, hlsConfig.tcpHost);
        }, 1000);
    }

    // TODO: 杀死所有正在运行的ffmpeg进程
    globalCmd.kill();
    if (!Utils.isNull(globalPlayers)) {
        for (const code in globalPlayers) {
            Utils.delDir(fs, hlsConfig.hlsPath + '/' + code);
        }
    }
});
