// Node.js 所有的异步 I/O 操作在完成时都会发送一个事件到事件队列。

// Node.js 里面的许多对象都会分发事件：一个 net.Server 对象会在每次有新连接时触发一个事件， 一个 fs.readStream 对象会在文件被打开的时候触发一个事件。 所有这些产生事件的对象都是 events.EventEmitter 的实例。

// addListener(event, listener)
// 为指定事件添加一个监听器到监听器数组的尾部。
// 2	on(event, listener)
// 为指定事件注册一个监听器，接受一个字符串 event 和一个回调函数。
// server.on('connection', function (stream) {
//   console.log('someone connected!');
// });
// 3	once(event, listener)
// 为指定事件注册一个单次监听器，即 监听器最多只会触发一次，触发后立刻解除该监听器。
// server.once('connection', function (stream) {
//   console.log('Ah, we have our first user!');
// });
// 4	removeListener(event, listener)
// 移除指定事件的某个监听器，监听器必须是该事件已经注册过的监听器。

// 它接受两个参数，第一个是事件名称，第二个是回调函数名称。

// var callback = function(stream) {
//   console.log('someone connected!');
// };
// server.on('connection', callback);
// // ...
// server.removeListener('connection', callback);
// 5	removeAllListeners([event])
// 移除所有事件的所有监听器， 如果指定事件，则移除指定事件的所有监听器。
// 6	setMaxListeners(n)
// 默认情况下， EventEmitters 如果你添加的监听器超过 10 个就会输出警告信息。 setMaxListeners 函数用于提高监听器的默认限制的数量。
// 7	listeners(event)
// 返回指定事件的监听器数组。
// 8	emit(event, [arg1], [arg2], [...])
// 按监听器的顺序执行执行每个监听器，如果事件有注册监听返回 true，否则返回 false。

const events = require('events');
const eventEmitter = new events.EventEmitter();

// 监听器 #1
var listener1 = function listener1() {
    console.log('监听器 listener1 执行。');
 }
 
 // 监听器 #2
 var listener2 = function listener2() {
   console.log('监听器 listener2 执行。');
 }
 
 // 绑定 connection 事件，处理函数为 listener1 
 eventEmitter.addListener('connection', listener1);
 
 // 绑定 connection 事件，处理函数为 listener2
 eventEmitter.on('connection', listener2);
 
 var eventListeners = eventEmitter.listenerCount('connection');
 console.log(eventListeners + " 个监听器监听连接事件。");
 
 // 处理 connection 事件 
 eventEmitter.emit('connection');
 
 // 移除监绑定的 listener1 函数
 eventEmitter.removeListener('connection', listener1);
 console.log("listener1 不再受监听。");
 
 // 触发连接事件
 eventEmitter.emit('connection');
 
 eventListeners = eventEmitter.listenerCount('connection');
 console.log(eventListeners + " 个监听器监听连接事件。");
 
 console.log("程序执行完毕。");