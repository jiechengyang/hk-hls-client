# ip-camera-hls
将ip摄像头支持的rtsp、rtmp转成hls

## 使用它做啥?
为了解决不会android开发，ios开发，不懂c++,然后又想在浏览器上、混合app上观看实时的摄像头，那就可以使用它来作为媒介中转。

由于flash不久将会退出浏览器市场（谷歌已经说明在2020年不再支持flash），所以使用rtmp流的摄像头，暂时能通过flash播放。
基于这样的现状，我查阅了网上的一些资料，大体都是将其转成hls，在使用video-js-hls插件播放
对于ios用户，可以直接在浏览器下播放m3u8文件


## 使用如下

 * 配置json
    目前是把摄像头配置在文件里，存哪里可以自行修改；下面展示的是海康摄像头的参数
    ```json
      {
        "name": "192.168.0.102",// 摄像头名称
        "code": 10002,// 摄像头唯一标识
        "ip": "192.168.0.102",// 摄像头IP
        "port": 554,// 摄像头端口
        "username": "admin",// 账户
        "password": "123456",// 密码
        "videoEncode": "h264",// 编码方式
        "channel": "ch1",// 通道
        "streamType": "sub/av_stream"// 码率类型：主码流和子码流
      }
    ```
 * 配置config.js
 
    ```js
    module.exports = {
        hlsPath: 'public/videos',// m3u8生成文件的目录
        apiHost: '0.0.0.0',// api接口主机名
        apiPort: 8080,// api接口端口号
        hlsHost: '0.0.0.0',// hls播放服务主机名
        hlsHostName: '127.0.0.1',// hls播放服务对外主机名
        hlsPort: 10860,// hls播放服务端口号
        tcpHost: '0.0.0.0',// 转流服务主机名
        tcpPort: 12860,// 转流服务端口
        tcpMaxConnect: 100,// 转流服务最大连接客户端
        heartTime: 1000 * 60 * 5,// 心跳检测时间
        hlsHeartTime: 1000 * 60 * 1,// hls客户端心跳检测时间
        outHeartTime: 1000 * 60 * 3,// m3u8存活时间
        indexCode: 'pvcMB!',// 转流服务握手包
        m3u8Created: 20,// 等待生成m3u8文件时间（单位：秒）
        thumbCreated: 10,// 等待生成视频第一帧图片时间（单位：秒）
        imageDataFolder: "D:\\www\\ImgData\\Camera",// 视频帧图片存放目录
        imageDataServer: 'http://39.206.56.249:8003/',// 图片服务器
        redis: {// redis配置，暂时不需要
            host: '127.0.0.1',
            port: 6379
        }
    };
    ```
    
 * 启动转流服务
 
 ```shell
    node TcpServer.js
 ```
 
 * 启动api服务
 
 ```shell
    node ApiServer.js
 ```
 
 * 启动hls播放服务
 
 ```shell
    node HlsServer.js
 ```
 
 * 以windows服务启动
 
    1、 安装node-windows
    
        $ npm install -g node-windows
        
        $ npm link node-windows
    2、 安装tcp、api、hls顺序执行
        
        $ node TcpWinService.js
        
        $ node ApiWinService.js
        
        $ node HlsWinService.js
   
## 运行测试

使用http测试工具请求``http://{apiHost}:{apiPort}/api/video/getUrl`

该请求连接为post请求，必须带code参数且code作为post参数，code是摄像头的唯一标识

当返回如下数据(url连接为测试数据):

```json
    {
        "data": {
            "url": "http://127.0.0.1:10860/public/videos/10004/20191016162246/38222c.m3u8"
        },
        "code": 1000,
        "msg": "successed"
    }
```

表示成功，其他返回表示失败。

## 说明

    * 要求系统配置比较高，转码本身就需要高配置的服务器。在我的测试下：最快3秒接口返回数据（播放文件生成），平均11秒左右
    
    * 当前版本需要优化，目前是请求转码才创建FFmpeg进程，我能想到的是：预先生成进程，在需要的时候使用它，也就是做成FFmpeg进程池

## 思维导向

    * 项目整体要求
    
        该项目的核心就是将摄像头的rtsp流转成hls，并返回一个可播放的地址。
        
    * 各服务作用
   
        1. apiServer
            用于客户端请求接口，并返回播放地址
          
        2. tcpServer
            用于操作解码器解码，并自动治理ffmpe进程和播放文件
            
        3. hlsServer
            是一个http服务，仅支持hls协议相关的资源，请求任何其它资源都是404；该服务还有个作用就是监听客户端浏览视频文件的时间
       
## 升级
    尽快做出进程池方式     
## wiki
    ....
