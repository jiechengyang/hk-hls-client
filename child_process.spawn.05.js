var child_process = require('child_process');

var echo  = child_process.spawn('echo', ['hello nodejs']);
var grep = child_process.spawn('grep', ['nodejs']);
grep.stdout.setEncoding('utf8');
echo.stdout.on('data', data => {
    grep.stdin.write(data);
});
echo.on('close', code => {
    if (code !== 0) {
        console.log('echo exists with code:' + code);
    }
    grep.stdin.end();
});
grep.stdout.on('data', data => {
    console.log('grep: ' + data);
});
grep.on('close', code => {
    if(code !== 0) {
        console.log('grep exists with code: ' + code);
    }
});
