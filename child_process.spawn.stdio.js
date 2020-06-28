var spawn = require('child_process').spawn;
var ls = spawn('ls', ['-al'], {
    stdio: 'inherit'
});
ls.on('close', code => {
    console.log('child exists with code:', + code);
});

