const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const Utils = require('./libs/Utils');

function AddVolume(volumeFile, volume, outputVolumeFile, indexNum) {
    indexNum = indexNum || 0;
    console.log('volumeFile:%s,volume:%s', volumeFile, volume);
    let command = ffmpeg(volumeFile, {timeout: 432000}).addOptions([
        "-af volume=" + volume
    ]).output(outputVolumeFile)
        .on('start', () => {
            console.log(indexNum + '号文件 start amplify volume ing !!!' + "\n");
        })
        .on('error', function (err) {
            console.log('An error occurred: ' + err.message);
        })
        .on('end', function () {
            console.log('Finished processing');
            fs.unlink(volumeFile, (err) => {
                if (err) throw err;
                console.log('文件已删除');
                fs.rename(outputVolumeFile, volumeFile, (err) => {
                    if (err) throw err;
                    console.log(indexNum + '号文件重命名成功');
                });
            });
        }).run();
}

let dir = "F:\\nodejs\\hk-hls-client\\volume\\Music";
let files = Utils.walkDir(dir);
if (files) {
    let i = 0;
    files.forEach((file, index) => {
        let pathInfo = path.parse(file);
        if (pathInfo.ext.toLocaleLowerCase() !== '.mp3') return false;
        let outputVolumeFile = pathInfo.dir + "\\" + i + '_' + pathInfo.base;
        AddVolume(file, 2, outputVolumeFile, i);
        i++;
    });
    console.log("一共要解析：", i + "个MP3文件");
}