const Service = require('node-windows').Service;
let hlsConfig = require('./config');
// Create a new service object
const svc = new Service({
    name:'Hls Player Server',
    description: 'hls 服务端，端口号：' + hlsConfig.hlsPort,
    script: 'F:\\nodejs\\hk-hls-client\\HlsServer.js'
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
    console.log('start');
    svc.start();
});

svc.install();