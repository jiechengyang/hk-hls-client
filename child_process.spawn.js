// child_process.spawn(command, args)
//     command：要执行的命令

//     options参数说明：

//     argv0：[String] 这货比较诡异，在uninx、windows上表现不一样。有需要再深究。

//     stdio：[Array] | [String] 子进程的stdio。参考这里

//     detached：[Boolean] 让子进程独立于父进程之外运行。同样在不同平台上表现有差异，具体参考这里

//     shell：[Boolean] | [String] 如果是true，在shell里运行程序。默认是false。（很有用，比如 可以通过 /bin/sh -c xxx 来实现 .exec() 这样的效果）

// example 01: sample 
var spawn = require('child_process').spawn;
var ls = spawn('ls', ['-al']);

ls.stdout.on('data', function(data){
    console.log('data from child: ' + data);
});


ls.stderr.on('data', function(data){
    console.log('error from child: ' + data);
});

ls.on('close', function(code){
    console.log('child exists with code: ' + code);
});


