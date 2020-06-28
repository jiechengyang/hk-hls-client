// 首先，process.execArgv的定义，参考这里。设置execArgv的目的一般在于，让子进程跟父进程保持相同的执行环境。

// 比如，父进程指定了--harmony，如果子进程没有指定，那么就要跪了。

var child_process = require('child_process');

console.log('parent execArgv: ' + process.execArgv);

child_process.fork('./child.execArgv.js', {
    execArgv: process.execArgv
});
