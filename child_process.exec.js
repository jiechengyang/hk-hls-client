// 几种创建子进程的方式
//     注意事项：

//         下面列出来的都是异步创建子进程的方式，每一种方式都有对应的同步版本。

//         .exec()、.execFile()、.fork()底层都是通过.spawn()实现的。

//         .exec()、execFile()额外提供了回调，当子进程停止的时候执行。

//         child_process.spawn(command, args)
//         child_process.exec(command, options)
//         child_process.execFile(file, args[, callback])
//         child_process.fork(modulePath, args)

//     child_process.exec(command, options)
//         创建一个shell，然后在shell里执行命令。执行完成后，将stdout、stderr作为参数传入回调方法。

//         spawns a shell and runs a command within that shell, passing the stdout and stderr to a callback function when complete.

const exec = require('child_process').exec;
exec('ls -al', (error, stdout, stderr) => {
    if (error) {
        console.error(`error:${error}`);
        return;
    }

    console.log('stdout: ' + stdout);
    console.log('stderr: ' + typeof stderr);
});
// 系统调用 exec ，主进程退出
console.log('程序执行结束');
// 失败的例子
exec('ls hello.txt', function(error, stdout, stderr){
    if(error) {
        console.error('error: ' + error);
        return;
    }
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
});
// 风险项
//     传入的命令，如果是用户输入的，有可能产生类似sql注入的风险，比如
exec('ls hello.txt; rm -rf *', function(error, stdout, stderr){
    if(error) {
        console.error('error: ' + error);
        // return;
    }
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
});
// 备注事项
// Note: Unlike the exec(3) POSIX system call, child_process.exec() does not replace the existing process and uses a shell to execute the command.
// 与exec(3)POSIX系统调用不同，Child_process.exec()不会替换现有进程，而是使用shell来执行命令。