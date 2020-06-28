var spawn = require('child_process').spawn;

// 运行 echo "hello nodejs" | wc Linux wc命令用于计算字数。
// -c或--bytes或--chars 只显示Bytes数。
var ls = spawn('bash', ['-c', 'echo hello nodejs | wc'], {
    stdio: 'inherit',
    shell: true
});

ls.on('close', function(code){
    console.log('child exists with code: ' + code);
});

