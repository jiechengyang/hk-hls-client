<template>
    <f7-page>
        <f7-navbar :back-link="$t('app.back')"></f7-navbar>
        <f7-block>
            <ul>
                <li class="listItem" v-for="item in listData" :key="item.id" v-on:click="itemFun(item)">
                    <div class="flexbox flexAlCenter">
                        <div class="itemicon"><img :src="videoimg" alt=""></div>
                        <div class="itemCon">{{item.name}}</div>
                    </div>
                </li>
            </ul>
        </f7-block>
        <f7-popup :opened="videoshow" @popup:closed="videoshow = false">
            <f7-navbar title="">
                <f7-nav-right>
                    <f7-link popup-close @click="closeVideo">关闭</f7-link>
                </f7-nav-right>
            </f7-navbar>
            <f7-page>
                <div id="myVideo">
                    <video id="my-video" class="video-js vjs-default-skin vjs-big-play-centered" data-setup="{}"
                           x5-video-player-type="h5" preload="auto" x5-playsinline="true" x-webkit-airplay="true"
                           webkit-playsinline="true" playsinline="true">
                        <source type="application/x-mpegURL">
                    </video>
                </div>
                <div class="detailItem">
                    <div class="detailCon">
                        <ul class="detailConList">
                            <li class="detailConItem flexbox">
                                <div class="itemLeftDetail">制种地点：</div>
                                <div class="itemRightDetail">{{itemDetail.base_name}}：</div>
                            </li>
                            <li class="detailConItem flexbox" v-for="(item,index) in itemDetail.environment_data"
                                :key="index">
                                <div class="itemLeftDetail">{{item[0]}}：</div>
                                <div class="itemRightDetail">{{item[1]}}<span>{{item[2]}}</span></div>
                            </li>
                        </ul>
                    </div>
                </div>
                <f7-fab position="center-center" @click="closePtz" slot="fixed" color="green"
                        v-show="itemDetail.cameraType == 0">
                    <f7-icon ios="f7:more_round" aurora="f7:more_round" md="material:more_round"></f7-icon>
                    <f7-icon ios="f7:close" aurora="f7:close" md="material:close"></f7-icon>
                    <f7-fab-buttons position="center">
                        <f7-fab-button @click="ptz('up')">
                            <f7-icon f7="arrow_up"></f7-icon>
                        </f7-fab-button>
                        <f7-fab-button @click="ptz('right')">
                            <f7-icon f7="arrow_right"></f7-icon>
                        </f7-fab-button>
                        <f7-fab-button @click="ptz('down')">
                            <f7-icon f7="arrow_down"></f7-icon>
                        </f7-fab-button>
                        <f7-fab-button @click="ptz('left')">
                            <f7-icon f7="arrow_left"></f7-icon>
                        </f7-fab-button>
                    </f7-fab-buttons>
                </f7-fab>
            </f7-page>
        </f7-popup>
    </f7-page>
