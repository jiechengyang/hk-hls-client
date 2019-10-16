const func = () => {
    switch (arguments.length) {
        case 1:
            let data = arguments[0];
            return JSON.stringify(data);
        case 2:
            const req = arguments[0];
            const res = arguments[1];
            break;
        default:
            return JSON.stringify({data: 'test', code: 10000, msg: 'This is Test Data'});
    }
};
const fs = require('fs');
const videoList = require('./videos');
const Utils = require('./libs/Utils');
const querystring = require('querystring');
const hlsConfig = require('./config');
const FileCache = require('./libs/FileCache');
const cache = FileCache.getSingleton(__dirname + '/cache');
module.exports = [
    {
        route: 'api/video/get-live-url',
        verbs: ['POST'],
        func: (controller) => {
            // if (arguments.length !== 2) {
            //     return null;
            // }

            // let [req, res, body] = arguments;
            let jsonData = querystring.parse(controller.getBody());
            let video = null;
            for (let key in videoList) {
                if (parseInt(videoList[key].code) === parseInt(jsonData.code.toString())) {
                    video = videoList[key];
                    break;
                }
            }

            if (video) {
                if (!Utils.isNull(jsonData.noCache) && jsonData.noCache == 1) {
                    cache.del(video.code);
                }

                const cacheUrl = cache.get(video.code);
                console.log(cacheUrl);
                // return;
                if (!Utils.isNull(cacheUrl)) {
                    return JSON.stringify({
                        data: {url: cacheUrl},
                        code: 1000,
                        msg: 'successed'
                    });
                }
                const DateFormat = require('dateformat');
                const subPath = DateFormat(new Date(), 'yyyymmddHHMMss');
                video['subPath'] = subPath;
                video['filename'] = subPath + '/' + Utils.genRandomString(6);
                const hlsPath = __dirname + '/' + hlsConfig.hlsPath;
                const fullname = video.code + '/' + video['filename'] + '.m3u8';
                let fpth = hlsPath + '/' + fullname;
                fpth = fpth.replace(/\\/g, '/');
                console.log('fpth:', fpth);
                // tcp.client.setEncoding('binary');
                // TODO: parseInt() 函数可解析一个字符串，并返回一个整数
                // 当参数 radix 的值为 0，或没有设置该参数时，parseInt() 会根据 string 来判断数字的基数。
                // 举例，如果 string 以 "0x" 开头，parseInt() 会把 string 的其余部分解析为十六进制的整数。如果 string 以 0 开头，那么 ECMAScript v3 允许 parseInt() 的一个实现把其后的字符解析为八进制或十六进制的数字。如果 string 以 1 ~ 9 的数字开头，parseInt() 将把它解析为十进制的整数。
                // parseInt("10");			//返回 10
                // parseInt("19",10);		//返回 19 (10+9)
                // parseInt("11",2);		//返回 3 (2+1)
                // parseInt("17",8);		//返回 15 (8+7)
                // parseInt("1f",16);		//返回 31 (16+15)
                // parseInt("010");		//未定：返回 10 或 8
                video['type'] = 'request';
                let utf8Data = JSON.stringify(video);
                const hexData = Utils.trim(Utils.toUTF8Hex(utf8Data));
                if (!controller.tcpClient.isConnected) {
                    return false;
                }
                console.log('send msg');
                controller.tcpClient.client.write(hexData, 'hex');
                controller.tcpClient.registerEventCall('data', (data) => {
                    data = data.toString('utf8');
                    console.log('data:', data);
                });
                let timestamp = Utils.getTimestamp();
                let isBack = false;
                while (true) {
                    let diff = Utils.getTimestamp() - timestamp;
                    console.log(diff / 1000);
                    if (diff >= hlsConfig.m3u8Created * 1000) {
                        break;
                    }

                    if (fs.existsSync(fpth)) {
                        isBack = true;
                        break;
                    }
                }

                if (isBack) {
                    const rtspUrl = 'http://' + hlsConfig.hlsHostName + ':' + hlsConfig.hlsPort + '/' + hlsConfig.hlsPath + '/' + fullname;
                    cache.set(video.code, rtspUrl);
                    return JSON.stringify({
                        data: {url: rtspUrl},
                        code: 1000,
                        msg: 'successed'
                    });
                } else {
                    return controller.endJSon({data: null, msg: '转码失败', code: 10003});
                }
            } else {
                return controller.endJSon({data: null, msg: '找不到该摄像头', code: 10003});
            }
        }
    },
    {
        route: 'api/video/thumb',
        verbs: ['GET'],
        func: (controller) => {
            const queryParams = controller.getQueryParams();
            let code = queryParams['code'];
            let video = null;
            for (let key in videoList) {
                if (parseInt(videoList[key].code) === parseInt(code)) {
                    video = videoList[key];
                    break;
                }
            }

            if (!video) {
                return controller.endJSon({data: null, msg: '找不到该摄像头', code: 10003});
            }

            const folder = hlsConfig.imageDataFolder;
            // if (!fs.existsSync(folder)) {
            //     fs.mkdir(folder, {recursive: true}, (err) => {
            //         console.log(error);
            //     });
            // }

            let filename = code + '@' + Utils.getTimestamp() + '.jpg';
            const fullName = folder + '\\' + filename;
            try {
                if (!controller.tcpClient.isConnected) {
                    throw new Error("tcp not connect");
                }

                const rtspUrl = Utils.generateRTSPUrl(video);
                let utf8Data = {
                    type: 'thumbImg',
                    code: code,
                    filename: filename
                };

                utf8Data = JSON.stringify(utf8Data);
                const hexData = Utils.trim(Utils.toUTF8Hex(utf8Data));
                controller.tcpClient.client.write(hexData, 'hex');
                // TODO: 可以提交给tcp处理，然后使用white true；tcp服务需要定时清理图片（比如：每天晚上0点清理生成的文件）
                const dirs = folder.split("\\");
                const returnData = hlsConfig.imageDataServer + dirs[dirs.length - 1] + '/' + filename;
                console.log('returnData:', returnData);
                return controller.endJSon({data: returnData, msg: '', code: 10000});
                // let isCreated = false;
                // let timestamp = Utils.getTimestamp();
                // while (true) {
                //     let diff = Utils.getTimestamp() - timestamp;
                //     console.log(diff / 1000);
                //     if (diff >= hlsConfig.thumbCreated * 1000) {
                //         throw new Error("timeout...");
                //     }
                //
                //     if (Utils.fsExistsSync(fs, fullName)) {
                //         isCreated = true;
                //         break;
                //     }
                // }
                //
                // if (isCreated) {
                //     return controller.endJSon({data: returnData, msg: '', code: 10000});
                // }

            } catch (e) {
                console.error(e);
                return controller.endJSon({data: null, msg: e.toString(), code: 10003});
            }
        }
    },
    {
        route: 'api/video/list',
        verbs: ['GET', 'POST'],
        func: () => {

        }
    },
    {
        route: 'api/video/create',
        verbs: ['POST'],
        func: () => {

        }
    },
    {
        route: 'api/video/update',
        verbs: ['POST'],
        func: () => {

        }
    },
    {
        route: 'api/video/delete',
        verbs: ['POST'],
        func: () => {

        }
    }
];