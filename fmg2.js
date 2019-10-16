// IMPORTS
var fs = require('fs');
//var https = require('https');
var http = require('http');
var child_process = require('child_process');

// EVENTEMITER (Not used so far)
var util = require('util');
var EventEmitter = require('events').EventEmitter;

// These never change...
var spawn = child_process.spawn;
var args = ['-i', 'pipe:0', '-f', 'mp3', '-ac', '2', '-ab', '128k', '-acodec', 'libmp3lame', 'pipe:1'];

// STREAMHANDLER
var StreamHandler = function (url, name) {

    // CREATE FFMPEG PROCESS
    var ffmpeg = spawn('ffmpeg', args);

    // GRAB STREAM
    http.get(url, function (res) {
        res.pipe(ffmpeg.stdin);
    });

    // WRITE TO FILE
    ffmpeg.stdout.pipe(fs.createWriteStream(name));

    ffmpeg.on("exit", function () {
        console.log("Finished:", name);
    });

    //DEBUG
    ffmpeg.stdout.on("data", function (data) {
        console.error(name, "received data");
    });
}
util.inherits(StreamHandler, EventEmitter);
// var StreamHandler = function(url, name){
//
//     // CREATE FFMPEG PROCESS
//     this.ffmpeg = spawn('ffmpeg', args);
//
//     // GRAB STREAM
//     http.get(url, (res) => {
//         res.pipe(this.ffmpeg.stdin);
//     });
//
//     // WRITE TO FILE
//     this.ffmpeg.stdout.pipe(fs.createWriteStream(name));
//
//     this.ffmpeg.on("exit", () => {
//         console.log("Finished:", name);
//     });
//
//     //DEBUG
//     this.ffmpeg.stdout.on("data", (data) => {
//         console.error(name, "received data");
//     });
// }

// TESTING
var vidUrl = 'http://www.sample-videos.com/video/mp4/720/big_buck_bunny_720p_1mb.mp4';
var test1 = new StreamHandler(vidUrl, "test1.mp3");
var test2 = new StreamHandler(vidUrl, "test2.mp3");