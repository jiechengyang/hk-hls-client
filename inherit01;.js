//nodejs 继承
//@link https://yijiebuyi.com/blog/ea4b2a30f73596a08ce85211626b68e5.html
var events=require('events');
var util=require('util');
 
function _base(){
    this.emitter=new events.EventEmitter(this);
};
 
util.inherits(_base,events.EventEmitter); //继承
 
_base.prototype.onEvent=function(eventName,callback){
    this.emitter.on(eventName,callback);
}
 
_base.prototype.emitEvent=function(eventName,arg){
    this.emitter.emit(eventName,arg);
}

console.log('_base:', _base);
