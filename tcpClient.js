const net = require('net');

const tcpClient = net.createConnection({
    host: '192.168.0.103',
    port: 6008
});

tcpClient.addListener('connect', (e) => {
    console.log('已连接到服务器' + "\r\n");
});
tcpClient.addListener('timeout', (e) => {
    console.log('服务器连接超时' + "\r\n");
});
tcpClient.addListener('end', (e) => {
    console.log('已从服务器断开' + "\r\n");
});
tcpClient.addListener('error', (e) => {
    console.log('发送错误' + "\r\n");
    console.error(e);
});
process.on('exit', (code) => {
    console.log(`退出码: ${code}`);
    setTimeout(() => {
        console.log('此处不会运行');
    }, 0);
});
process.on('unhandledRejection', (reason, promise) => {
    console.log('未处理的拒绝：', promise, '原因：', reason);
    // 记录日志、抛出错误、或其他逻辑。
});