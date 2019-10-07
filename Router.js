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
const Utils = require('./libs/Utils');
const validator = require('validator');
const querystring = require('querystring');

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
            const videoList = require('./videos');
            const hlsConfig = require('./config');
            const fs = require('fs');
            let video = null;
            for (let key in videoList) {
                if (parseInt(videoList[key].code) === parseInt(jsonData.code.toString())) {
                    video = videoList[key];
                    break;
                }
            }

            if (video) {
                const DateFormat = require('dateformat');
                video['filename'] = DateFormat(new Date(), 'yyyymmddHHMMss');
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
                console.log('send msg');
                controller.tcpClient.client.write(hexData, 'hex');
                controller.tcpClient.registerEventCall('data', (data) => {
                    data = data.toString('utf8');
                    console.log('data:', data);
                });
                // if (validator.isJSON(data)) {
                //     let res = JSON.parse(data);
                //     let da = res.data;
                //     if (res.code === 10000 && !Utils.isNull(da.outputFile)) {
                //         while (true) {
                //             if (fs.existsSync(da.outputFile)) {
                //                 return JSON.stringify({
                //                     data: {url: 'http://' + hlsConfig.httpHost + ':' + hlsConfig.httpPort + '/' + da.outputFile},
                //                     code: 1000,
                //                     msg: 'successed'
                //                 });
                //             }
                //         }
                //     } else {
                //         return controller.endJSon({data: null, msg: '转码失败', code: 10003});
                //     }
                // } else {
                //     return controller.endJSon({data: null, msg: '转码失败', code: 10003});
                // }
                let timestamp = Utils.getTimestamp();
                let num = 0;
                let isBack = false;
                while (true) {
                    console.log((Utils.getTimestamp() - timestamp) / 1000);
                    if (Utils.getTimestamp() - timestamp >= hlsConfig.m3u8Created * 1000) {
                        break;
                    }

                    if (fs.existsSync(fpth)) {
                        isBack = true;
                        break;
                    }
                }

                if (isBack) {
                    return JSON.stringify({
                        data: {url: 'http://' + hlsConfig.hlsHostName + ':' + hlsConfig.hlsPort + '/' + hlsConfig.hlsPath + '/' + fullname},
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
    },
    {
        route: 'api/video/view',
        verbs: ['GET'],
        func: (id) => {
            console.log('show id is:', id);
        }
    }
];