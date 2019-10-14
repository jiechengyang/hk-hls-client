const crypto = require('crypto');
// const fs = require('fs');
const Utils = {
    isNull(val) {
        if (val === '' || val === null || val === undefined || val === 'undefined' || val.length === 0)
            return true;
        return false;
    },
    stringToHex(str) {
        let val = "";
        for (let i = 0; i < str.length; i++) {
            if (val === '') {
                val = str.charCodeAt(i).toString(16);
            } else {
                val += '' + str.charCodeAt(i).toString(16);
            }
        }

        return val;
    },
    hexToString(str) {
        let val = '';
        let arr = str.split(",");
        for (let i = 0; i < arr.length; i++) {
            val += String.fromCharCode(parseInt(arr[i], 16));
        }

        return val;
    },
    trim(str) {
        return str.replace(/(^\s*)|(\s*$)/g, "");
    },
    rtrim(str) {
        return str.replace(/(\s*$)/g, "");
    },
    ltrim(str) {
        return str.replace(/(^\s*)/g, "");
    },
    writeUTF(str, isGetBytes) {
        let back = [];
        let byteSize = 0;
        for (let i = 0; i < str.length; i++) {
            let code = str.charCodeAt(i);
            if (0x00 <= code && code <= 0x7f) {
                byteSize += 1;
                back.push(code);
            } else if (0x80 <= code && code <= 0x7ff) {
                byteSize += 2;
                back.push((192 | (31 & (code >> 6))));
                back.push((128 | (63 & code)))
            } else if ((0x800 <= code && code <= 0xd7ff)
                || (0xe000 <= code && code <= 0xffff)) {
                byteSize += 3;
                back.push((224 | (15 & (code >> 12))));
                back.push((128 | (63 & (code >> 6))));
                back.push((128 | (63 & code)))
            }
        }
        for (let i = 0; i < back.length; i++) {
            back[i] &= 0xff;
        }
        if (isGetBytes) {
            return back
        }
        if (byteSize <= 0xff) {
            return [0, byteSize].concat(back);
        } else {
            return [byteSize >> 8, byteSize & 0xff].concat(back);
        }
    },
    readUTF(arr) {
        if (typeof arr === 'string') {
            return arr;
        }
        let UTF = '', _arr = arr;
        for (let i = 0; i < _arr.length; i++) {
            let one = _arr[i].toString(2),
                v = one.match(/^1+?(?=0)/);
            if (v && one.length === 8) {
                let bytesLength = v[0].length;
                let store = _arr[i].toString(2).slice(7 - bytesLength);
                for (let st = 1; st < bytesLength; st++) {
                    store += _arr[st + i].toString(2).slice(2)
                }
                UTF += String.fromCharCode(parseInt(store, 2));
                i += bytesLength - 1;
            } else {
                UTF += String.fromCharCode(_arr[i]);
            }
        }
        return UTF;
    },
    toUTF8Hex(str) {
        let charBuf = this.writeUTF(str, true);
        let re = '';
        for (let i = 0; i < charBuf.length; i++) {
            let x = (charBuf[i] & 0xFF).toString(16);
            if (x.length === 1) {
                x = '0' + x;
            }
            re += x;
        }
        return re;
    },
    utf8HexToStr(str) {
        let buf = [];
        for (let i = 0; i < str.length; i += 2) {
            buf.push(parseInt(str.substring(i, i + 2), 16));
        }
        return this.readUTF(buf);
    },
    delDir(fs, path) {
        let files = [];
        if (fs.existsSync(path)) {
            files = fs.readdirSync(path);
            files.forEach((file, index) => {
                let curPath = path + "/" + file;
                if (fs.statSync(curPath).isDirectory()) {
                    this.delDir(fs, curPath); //递归删除文件夹
                } else {
                    fs.unlinkSync(curPath); //删除文件
                }
            });
            fs.rmdirSync(path);
        }
    },
    fsExistsSync(fs, path) {
        try {
            fs.accessSync(path, fs.F_OK);
        } catch (e) {
            return false;
        }
        return true;
    },
    sendHex(socket, utf8Data) {
        socket.write(this.toUTF8Hex(utf8Data), 'hex');
    },
    genRandomString(length) {
        return crypto.randomBytes(Math.ceil(length / 2))
            .toString('hex')
            .slice(0, length);
    },
    sha512(str, salt) {
        let hash = crypto.createHmac('sha512', salt);
        /** Hashing algorithm sha512 */
        hash.update(str);
        let value = hash.digest('hex');
        return {
            salt: salt,
            strHash: value
        };
    },
    sha256(str, salt) {
        let hash = crypto.createHmac('sha256', salt);
        /** Hashing algorithm sha512 */
        hash.update(str);
        let value = hash.digest('hex');
        return {
            salt: salt,
            strHash: value
        };
    },
    saltHashStr(str, salt) {
        salt = salt || this.genRandomString(4);
        /** Gives us salt of length 16 */
        let data = this.sha256(str, salt);
        return data.strHash;
    },
    getTimestamp() {
        return new Date().getTime();
    },
    generateRTSPUrl(params) {
        return "rtsp://"
            + params['username'] + ":"
            + params['password'] + "@"
            + params.ip + "/"
            + (this.isNull(params.videoEncode) ? "h264" : params.videoEncode.toString()) + "/"
            + params.channel.toString() + "/"
            + params.streamType;
    }
};

module.exports = Utils;