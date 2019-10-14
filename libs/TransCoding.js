const Utils = require('./Utils');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

class TransCoding {
    constructor(socket, json, hlsConfig, root, videoList) {
        this.socket = socket;
        this.json = json;
        this.root = root;
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

    transcoding(globalPlayers) {
        if (!this.issetVideo(this.json, this.videoList)) {
            Utils.sendHex(this.socket, JSON.stringify({data: null, code: 10003, msg: 'not found device'}));
            this.socket.end();
        }

        let filepath = this.hlsPath + '/' + this.json.code;
        if (!this.json.hasOwnProperty('filename')) {
            Utils.sendHex(this.socket, JSON.stringify({data: null, code: 10003, msg: 'filename required'}));
            this.socket.end();
        }

        const path = filepath + '/' + this.json.subPath;
        if (!fs.existsSync(path)) {
            fs.mkdir(path, {recursive: true}, (err) => {
                !Utils.isNull(err) && console.error('mkdir filepath: ', err);
            });
        }

        let file = filepath + '/' + this.json.filename + '.m3u8';
        console.log('file:', file);
        // eg: rtsp://admin:byt2016!@192.168.0.203/h264/ch1/main/av_stream
        // let rtspUrl = "rtsp://"
        //     + this.json['username'] + ":"
        //     + this.json['password'] + "@"
        //     + this.json.ip + "/"
        //     + (Utils.isNull(this.json.videoEncode) ? "h264" : this.json.videoEncode.toString()) + "/"
        //     + this.json.channel.toString() + "/"
        //     + this.json.streamType;
        const rtspUrl = Utils.generateRTSPUrl(this.json);
        console.log('rtspUrl:%s', rtspUrl);
        let command = ffmpeg(rtspUrl, {timeout: 432000})
            .addOptions([
                '-fflags nobuffer',
                '-threads 12',
                '-c:v libx264',
                '-c:a aac',
                '-ac 1',
                '-strict',
                '-2',
                '-crf 18',
                '-preset fast',//ultrafast
                '-profile:v baseline',
                '-tune zerolatency',
                '-level 3.0',
                '-s 640x380',
                '-maxrate 200k',
                '-bufsize 1024k',
                '-pix_fmt yuv420p',
                '-flags',
                '-global_header',
                '-hls_time 10',// 10 or 1
                '-hls_list_size 6',
                '-hls_wrap 10',// 10 or 15
                '-start_number 1'// 1 or 0
            ])
            .videoBitrate('1024k')
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
        let key = this.getKey(this.json.code, this.json.subPath);
        globalPlayers[key] = {file: file, cmd: command};
        const outputFile = this.hlsConfig.hlsPath + file.replace(this.hlsPath, '').replace(/\\/g, '/');
        console.log('output file is:', outputFile);
        const utf8Data = JSON.stringify({data: {outputFile: outputFile}, code: 10000, msg: 'successed'});
        Utils.sendHex(this.socket, utf8Data);
        // this.socket.end();
        command.run();
    }

    closeClient() {

    }

    getKey(code, path) {
        return code + '#' + path;
    }

    endTranscoding(globalPlayers) {
        let pathInfo = this.json.data;
        // public/videos/10001/20191009222009/db577e.m3u8
        let dirs = this.getDirs(pathInfo);
        const cameraIndexCode = this.getCameraIndexCode(dirs);
        const subPath = this.getSubPath(dirs);
        const key = this.getKey(cameraIndexCode, subPath);
        console.log('key:', key);
        console.log('globalPlayers.indexOf(key):', globalPlayers.indexOf(key))
        if (globalPlayers.hasOwnProperty(key)) {//hasOwnProperty
            let item = globalPlayers[key]
            // Utils.delDir(fs, this.root + '\\' + pathInfo.dir);
            // TODO: 杀死所有正在运行的ffmpeg进程
            item.cmd.kill();
            delete globalPlayers[cameraIndexCode];
            setTimeout(() => {
                this.clearM3u8(pathInfo);
            }, 500);
        }
    }

    getDirs(pathInfo) {
        return pathInfo.dir.replace(/\\/g, '/').split('/');
    }

    getCameraIndexCode(dirs) {
        return dirs[dirs.length - 2];
    }

    getSubPath(dirs) {
        return dirs[dirs.length - 1];
    }

    checkIsPlayIng(globalPlayers) {
        let file = this.json.data;
        let pathInfo = path.parse(file);
        let dirs = this.getDirs(pathInfo);
        const cameraIndexCode = this.getCameraIndexCode(dirs);
        const subPath = this.getSubPath(dirs);
        const key = this.getKey(cameraIndexCode, subPath);
        console.log('checkIsPlayIng key:', key);
        if (globalPlayers.hasOwnProperty(key)) {
            let item = globalPlayers[key];
            item['lastMessageTime'] = Utils.getTimestamp();
            globalPlayers[key] = item;
        }
    }

    clearM3u8(pathInfo) {
        const absolutePath = path.dirname(__dirname);
        const selfDir = absolutePath + '/' + pathInfo.dir;
        const m3u8Path = selfDir + '/' + pathInfo.base;
        const ft = Utils.fsExistsSync(fs, m3u8Path);
        console.log('selfDir:', selfDir);
        console.log('ft:', ft);
        if (ft) {
            Utils.delDir(fs, selfDir);
        }
    }

    illegal(msg) {
        msg = msg || 'Illegal client, server denies access';
        this.socket.write(msg);
        this.socket.end();
        return false;
    }

    thumbImg() {
        let data = this.json;
        const folder = this.hlsConfig.imageDataFolder;
        if (!fs.existsSync(folder)) {
            fs.mkdir(folder, {recursive: true}, (err) => {
                console.log(err);
            });
        }

        let code = data.code;
        let filename = data.filename;
        const fullName = folder + '\\' + filename;
        let video = null;
        for (let key in this.videoList) {
            if (parseInt(this.videoList[key].code) === parseInt(code)) {
                video = this.videoList[key];
                break;
            }
        }

        if (video === null) {
            return false;
        }

        const rtspUrl =  Utils.generateRTSPUrl(video);
        console.log('rtspUrl:', rtspUrl);
        console.log('fullName:', fullName);
        const fmd = ffmpeg(rtspUrl).addOptions([
            '-threads 6',
            '-y',
            '-f image2',
            '-ss 10',
            '-t 0.001',
            '-s 640*320'
        ]).output(fullName)
            .on('start', () => {
                console.log('start genrate image');
            }).on('filenames', (filenames) => {
                console.log('Will generate ' + filenames.join(', '))
            }).on('end', () => {
                console.log('end genrated image');
            }).run();
    }
}

module.exports = TransCoding;