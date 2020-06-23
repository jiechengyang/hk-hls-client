// child_process.fork(modulePath, args)
//     modulePath：子进程运行的模块。

//     参数说明：（重复的参数说明就不在这里列举）

//         execPath：<String> 用来创建子进程的可执行文件，默认是/usr/local/bin/node。也就是说，你可通过execPath来指定具体的node可执行文件路径。（比如多个node版本）

//         execArgv：<Array> 传给可执行文件的字符串参数列表。默认是process.execArgv，跟父进程保持一致。

//         silent：<Boolean> 默认是false，即子进程的stdio从父进程继承。如果是true，则直接pipe向子进程的child.stdin、child.stdout等。

//         stdio：<Array> 如果声明了stdio，则会覆盖silent选项的设置。


// 例子一：会打印出 output from the child
// 默认情况，silent 为 false，子进程的 stdout 等
// 从父进程继承
const child_process = require('child_process');

// 产生两个分支，一个主进程，一个主进程的子进程
child_process.fork('./child01.js', {
    silent: false
});

console.log("程序运行结束");