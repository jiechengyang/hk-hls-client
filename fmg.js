const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
let config = require('config.js');
let dirname = __dirname.replace(/\\/g, '/');

// var infs = fs.createReadStream(__dirname + '/test.avi');
//
// infs.on('error', function(err) {
//     console.log(err);
// });
let tspath = __dirname + '/' + config.hlsPath;
if (!fs.existsSync(tspath)) {
    fs.mkdir(tspath, {recursive: true}, (err) => {
        console.log(error);
    });
}
// const command = ffmpeg(__dirname + '/test.mp4', {timeout: 432000}).addOptions([
//     '-profile:v baseline', // baseline profile (level 3.0) for H264 video codec
//     '-level 3.0',
//     '-s 640x360',          // 640px width, 360px height output video dimensions
//     '-start_number 0',     // start the first .ts segment at index 0
//     '-hls_time 10',        // 10 second segment duration
//     '-hls_list_size 0',    // Maxmimum number of playlist entries (0 means all entries/infinite)
//     '-f hls'
// ])
//     .output(tspath + '/output.test.m3u8')
//     // .on('start', function () {
//     //     // Send SIGSTOP to suspend ffmpeg
//     //     command.kill('SIGSTOP');
//     //
//     //     // doSomething(function () {
//     //     //     // Send SIGCONT to resume ffmpeg
//     //     //     command.kill('SIGCONT');
//     //     // });
//     // })
//     .on('error', function (err) {
//         console.log('An error occurred: ' + err.message);
//     })
//     .on('end', function () {
//         console.log('Finished processing');
//     }).run();
//
// setTimeout(function () {
//     command.on('error', function () {
//         console.log('Ffmpeg has been killed');
//     });
//
//     command.kill();
// }, 60000);

var command = ffmpeg('rtsp://admin:byt2016!@192.168.0.203/h264/ch1/main/av_stream', {timeout: 432000})
    .addOptions([
        '-fflags nobuffer',
        '-c:v libx264',
        '-c:a aac',
        '-ac 1',
        '-strict',
        '-2',
        '-crf 18',
        '-profile:v baseline',
        '-s 640x360',
        '-maxrate 400k',
        '-bufsize 1835k',
        '-pix_fmt yuv420p',
        '-flags',
        '-global_header',
        '-hls_time 10',
        '-hls_list_size 6',
        '-hls_wrap 10',
        '-start_number 1'
    ])
    .output(tspath + '/output.rtsp.m3u8')
    .on('error', function (err) {
        console.log('An error occurred: ' + err.message);
    })
    .on('end', function () {
        console.log('Finished processing');
    }).run();