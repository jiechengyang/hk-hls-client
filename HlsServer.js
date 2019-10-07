const hlsServer = require('hls-server');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const DateFormat = require('dateformat');
const Utils = require('./libs/Utils');
let hlsConfig = require('./config');
let tcpClient = null;
let globalClient = new Array();
let absolutePath = __dirname;
let heartTimer = null;
let stopCodingTimer = null;
let tcpPingTimer = null;

function connectTcp() {
    const TcpClient = require('./libs/TcpClient');
    console.log('start connect tcp server....');
    tcpClient = new TcpClient(hlsConfig.tcpHost, hlsConfig.tcpPort);
    tcpClient.registerEventCall('connect', () => {
        let utf8Data = JSON.stringify({
            type: 'init',
            indexCode: hlsConfig.indexCode,
            msg: 'hls init client'
        });
        const hexData = Utils.trim(Utils.toUTF8Hex(utf8Data));
        this.client.write(hexData, 'hex');
    });

    tcpClient.handler();
}

function pingEcho() {
    if (tcpPingTimer) {
        clearInterval(tcpPingTimer);
        tcpPingTimer = null;
    }

    const diff = 60 * 1000;
    tcpPingTimer = setInterval((tcp) => {
        let utf8Data = JSON.stringify({
            type: 'ping',
            msg: 'I\'m online. hls send'
        });
        const hexData = Utils.trim(Utils.toUTF8Hex(utf8Data));
        tcp.client.write(hexData, 'hex');
    }, hlsConfig.heartTime <= diff ?  diff - 10 * 1000 : hlsConfig.heartTime - diff, tcpClient);
}


const server = http.createServer((req, response) => {
    response.end();
});

server.on('listening', () => {
    console.log('Hls Server started, localAddress:%s,localPort:%s', server.address().address, server.address().port);
    connectTcp();
    pingEcho();
    if (!Utils.isNull(heartTimer)) {
        clearInterval(heartTimer);
        heartTimer = null;
    }

    if (!Utils.isNull(stopCodingTimer)) {
        clearInterval(stopCodingTimer);
        stopCodingTimer = null;
    }

    // TODO: 通过心跳检测机制，清理播放文件下的socket
    heartTimer = setInterval(function() {
        if (Object.keys(globalClient).length) {
            const timeNow = Utils.getTimestamp();
            for (let key in globalClient) {
                let items = globalClient[key];
                for (let ck in items) {
                    const socket = items[ck];
                    if (typeof  socket !== 'object' || Utils.isNull(socket)) {
                        continue;
                    }

                    if (!socket.hasOwnProperty('lastMessageTime') || Utils.isNull(socket.lastMessageTime)) {
                        socket.lastMessageTime = timeNow;
                        continue;
                    }

                    if (timeNow - socket.lastMessageTime > hlsConfig.hlsHeartTime) {
                        socket.pause();// 暂停读写数据
                        socket.end();// 半关闭 socket
                        socket.destroy();
                        delete items[ck];
                    }
                }
            }
        }
    }, 1000);

    stopCodingTimer = setInterval((tcp) => {
        // TODO: 可以在tcp服务端删除m3u8文件，
        // TODO: 文件格式可以改成{hlsPath} + {cameraIndexCode} + {yyyymmddhhiiss} + {rand}.m3u8,这样方便删除
        const keyLen = Object.keys(globalClient).length;
        if (keyLen) {
            for (let key in globalClient) {
                let items = globalClient[key];
                if (Object.keys(items).length === 0) {
                    const abPath = absolutePath.replace(/\\/g, '/');
                    const hPath = key.replace(/\\/g, '/');
                    const m3u8Path = abPath + '/' + hPath;
                    const ft = Utils.fsExistsSync(fs, m3u8Path);
                    // console.log('ft:', ft);
                    if (ft) {
                        let pathInfo = path.parse(key);
                        // TODO: tcp 发送取消推流
                        let utf8Data = JSON.stringify({
                            type: 'hlsRequest',
                            data: pathInfo,
                            msg: 'Send off transcoding service'
                        });
                        const hexData = Utils.trim(Utils.toUTF8Hex(utf8Data));
                        tcp.client.write(hexData, 'hex');
                        fs.unlinkSync(m3u8Path);
                        const dir = pathInfo.dir.replace(/\\/g, '/');
                        const tsPath = abPath + '/' + dir + '/';
                        for (let i = 0; i < 10; i++) {
                            const tsFile = tsPath + pathInfo.name + i + '.ts';
                            const tf = Utils.fsExistsSync(fs, tsFile);
                            // console.log('tf:', tf);
                            if (tf) {
                                console.log('tsFile:', tsFile);
                                fs.unlinkSync(tsFile);
                            }
                        }
                    }
                }
            }
        }
    }, 1000, tcpClient)
});

// server.on('connect', (request, socket) => {
//     // console.log(request, socket)
//     console.log('connect:' + request.getHeader('referer') + "\n");
// });
//
// server.on('request', (request, response) => {
//     // console.log('response:', response);
// });

server.on('connection', (socket) => {
    console.log('connection time is ' + DateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'));
});

server.on('close', (socket) => {
    console.log('The server is down' + "\n");
    for (let key in globalClient) {
        let items = globalClient[key];
        for (let ck in items) {
            const socket = items[ck];
            let dirname = absolutePath + '\\' + path.dirname(socket.m3u8Path);
            Utils.delDir(fs, dirname);
            socket.end();
        }
    }

    clearInterval(heartTimer);
    heartTimer = null;
    globalClient = [];
});

server.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
const hls = new hlsServer(server, {
    provider: {
        exists: function (req, callback) { // check if a file exists (always called before the below methods)
            if (fs.existsSync(req.filePath)) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        },
        getManifestStream: function (req, callback) {
            console.log('getManifestStream:');
            // TODO: 存储所有hls请求的客户端, key1:ip+port key2: m3u8文件名
            const socket = req.socket;
            socket.lastMessageTime = Utils.getTimestamp();
            socket.m3u8Path = req.filePath;
            // globalClient[key] = socket;
            // let key = Utils.saltHashStr(req.filePath, 'md5...');
            let key = req.filePath;
            let connections = [];
            if (globalClient.hasOwnProperty(key)) {
                connections = globalClient[key];
            }
            const sKey = socket.remoteAddress + ':' + socket.remotePort;
            if (!connections.hasOwnProperty(sKey)) {
                connections[sKey] = socket;
            }

            if (connections !== null) {
                globalClient[key] = connections;

            }

            console.log('req.filePath:', req.filePath);
            callback(null, fs.createReadStream(req.filePath, { bufferSize: 64 * 1024 }));
        },
        getSegmentStream: function (req, callback) {
            callback(null, fs.createReadStream(req.filePath));
        }
    }
});
server.setTimeout(0);
server.listen({
    host: hlsConfig.hlsHost,
    port: hlsConfig.hlsPort
});
