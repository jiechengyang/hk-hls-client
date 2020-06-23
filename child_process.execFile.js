const child_process = require('child_process');
// file：<String> 可执行文件的名字，或者路径。
child_process.execFile('node', ['--version'], (error, stdout, stderr) => {
    if (error)
        throw error;
    console.log(stdout);
});

// ====== 扩展阅读 =======

// 从node源码来看，exec()、execFile()最大的差别，就在于是否创建了shell。（execFile()内部，options.shell === false），那么，可以手动设置shell。以下代码差不多是等价的。win下的shell设置有所不同，感兴趣的同学可以自己试验下。

// 备注：execFile()内部最终还是通过spawn()实现的， 如果没有设置 {shell: '/bin/bash'}，那么 spawm() 内部对命令的解析会有所不同，execFile('ls -al .') 会直接报错。


// Error: spawn /bin/bash ENOENT
child_process.execFile('ls -al', {shell: '/bin/bash'}, (error, stdout, stderr) => {
    if(error){
        throw error;
    }
    console.log(stdout);
});