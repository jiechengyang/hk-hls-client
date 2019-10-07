const net = require('net');
const Utils = require('./Utils');
// const client = net.createConnection({host: 'localhost', port: 12860}, () => {
//     // 'connect' 监听器
//     console.log('已连接到服务器');
//     client.write('你好世界!\r\n');
// });
//
// client.on('data', (data) => {
//     console.log(data.toString());
//     client.end();
// });
//
// client.on('end', () => {
//     console.log('已从服务器断开');
// });

module.exports = class TcpClient {
    constructor(host, port) {
        try {
            this.host = host;
            this.port = port;
            this.events = [];
            this.successed = true;
            this.connNum = 5;
            console.log('this.host:%s,this.port:%s', this.host, this.port);
            this.client = net.createConnection({host: host, port: port});//, this.onConnect
            // this.client.setTimeout(1000 * 60);
            this.client.on('error', this.onError.bind(this));
        } catch (e) {
            const err = new Error(e);
            console.error(err.name + ':' + err.message);
        }
    }

    onConnect() {
        console.log('已连接到服务器:');
        if (!Utils.isNull(this.events) && this.events.indexOf('connect') >= 0 && !Utils.isNull(this.events['connect'])) {
            let events = this.events['connect'];
            for (let c in events) {
                typeof events[c] === 'function' && events[c]();
            }
        }
        return true;
    }

    onData(data) {
        // console.log(data.toString());
        // this.client.end();
        if (!Utils.isNull(this.events) && this.events.indexOf('data') >= 0 && !Utils.isNull(this.events['data'])) {
            let events = this.events['data'];
            for (let c in events) {
                typeof events[c] === 'function' && events[c](data);
            }
        }
    }

    onTimeout() {
        console.log('服务器连接超时');
        this.client.end();
    }

    onEnd() {
        console.log('已从服务器断开');
    }

    onError(error) {
        // console.log(this.connNum);
        if (--this.connNum > 0) {
            this.client = net.createConnection({host: this.host, port: this.port}, this.onConnect);
            // this.client.setTimeout(1000 * 60);
            this.client.on('error', this.onError.bind(this));
        } else {
            console.log('tcp server connect failed!!!');
        }
        // this.client.destroy(error);
    }

    handler() {
        this.client.on('connect', this.onConnect.bind(this));
        this.client.on('data', this.onData.bind(this));
        this.client.on('timeout', this.onTimeout.bind(this));
        this.client.on('end', this.onEnd);
    }

    registerEventCall(eventName, call) {
        let calls = [];
        if (this.events.indexOf(eventName) >= 0 || !Utils.isNull(this.events[eventName])) {
            console.log('this.events[eventName]:', this.events[eventName]);
            console.log('calls:', calls);
            calls = this.events[eventName];
        }

        calls.push(call);
        this.events[eventName] = calls;
    }
}