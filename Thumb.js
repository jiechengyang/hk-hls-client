const ffmpeg = require('fluent-ffmpeg');

ffmpeg('rtsp://admin:q11111111@39.206.49.18/h264/ch1/main/av_stream')
    .on('filenames', function (filenames) {
        console.log('Will generate ' + filenames.join(', '))
    })
    .on('end', function () {
        console.log('Screenshots taken');
    })
    .withFrames(1)
    // .withSize('640x480')
    .takeScreenshots({
        count: 2,
        timemarks: ['0.5', '1']
    }, 'test', function (err, filenames) {
        console.log(filenames);
        console.log('screenshots were saved');
    });