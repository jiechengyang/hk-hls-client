const Service = require('node-windows').Service;
let hlsConfig = require('./config');
// Create a new service object
const svc = new Service({
    name:'Hls TcpServer',
    description: 'hls tcp服务端，端口号：' + hlsConfig.tcpPort,
    script: 'F:\\nodejs\\hk-hls-client\\TcpServer.js'
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
    console.log('start');
    svc.start();
});

svc.install();