const Utils  = require('./Utils');
class HeartbeatPacket {
    constructor() {
        this.state = null;
        this.instance = null;
        this.timer = null;
        // Object.defineProperty(this, "state", {
        //     get: () => {
        //         console.log('state is ', state);
        //     },
        //     set: (value) => {
        //         state = value;
        //     }
        // });
    }

    detection(workers, heartTime) {
        // console.log(workers, heartTime);
        const timeNow = Utils.getTimestamp();
        for (let i = 0; i < workers.length; i++) {
            let socket = workers[i];
            if (typeof  socket !== 'object' || Utils.isNull(socket) || socket.isCheckHeart === false) {
                continue;
            }
            // console.log(typeof  socket);
            // 有可能该connection还没收到过消息，则lastMessageTime设置为当前时间
            if (!socket.hasOwnProperty('lastMessageTime') || Utils.isNull(socket.lastMessageTime)) {
                socket.lastMessageTime = timeNow;
                continue;
            }

            // console.log('socket.lastMessageTime:%s,timeNow:%s', socket.lastMessageTime, timeNow);

            // 上次通讯时间间隔大于心跳间隔，则认为客户端已经下线，关闭连接
            if (timeNow - socket.lastMessageTime > heartTime) {
                socket.write('Client connection timeout');
                socket.pause();// 暂停读写数据
                socket.end();// 半关闭 socket
                socket.destroy();
                workers[i] = null;
                // delete workers[i];
            }
        }
    }

    detectionLater(workers, heartTime) {
        if (!this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        this.timer = setInterval(this.detection, 1000, workers, heartTime);
    }

    static  getInstance() {
        if (!this.instance) {
            this.instance = new this();
        }
        return this.instance;
    }
    static create() {
        this.instance = new this();
        return this.instance;
    }
}


HeartbeatPacket.prototype = {
    get state() {
        console.log("get:" + this._value);
        return this._value;
    },
    set state(val) {
        this._value = val;
        console.log("set:" + this._value);
    }
};

module.exports = HeartbeatPacket;