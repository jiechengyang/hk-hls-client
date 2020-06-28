process.on('message', function(m){
    console.log('message from parent: ' + JSON.stringify(m));
});

process.send({
    from: 'child',
    author: '程序猿小卡_casper',
    link: 'https://segmentfault.com/a/1190000007735211',
    source: 'SegmentFault 思否',
    remark: '著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。'
});


