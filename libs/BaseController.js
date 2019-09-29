// TODO: OR export class BaseController {...}
const Utils = require('./Utils');
const url = require('url');
const querystring = require('querystring');
module.exports = class BaseController {
    constructor(request, response, router, tcpClient) {
        this.request = request;
        this.response = response;
        this.router = router;
        this.tcpClient = tcpClient;
        this.actionHandler = null;
        BaseController.log('remoteAddress:%s,remotePort:%s', this.getClientIp(), this.request.connection.remotePort)
        this.setUrlParse(this.request.url);
        this.setRoute();
    }

    getUrlParse() {
        return this.urlParse;
    }

    setUrlParse(urlStr) {
        this.urlParse = url.parse(urlStr);
    }

    setRoute() {
        this.route = this.getUrlParse().pathname;// pathname: '/api/get-live-url'
    }

    getRoute() {
        // const urlObj = new URL(this.getHost() + this.request.url);
        return this.route;// pathname: '/api/get-live-url'
    }

    getQueryParams() {
        return querystring.parse(this.getUrlParse().query);
    }

    getClientIp() {
        return this.request.headers['x-forwarded-for'] ||
            this.request.connection.remoteAddress ||
            this.request.socket.remoteAddress ||
            this.request.connection.socket.remoteAddress || '';
    }

    getHost() {
        if (!Utils.isNull(this.request.host)) {
            return this.request.host
        }

        if (!Utils.isNull(this.request.hostname)) {
            return this.request.hostname
        }

        if (!Utils.isNull(this.request.headers['host'])) {
            return this.request.headers['host'];
        }

        return '';

    }

    getPid() {
        //TODO: id is module id
        return this.module;
    }

    setPid(module) {
        this.pid = module;
    }

    getId() {
        //TODO: id is controller id
        return this.id;
    }

    setId(controllerId) {
        this.id = controllerId;
    }

    getAction() {
        return this.action;
    }

    setAction(action) {
        this.action = action;
    }

    getMethod() {
        return this.request.method.toLocaleUpperCase();
    }

    static log(msg) {
        console.log(msg)
    }

    test() {
        console.log(`状态码: ${this.response.statusCode}`);
        console.log(`响应头: ${JSON.stringify(this.response.getHeaders())}`);
    }

    setEncoding(encode) {
        // req.setEncoding('utf8');
        this.request.setEncoding(encode);
    }

    setResponseHeaders(headers) {
        if (!Utils.isNull(headers)) {
            for (let key in headers) {
                this.response.setHeader(key, headers[key]);
            }
        }
    }

    writeJson(data) {
        this.response.write(JSON.stringify(data));
    }

    endJSon(data, statusCode, contentType) {
        contentType = contentType || 'application/json';
        statusCode = statusCode || 200;
        this.response.writeHead(statusCode, {
            // 'Content-Length': Buffer.byteLength(data),
            'Content-Type': contentType //'text/plain'
        });
        return this.response.end(JSON.stringify(data));
    }

    createRouteInfo() {
        const pathArr = this.getRoute().split('/').filter((val) => {
            return val && val.trim();
        });
        const pathLen = pathArr.length;
        if (pathLen === 2) {
            this.setPid('/');
            this.setId(pathArr[0]);
            this.setAction(pathArr[1]);
        } else if (pathLen === 3) {
            this.setPid(pathArr[0]);
            this.setId(pathArr[1]);
            this.setAction(pathArr[2]);
        } else if (pathLen === 1) {
            this.setPid('/');
            this.setId(pathArr[0]);
            this.setAction('index');
        } else if (pathLen === 0) {
            this.setPid('/');
            this.setId('index');
            this.setAction('index');
        } else {
            console.error('route error');
            this.response.writeHead(404);
            this.response.end('route error');
        }
    }

    authAccess() {
        //TODO: 验证路由权限
        let flag = false;
        if (this.router) {
            for (let i = 0; i < this.router.length; i++) {
                const routes = this.router[i];
                if (this.getRoute() === '/' + routes.route && routes.verbs.indexOf(this.getMethod()) > -1) {
                    if (routes.hasOwnProperty('func')) this.actionHandler = routes.func;
                    flag = true;
                }
            }
        }

        return flag;
    }

    getRequestHeader(key, lower) {
        lower = lower || false;
        if (lower) key = key.toLocaleLowerCase();
        const value = this.request.headers[key];
        return Utils.isNull(value) ? null : value;
    }

    getResponseHeader(key) {
        const value = this.response.getHeader(key);
        return Utils.isNull(value) ? null : value;
    }

    getBody() {
        return this.body;
    }

    setBody(body) {
        this.body = body;
    }

    runAction() {
        if (typeof this.actionHandler === 'function') {
            let res = this.actionHandler(this);// this.request, this.response, this.getBody()
            if (typeof res === 'string') {
                this.response.write(res);
                return this.response.end();
            } else if (Utils.isNull(res)) {
                return this.endJSon({msg: 'not found', data: null, code: 10003}, 404);
            } else {
                return res;
            }

        } else {
            return this.endJSon({msg: 'not found', data: null, code: 10003}, 404);
        }

    }
};

