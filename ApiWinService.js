const Service = require('node-windows').Service;
let hlsConfig = require('./config');
// Create a new service object
const svc = new Service({
    name:'Hls ApiServer',
    description: 'hls api服务端，端口号：' + hlsConfig.apiPort,
    script: 'F:\\nodejs\\hk-hls-client\\ApiServer.js'
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
    console.log('start');
    svc.start();
});

svc.install();