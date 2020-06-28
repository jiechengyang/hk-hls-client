var child_process = require('child_process');
child_process.fork('./child01.js', {
    silent: false
});

// 例子二：不会打印出 output from the silent child
// silent 为 true，子进程的 stdout 等
// pipe 向父进程
child_process.fork('./child02.js',  {
    silent: true
});

// 例子三：打印出 output from another silent child
var child = child_process.fork('./child03.js', {
    silent: true
});
child.stdout.setEncoding('utf8');
child.stdout.on('data', function(data){
    console.log('child03 output:', data);
});
console.log("程序运行结束");