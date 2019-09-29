const Utils = require('./Utils');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

class TransCoding {
    constructor(socket, json, hlsConfig, videoList) {
        this.socket = socket;
        this.json = json;
        this.hlsConfig = hlsConfig;
        this.hlsPath = path.dirname(__dirname) + '/' + hlsConfig.hlsPath;
        this.videoList = videoList;
    }

    initApi() {

    }

    getPingclient() {

    }

    issetVideo(v, videos) {
        let tmp = false;
        for (let k in videos) {
            if (videos[k].code === v.code) {
                tmp = true;
                break;
            }
        }

        return tmp;
    }

    transcoding(globalCmd, globalPlayers) {
        if (!this.issetVideo(this.json, this.videoList)) {
            Utils.sendHex(this.socket, JSON.stringify({data: null, code: 10003, msg: 'not found device'}));
            this.socket.end();
        }

        let filepath = this.hlsPath + '/' + this.json.code;
        if (!this.json.hasOwnProperty('filename')) {
            Utils.sendHex(this.socket, JSON.stringify({data: null, code: 10003, msg: 'filename required'}));
            this.socket.end();
        }

        if (!fs.existsSync(filepath)) {
            fs.mkdir(filepath, {recursive: true}, (err) => {
                !Utils.isNull(err) && console.error('mkdir filepath: ', err);
            });
        }

        let file = filepath + '/' + this.json.filename + '.m3u8';
        console.log('file:', file);
        // eg: rtsp://admin:byt2016!@192.168.0.203/h264/ch1/main/av_stream
        let rtspUrl = "rtsp://"
            + this.json['username'] + ":"
            + this.json['password'] + "@"
            + this.json.ip + "/"
            + (Utils.isNull(this.json.videoEncode) ? "h264" : this.json.videoEncode.toString()) + "/"
            + this.json.channel.toString() + "/"
            + this.json.streamType;
        console.log('rtspUrl:%s', rtspUrl);
        let command = ffmpeg(rtspUrl, {timeout: 432000})
            .addOptions([
                '-fflags nobuffer',
                '-threads 6',
                '-c:v libx264',
                '-c:a aac',
                '-ac 1',
                '-strict',
                '-2',
                '-crf 18',
                '-preset ultrafast',
                '-profile:v baseline',
                '-s 640x360',
                '-maxrate 400k',
                '-bufsize 1835k',
                '-pix_fmt yuv420p',
                '-flags',
                '-global_header',
                '-hls_time 1',// 10
                '-hls_list_size 6',
                '-hls_wrap 10',
                '-start_number 1'
            ])
            .output(file)
            .on('start', () => {
                console.log('start zhuan ma ing !!!' + "\n");
            })
            .on('progress', function (info) {
                // console.log('progress ' + info.percent + '%');
                // console.log('timemark:', info.timemark);
            })

            .on('error', function (err) {
                console.log('An error occurred: ' + err.message);
            })
            .on('end', function () {
                console.log('Finished processing');
            });
        globalPlayers[this.json.code] = {file: file};
        globalCmd = command;
        const outputFile = this.hlsConfig.hlsPath + file.replace(this.hlsPath, '').replace(/\\/g, '/');
        console.log('output file is:', outputFile);
        const utf8Data = JSON.stringify({data: {outputFile: outputFile}, code: 10000, msg: 'successed'});
        Utils.sendHex(this.socket, utf8Data);
        // this.socket.end();
        command.run();
    }

    closeClient() {

    }

    endTranscoding() {

    }

    illegal(msg) {
        msg = msg || 'Illegal client, server denies access';
        this.socket.write(msg);
        this.socket.end();
        return false;
    }
}

module.exports = TransCoding;