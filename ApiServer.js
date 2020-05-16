const http = require('http');
const Utils = require('./libs/Utils');
const fs = require('fs');
const path = require('path');
const queryString = require('querystring');
const validator = require('validator');
const router = require('./Router');
let hlsConfig = require('./config');
const DateFormat = require('dateformat');
let tcpClient = null;
let tcpPingTimer = null;
let BaseController = require('./libs/BaseController');//TODO: OR import {BaseController} from './libs/BaseController'
const webServer = http.createServer((req, response) => {
    let body = '';
    let controller = new BaseController(req, response, router, tcpClient);
    req = response = null;
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Headers': 'X-Requested-With',
        'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS',
    };
    controller.setResponseHeaders(headers);
    controller.createRouteInfo();
    if (!controller.authAccess()) {
        return controller.endJSon({data: null, code: 10003, msg: "找不到路由，请检查url和method"}, 400);
    }

    controller.request.on('data', function (data) {
        if (controller.getMethod() === 'POST') {
            body += data;//TODO: 这里会隐式转换Buffer->string / data.toString()
        }
    });

    // 'end' 事件表明整个请求体已被接收
    // post传递的数据一般比较大，分多次传递，监听data事件，每当一段数据到达时就触发一次，将数据拼接到str字符串里（这里仅演示，实际中用字符串接收并不是很好的选择）。end事件是当所有数据接收完成时触发的。
    // 接收到的字符串数据跟get方法获得的是一样的格式，即a=5&b=10这样的，所以可以用querystring模块来解析。
    controller.request.on('end', function () {
        console.log('end body:', body);
        controller.setBody(body);
        if (validator.isJSON(body)) {

        } else {
            // let jsonData = queryString.parse(body);
            return controller.runAction();
            // console.log('jsonData:', jsonData);
        }
        // try {
        //     const data = JSON.parse(body);
        //     // 响应信息给用户。
        //     res.write(typeof data);
        //     res.end();
        // } catch (er) {
        //     // json 解析失败。
        //     res.statusCode = 400;
        //     return res.end(`错误: ${er.message}`);
        // }
    });

    controller.request.on('error', (e) => {
        console.error(`请求遇到问题: ${e.message}`);
    });

    controller.request.on('timeout', () => {
        console.log('timeout!!!');
    });

    controller.request.on('close', () => {
        console.log('http client disconnet');
    });

});

webServer.on('listening', () => {
    console.log('Api Server started, localAddress:%s,localPort:%s', webServer.address().address, webServer.address().port);
    connectTcp();
    pingEcho();
});

webServer.on('connect', (request, socket) => {
    // console.log(request, socket)
    console.log('connect:' + request.getHeader('referer') + "\n");
});

webServer.on('request', (request, response) => {
    // console.log('response:', response);
});

webServer.on('connection', (socket) => {
    console.log('connection time is ' + DateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'));
});

webServer.on('close', (socket) => {
    console.log('The server is down' + "\n");
});
webServer.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

// const hls = new hlsServer(webServer);
// webServer.setTimeout(0);
webServer.listen({
    host: hlsConfig.apiHost,
    port: hlsConfig.apiPort
});

function connectTcp() {
    const TcpClient = require('./libs/TcpClient');
    console.log('start connect tcp server....');
    tcpClient = new TcpClient(hlsConfig.tcpHost, hlsConfig.tcpPort);
    tcpClient.registerEventCall('connect', () => {
        let utf8Data = JSON.stringify({
            type: 'init',
            indexCode: hlsConfig.indexCode,
            msg: 'init client'
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
            msg: 'I\'m online.'
        });
        const hexData = Utils.trim(Utils.toUTF8Hex(utf8Data));
        tcp.client.write(hexData, 'hex');
    }, hlsConfig.heartTime <= diff ? diff - 10 * 1000 : hlsConfig.heartTime - diff, tcpClient);
}