</template>
<script>
    import canlcimg from '../../assets/images/back.png'
    import videoimg from '../../assets/images/video.png'
    import {baseConfig} from '@/utils/baseConfig'
    import {isNull, inArray} from '@/utils/appFunc'
    import apiMethods from '@/utils/http'
    import 'video.js/dist/video-js.css'
    //import 'vue-video-player/src/custom-theme.css'
    import videojs from 'video.js'

    window.videojs = videojs
    // hls plugin for videojs6
    require('videojs-contrib-hls/dist/videojs-contrib-hls.js')
    var calcComponent = videojs.getComponent('Component');
    var CalcBar = videojs.extend(calcComponent, {
        constructor: function (player, options) {
            calcComponent.apply(this, arguments);
            if (options.text) {
                this.updateTextContent(options.text);
            }
        },
        createEl: function () {
            var divObj = videojs.dom.createEl('div', {
                // Prefixing classes of elements within a player with "vjs-"
                // is a convention used in Video.js.
                //给元素加vjs-开头的样式名，是videojs内置样式约定俗成的做法
                className: 'vjs-calc-bar'
            });
            var imgObj = videojs.dom.createEl('img', {
                // Prefixing classes of elements within a player with "vjs-"
                // is a convention used in Video.js.
                //给元素加vjs-开头的样式名，是videojs内置样式约定俗成的做法
                src: canlcimg
            });
            videojs.dom.appendContent(imgObj, this.options_.text)
            divObj.appendChild(imgObj);

            return divObj
        },
        updateTextContent: function (text) {
            // If no text was provided, default to "Text Unknown"
            // 如果options中没有提供text属性，默认显示Text Unknow
            if (typeof text !== 'string') {
                text = '';
            }
            // Use Video.js utility DOM methods to manipulate the content
            // of the component's element.
            // 使用Video.js提供的DOM方法来操作组件元素
            videojs.dom.emptyEl(this.el());
            videojs.dom.appendContent(this.el(), text);
        }
    })
    videojs.registerComponent('CalcBar', CalcBar);
    export default {
        name: 'fielddata',
        props: ["pdfurl"],
        data() {
            return {
                isInit: false,
                videoimg: videoimg,
                myPlayer: '',
                payering: true,
                videoshow: false,
                player: Function,
                events: ['fullscreenchange', 'click'],
                listData: [],
                itemDetail: {environment_data: []},
                setTimerBackBottom: '',
                setTimerBackBottomCount: '',
                isVideoBreak: '',
                ctrling: false,
                currentCmd: '',
                stopingCmd: false,
                cmdToast: null
            }
        },
        mounted() {
            videojs.addLanguage('zh-CN', {
                'You aborted the media playback': '视频播放被终止',
                'A network error caused the media download to fail part-way.': '网络错误导致视频下载中途失败。',
                'The media could not be loaded, either because the server or network failed or because the format is not supported.': '视频因格式不支持或者服务器或网络的问题无法加载。',
                'The media playback was aborted due to a corruption problem or because the media used features your browser did not support.': '由于视频文件损坏或是该视频使用了你的浏览器不支持的功能，播放终止。',
                'No compatible source was found for this media.': '无法找到此视频兼容的源。'
            })
            document.removeEventListener('backbutton', this.backButtonFun.bind(this), false)
            document.addEventListener('backbutton', this.backButtonFun.bind(this), false)
        },
        created() {
            this.getVideoList();
        },
        methods: {
            itemFun(item) {
                // debugger
                this.getVideoDetail(item.id);
                this.videoshow = true
                //this.myPlayer.dispose();
                //this.$refs.myVideo
                if (this.myPlayer.dispose) {
                    try {
                        clearInterval(this.isVideoBreak)
                        this.myPlayer.dispose();
                    } catch (e) {

                    }

                    document.getElementById('myVideo').innerHTML = '<video id="my-video" class="video-js vjs-default-skin vjs-big-play-centered" data-setup="{}" x5-video-player-type="h5" preload="auto" x5-playsinline="true" x-webkit-airplay="true" webkit-playsinline="true" playsinline="true">' +
                        '            <source type="application/x-mpegURL">' +
                        '          </video>'
                }
                // var newUrl = 'http://cyberplayerplay.kaywang.cn/cyberplayer/demo201711-L1.m3u8'
            },
            playVideo() {
                if (!this.itemDetail.live_url) {
                    return false
                }
                this.videoCon(this.itemDetail.live_url)
                this.myPlayer.src(this.itemDetail.live_url)
                this.myPlayer.load()
                this.myPlayer.play()
            },
            videoCon(newUrl) {
                const _vm = this;
                this.myPlayer = videojs('my-video', {
                    bigPlayButton: true, // 是否显示播放按钮（这个播放按钮默认会再左上方，需用CSS设置居中）
                    textTrackDisplay: true,
                    posterImage: true,
                    errorDisplay: true,
                    controlBar: true,
                    fullTimeout: '',
                    sources: [{
                        type: 'application/x-mpegURL',
                        src: newUrl,
                    }],
                    autoplay: true, // 这个说是自动播放，但是本人使用无效
                    controls: {
                        timeDivider: true,
                        durationDisplay: true,
                        remainingTimeDisplay: false,
                        muteToggle: false, //静音按钮
                        fullscreenToggle: false, //全屏按钮
                        volumeMenuButton: false
                    },
                    playbackRates: [0.7, 1.0, 1.5, 2.0], //播放速度
                    loop: false, // 导致视频一结束就重新开始。
                    preload: 'auto', // 建议浏览器在<video>加载元素后是否应该开始下载视频数据。auto浏览器选择最佳行为,立即开始加载视频（如果浏览器支持）
                    aspectRatio: '16:9', // 将播放器置于流畅模式，并在计算播放器的动态大小时使用该值。值应该代表一个比例 - 用冒号分隔的两个数字（例如"16:9"或"4:3"）
                    fluid: false, // 当true时，Video.js player将拥有流体大小。换句话说，它将按比例缩放以适应其容器。
                    width: document.documentElement.clientWidth,
                    height: document.documentElement.clientHeight,
                    notSupportedMessage: '此视频暂无法播放，请稍后再试' // 允许覆盖Video.js无法播放媒体源时显示的默认信息。
                }, function () {
                    this.play()
                    document.getElementsByClassName('vjs-calc-bar')[0].style.display = 'none'
                    var fullscreenDom = document.getElementsByClassName('vjs-fullscreen-control')[0];
                    fullscreenDom.parentNode.removeChild(fullscreenDom);
                    var controlDom = document.getElementsByClassName('vjs-control-bar')[0];
                    var fullscrrendiv = document.createElement("div");
                    fullscrrendiv.className = 'vjs-control vjs-button'
                    fullscrrendiv.id = 'myFullScreen'
                    fullscrrendiv.innerHTML = '<span class="screenTool"></span>';
                    controlDom.appendChild(fullscrrendiv)
                    var myPlay = this;
                    fullscrrendiv.onclick = function (e) {
                        // debugger
                        if (e && e.stopPropagation)
                        // 因此它支持W3C的stopPropagation()方法
                            e.stopPropagation();
                        else
                        // 否则，我们需要使用IE的方式来取消事件冒泡
                            window.event.cancelBubble = true;
                        // debugger
                        let childNode = fullscrrendiv.childNodes[0]
                        if (childNode.getAttribute('class')) {
                            if (childNode.className.indexOf('xiaoscreen') > -1) {
                                //childNode.classList.remove('xiaoscreen')
                                //document.getElementById('my-video').classList.remove('rotate90')
                                //myPlay.width(document.documentElement.clientWidth);
                                //myPlay.height(document.documentElement.clientHeight);
                                myPlay.exitFullscreen()
                            } else {
                                //document.getElementById('my-video').classList.add('rotate90')
                                myPlay.width('200px');
                                myPlay.height('200px');
                                var userAgentInfo = navigator.userAgent
                                if (userAgentInfo.includes('Android')) {
                                    if (window.orientation == 90 || window.orientation == -90) {
                                        //ipad、iphone竖屏andriod横屏

                                        // debugger
                                    } else if (window.orientation == 0 || window.orientation == 180) {
                                        //ipad、iphone横屏andriod竖屏
                                        // debugger
                                    }
                                } else if (userAgentInfo.includes('iPhone')) {
                                    if (window.orientation == 90 || window.orientation == -90) {
                                        //ipad、iphone竖屏andriod横屏
                                        // debugger
                                    } else if (window.orientation == 0 || window.orientation == 180) {
                                        //ipad、iphone横屏andriod竖屏
                                        // debugger
                                    }
                                }

                                myPlay.requestFullscreen();
                                //childNode.classList.add('xiaoscreen')
                            }
                        }
                    }
                })
                this.myPlayer.addChild('CalcBar', {text: ''});

                document.getElementsByClassName('vjs-calc-bar')[0].onclick = function (e) {
                    // debugger
                    if (e && e.stopPropagation)
                    // 因此它支持W3C的stopPropagation()方法
                        e.stopPropagation();
                    else
                    // 否则，我们需要使用IE的方式来取消事件冒泡
                        window.event.cancelBubble = true;
                    if (_vm.myPlayer.isFullscreen()) {
                        document.getElementsByClassName('vjs-calc-bar')[0].style.display = 'none'
                        document.getElementById('myVideo').style.height = ''
                        _vm.myPlayer.exitFullscreen();
                    }
                    // _vm.myPlayer.requestFullscreen()
                }
                this.myPlayer.on('ended', function () {
                    this.pause();
                })
                this.myPlayer.on('fullscreenchange', function () {
                    // debugger
                    clearTimeout(_vm.fullTimeout);
                    _vm.fullTimeout = setTimeout(() => {
                        //_vm.$f7.dialog.alert( ''+_vm.myPlayer.isFullscreen()+ '')
                        var isFull = _vm.myPlayer.isFullscreen()
                        let screenDom = document.getElementById('myFullScreen').childNodes[0];
                        if (isFull) {
                            screenDom.classList.add('xiaoscreen')
                            document.getElementsByClassName('vjs-calc-bar')[0].style.display = ''
                            const screen_h = document.documentElement.clientHeight;
                            document.getElementById('myVideo').style.height = 100 + '%'
                        } else {
                            screenDom.classList.remove('xiaoscreen')
                            document.getElementsByClassName('vjs-calc-bar')[0].style.display = 'none'
                            document.getElementById('myVideo').style.height = ''
                        }
                    }, 1000)
                    //this.play()
                })
                // 资源长度改变
                this.myPlayer.on('durationchange', function (e) {
                    window.console.log('videoJS: durationchange//资源长度改变');
                });
                // 资源长度改变
                this.myPlayer.on('ended', function (e) {
                    window.console.log('videoJS: ended');
                });
                // 获取媒体数据过程中出错
                this.myPlayer.on('error', function (e) {
                    // debugger
                    this.pause()
                    try {
                        // this.dispose()
                    } catch (e) {
                        this.pause()
                    }
                    // this.load()
                    // this.play()
                    window.console.log('videoJS: error');
                });
                //
                this.myPlayer.on('firstplay', function (e) {
                    window.console.log('videoJS: firstplay');
                });

                this.myPlayer.on('loadedalldata', function (e) {
                    window.console.log('videoJS: loadedalldata');
                });
                // 浏览器已加载完毕当前播放位置的媒体数据，准备播放
                this.myPlayer.on('loadeddata', function (e) {
                    window.console.log('videoJS: loadeddata');
                });

                //浏览器获取完毕媒体的时间及字节数
                this.myPlayer.on('loadedmetadata', function (e) {
                    //加载到元数据后开始播放视频
                    // debugger
                    _vm.startVideo(_vm);
                    window.console.log('videoJS: loadedmetadata');
                });
                this.myPlayer.on('loadstart', function (e) {
                    window.console.log('videoJS: loadstart');
                });
                this.myPlayer.on('pause', function (e) {
                    window.console.log('videoJS: pause');
                });
                this.myPlayer.on('play', function (e) {
                    window.console.log('videoJS: play (adState: ');
                });
                this.myPlayer.on('seeked', function (e) {
                    window.console.log('videoJS: seeked');
                });
                this.myPlayer.on('seeking', function (e) {
                    if (!_vm.myPlayer.paused()) {

                    }
                    window.console.log('videoJS: seeking');
                });
                this.myPlayer.on('waiting', function (e) {
                    window.console.log('videoJS: waiting');
                });

                this.myPlayer.on('contentplayback', function (e) {
                    window.console.log('videoJS: contentplayback');
                });

                this.myPlayer.on('ima3error', function (e) {
                    window.console.log('videoJS/IMA3: ima3error');
                });
                this.myPlayer.on('ima3-ad-error', function (e) {
                    window.console.log('videoJS/IMA3: ima3-ad-error');
                });
                this.myPlayer.on('ima3-ready', function (e) {
                    window.console.log('videoJS/IMA3: ima3-ready');
                });

                this.myPlayer.on('ads-request', function (e) {
                    window.console.log('videoJS/Ads: ads-request');
                });
                this.myPlayer.on('click', function (e) {
                    // debugger
                    if (_vm.myPlayer.paused()) {
                        _vm.myPlayer.play()
                    } else {
                        _vm.myPlayer.pause()
                        // _vm.myPlayer.preload()
                    }
                    console.log('videoJS/Ads: ads-request');
                });
            },
            startVideo(that) {
                try {
                    that.myPlayer.play();
                    var lastTime = -1,
                        tryTimes = 0;
                    clearInterval(that.isVideoBreak);
                    that.isVideoBreak = setInterval(function () {
                        var currentTime = that.myPlayer.currentTime() ? that.myPlayer.currentTime() : 0;
                        console.log('currentTime' + currentTime + 'lastTime' + lastTime);
                        if (currentTime == lastTime) {
                            //此时视频已卡主3s
                            //设置当前播放时间为超时时间，此时videojs会在play()后把currentTime设置为0
                            if (!that.myPlayer.paused()) {
                                that.myPlayer.play();
                                that.myPlayer.currentTime(currentTime + 10000);
                            } else {
                                //that.myPlayer.currentTime(currentTime);
                            }
                            //尝试5次播放后，如仍未播放成功提示刷新
                            if (++tryTimes > 5) {
                                // alert('您的网速有点慢，刷新下试试');
                                that.myPlayer.paused()
                                // that.myPlayer.load()
                                // that.myPlayer.play();
                                tryTimes = 0;
                            }
                        } else {
                            lastTime = currentTime;
                            // tryTimes = 0;
                        }
                    }, 3000);
                } catch (e) {
                    // statements
                    console.log(e);
                }
            },
            closeVideo() {
                // debugger
                // this.myPlayer.pause();
                clearInterval(this.isVideoBreak)
                this.closePtz()
                this.cmdToast.close()
                this.myPlayer.dispose();
            },
            backButtonFun() {
                clearTimeout(this.setTimerBackBottom)
                this.setTimerBackBottom = setTimeout(() => {
                    this.setTimerBackBottomCount = 0
                }, 500)
                this.videoshow = false
                if (this.setTimerBackBottomCount == 0) {
                    this.setTimerBackBottomCount++
                    if (this.myPlayer.isFullscreen) {
                        this.myPlayer.exitFullscreen();
                    }
                } else {
                    this.exitBttonFun()
                }
            },
            exitBttonFun() {
                navigator.app.exitApp()
            },
            getVideoList() {
                this.$f7.preloader.show()
                const http = apiMethods.methods;
                const api = baseConfig.api;
                const _vm = this;
                http.apiGet(api.getVideoList).then((res) => {
                    _vm.listData = res.data;
                    _vm.$f7.preloader.hide()
                    _vm.$$('#homeView .infinite-scroll-preloader').addClass('hide')
                }).catch(res => {
                    _vm.$f7.preloader.hide()
                    _vm.$$('#homeView .infinite-scroll-preloader').addClass('hide')
                })
            },
            getVideoDetail(id) {
                this.$f7.preloader.show()
                const http = apiMethods.methods;
                const api = baseConfig.api;
                const _vm = this;
                http.apiGet(api.getVideoItemDetail, {params: {id: id}}).then((res) => {
                    _vm.itemDetail = res.data;
                    _vm.$f7.preloader.hide()
                    _vm.$$('#homeView .infinite-scroll-preloader').addClass('hide')
                    _vm.playVideo()
                }).catch(res => {
                    _vm.$f7.preloader.hide()
                    _vm.$$('#homeView .infinite-scroll-preloader').addClass('hide')
                })
            },
            ptz(command) {
                var cmds = ['up', 'right', 'left', 'down']
                let that = this
                if (!inArray(command, cmds)) {
                    return false
                }

                if (this.ctrling) {
                    return false
                }

                // this.currentCmd = command
                this.ctrling = true
                const http = apiMethods.methods
                const api = baseConfig.api
                http.apiPost(api.videoPtz + '?id=' + this.itemDetail.id, {
                    command: '0,' + command
                }).then((res) => {
                    if (res.code === 90010) {
                        that.cmdToast = that.$f7.toast.create({
                            text: '操作指令已发送成功',
                            position: 'bottom',
                            closeTimeout: 2000
                        }).open()
                        that.ctrling = false
                        that.currentCmd = command
                    } else
                        setTimeout(function () {
                            that.ctrling = false
                        }, 10 * 1000)
                }).catch((error) => {
                    setTimeout(function () {
                        that.ctrling = false
                    }, 10 * 1000)
                })
            },
            closePtz() {
                let that = this
                if (this.currentCmd && !this.stopingCmd) {
                    this.stopingCmd = true
                    const http = apiMethods.methods
                    const api = baseConfig.api
                    http.apiPost(api.videoPtz + '?id=' + this.itemDetail.id, {
                        command: '1,' + this.currentCmd
                    }).then((res) => {
                        if (res.code === 90010) {
                            that.cmdToast = that.$f7.toast.create({
                                text: '关闭指令已发送成功',
                                position: 'bottom',
                                closeTimeout: 2000
                            }).open()
                            that.stopingCmd = false
                        } else
                            setTimeout(function () {
                                that.stopingCmd = false
                            }, 10 * 1000)
                    }).catch((error) => {
                        setTimeout(function () {
                            that.stopingCmd = false
                        }, 10 * 1000)
                    })
                }
            }
        },
        destroyed() {
            clearInterval(this.isVideoBreak)
            try {
                this.myPlayer.dispose()
            } catch (e) {
                this.myPlayer.pause()
            }
        }
    }

