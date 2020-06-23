const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const child_process = require('child_process');
const EventEmitter = require('events').EventEmitter;
const spawn = child_process.spawn;

const maxSize = 1;

let fmgPools = [];
const videoList = [
    // 'rtsp://admin:admin123@192.168.2.241/h264/ch33/sub/av_stream',
    'rtsp://admin:admin123@218.89.133.219/h264/ch33/sub/av_stream',
    // 'rtsp://admin:admin123@218.89.133.219/h264/ch34/sub/av_stream',
    'rtsp://admin:admin123@218.89.133.219/h264/ch35/sub/av_stream',
    // 'rtsp://admin:admin123@218.89.133.219/h264/ch36/sub/av_stream',
    // 'rtsp://admin:admin123@218.89.133.219/h264/ch37/sub/av_stream',
    // 'rtsp://admin:admin123@218.89.133.219/h264/ch38/sub/av_stream',
	// 'rtsp://admin:admin123@218.89.133.219/h264/ch42/sub/av_stream',
	// 'rtsp://admin:admin123@218.89.133.219/h264/ch49/sub/av_stream',
    // 'rtsp://admin:admin123@218.89.133.219/h264/ch7/sub/av_stream',
    // 'rtsp://admin:admin123@218.89.133.219/h264/ch8/sub/av_stream',
    // 'rtsp://admin:admin123@218.89.133.219/h264/ch9/sub/av_stream',
    // 'rtsp://admin:admin123@218.89.133.219/h264/ch10/sub/av_stream',

]

//ffmpeg -re -rtsp_transport tcp -i "rtsp://admin:admin123@192.168.2.241/h264/ch1/sub/av_stream" -f flv -vcodec libx264 -vprofile baseline -acodec aac -ar 44100 -strict -2 -ac 1 -f flv -s 640x380 -q 10 "rtmp://112.74.219.187:1935/live/livestream"
for (let i = 0; i < videoList.length; i++) {
    var ouputPath = "rtmp:/112.74.219.187:1935/live/livestream_" + (i + 1);
    var rtspUrl = videoList[i];
    console.log('ouputPath:', ouputPath);
    var fmg = ffmpeg(rtspUrl, {timeout: 432000})
        .addOptions([
            '-fflags nobuffer',
            '-threads 12',
            '-f flv',
            // '-vcodec libx264',
            '-vprofile baseline',
            // '-acodec aac',
            '-ar 44100',
            '-strict -2',
            '-ac 1',
            '-c:v libx264',
            '-c:a aac',
            // '-ac 1',
            '-strict',
            '-2',
            '-crf 18',
            '-preset fast',//ultrafast
            '-profile:v baseline',
            '-tune zerolatency',
            '-level 3.0',
            // '-f flv',
            '-s 640x380',
            '-q 10',
            '-maxrate 200k',
            '-bufsize 1024k',
            '-pix_fmt yuv420p',
            // '-flags',
            // '-global_header',
            // // '-vcodec copy',// 10 or 1
            // // '-acodec copy',
            // // '-f flv',// 10 or 15
            // '-start_number 1'// 1 or 0
        ])
        .format('flv')
        .videoBitrate('1024k')
        // .pipe(ouputPath, {end: true})
        .output(ouputPath)
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
        fmgPools.push(fmg);
        fmg.run();
		sleep(1000)
}

function sleep (seconds) {
    var now = new Date();
    var exitTime = now.getTime() + seconds;
    var lock = true;
    while (lock) {
        now = new Date();
        if (now.getTime() > exitTime) {
        	lock = false;
        }
    }
}