</script>
<style lang="less">
    #myVideo #my-video.rotate90 {
        filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=1) !important;;
        -moz-transform: rotate(90deg) !important;
        -o-transform: rotate(90deg) !important;;
        -webkit-transform: rotate(90deg) !important;;
        transform: rotate(90deg) !important;;
    }

    .screenTool {
        font-family: VideoJS;
        font-weight: normal;
        font-style: normal;

        &:before {
            content: "\F108";
            font-size: 1.8em;
            line-height: 1.67;
            text-align: center;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
    }

    .screenTool.xiaoscreen {
        &:before {
            content: "\F109";
        }
    }

    .vjs-has-started.vjs-user-inactive.vjs-playing .vjs-control-bar {
        opacity: 1;
    }

    #my-video:-webkit-full-screen {
        width: 100% !important;
        height: 100% !important;
        z-index: 111000;
    }

    #my-video:-moz-full-screen {
        width: 100% !important;
        height: 100% !important;
        z-index: 111000;
    }

    #my-video:-ms-full-screen {
        width: 100% !important;
        height: 100% !important;
        z-index: 111000;
    }

    #my-video:-o-full-screen {
        width: 100% !important;
        height: 100% !important;
        z-index: 111000;
    }

    #my-video:full-screen {
        width: 100% !important;
        height: 100% !important;
        z-index: 111000;
    }

    .video-js .vjs-big-play-button {
        font-size: 2.5em;
        line-height: 2.3em;
        height: 2.5em;
        width: 2.5em;
        -webkit-border-radius: 2.5em;
        -moz-border-radius: 2.5em;
        border-radius: 2.5em;
        background-color: #73859f;
        background-color: rgba(115, 133, 159, .5);
        border-width: 0.15em;
        margin-top: -1.25em;
        margin-left: -1.75em;
    }

    /* 加载圆圈 */
    .vjs-loading-spinner {
        font-size: 2.5em;
        width: 2em;
        height: 2em;
        border-radius: 1em;
        margin-top: -1em;
        margin-left: -1.5em;
    }

    .vjs-paused .vjs-big-play-button,
    .vjs-paused.vjs-has-started .vjs-big-play-button {
        display: block;
    }

    .video-js .vjs-big-play-button {
    }

    .vjs-calc-bar {
        width: 40px;
        height: 40px;
        display: flex;
        color: white;
        background-color: rgba(0, 0, 0, 0.5);
        position: absolute;
        top: 0;
        left: 0;
        font-size: 16px;
        line-height: 40px;

        img {
            margin: auto;
            width: 10px;
            height: 20px;
        }
    }

    .ios .issues-page .page-content.ptr-content {
        padding-top: 88px !important;
    }

    .clearFix {
        zoom: 1;
    }

    .clearFix:after {
        display: block;
        overflow: hidden;
        clear: both;
        content: '';
        line-height: 0;
        height: 0;
    }

    .fl {
        float: left;
    }

    .fr {
        float: right;
    }

    /* .videoTool{
        position: absolute;
        bottom: 0;
        left: 0;
        z-index: 1;
        background-color: rgba(0,0,0,0.5);
        color: white;
        width: 100%;
        .listVideoList{
          width: 40px;
          text-align: center;
          line-height: 26px;
        }
      }*/
    .detailItem {
        .detailCon {
            margin: 10px;

            .detailConList {
                padding: 10px;

                .detailConItem {
                    font-size: 16px;
                    line-height: 2em;
                    border-bottom: 1px solid #efefef;

                    .itemLeftDetail {
                        width: 100px;
                        -ms-text-overflow: ellipsis;
                        text-overflow: ellipsis;
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .itemRightDetail {
                        width: calc(100% - 120px);
                        margin: 0 10px;
                        -ms-text-overflow: ellipsis;
                        text-overflow: ellipsis;
                        overflow: hidden;
                        white-space: nowrap;

                        span {
                            color: red;
                            padding: 2px;
                        }
                    }
                }
            }
        }
    }

    .flexbox {
        display: -moz-box;
        /* Firefox */
        display: -ms-flexbox;
        /* IE10 */
        display: -webkit-box;
        /* Safari */
        display: -webkit-flex;
        /* Chrome, WebKit */
        display: box;
        display: flexbox;
        display: flex;
    }

    .flexJusCenter {
        -webkit-justify-content: center;
        justify-content: center;
        -moz-box-pack: center;
        -webkit--moz-box-pack: center;
        box-pack: center;
    }

    .flexAlCenter {
        align-items: center;
        -webkit-align-items: center;
        box-align: center;
        -moz-box-align: center;
        -webkit-box-align: center;
    }

    ul,
    li {
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .listItem {
        border-bottom: 1px solid #e4e4e4;
    }

    .itemicon {
        width: 32px;

        img {
            position: relative;
            top: 2px;
        }
    }

    .itemCon {
        width: calc(100% - 42px);
        white-space: nowrap;
        overflow: hidden;
        -ms-text-overflow: ellipsis;
        -webkit-text-overflow: ellipsis;
        text-overflow: ellipsis;
        margin-left: 10px;
    }

</style>
