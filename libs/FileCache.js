const fs = require('fs');
const Utils = require('./Utils');

class FileCache {
    constructor(dir, ext) {
        this.dir = dir;
        ext = ext || '.cache';
        this.ext = ext;
        Utils.mkDirs(this.dir, () => {

        });
    }

    static getSingleton(dir, ext) {
        let singleton;
        if (!singleton) {
            singleton = new FileCache(dir, ext);
        }
        return singleton;
    }

    /**
     * key
     * value
     * fs.write
     * fd, 使用fs.open打开成功后返回的文件描述符
     * buffer, 一个Buffer对象，v8引擎分配的一段内存
     * offset, 整数，从缓存区中读取时的初始位置，以字节为单位
     * length, 整数，从缓存区中读取数据的字节数
     * position, 整数，写入文件初始位置；
     * callback(err, written, buffer), 写入操作执行完成后回调函数，written实际写入字节数，buffer被读取的缓存区对象
     */
    set(key, value) {
        const filename = this.dir + '/' + key + this.ext;
        fs.open(filename, 'wx', (err, fd) => {
            if (err) {
                if (err.code === 'EEXIST') {
                    console.error('file exits');
                    return;
                }

                throw err;
            }

            const buffer = Buffer.alloc(Buffer.byteLength(value), value);
            fs.write(fd, buffer, null, null, null, function (err, written, buffer) {
                if (err) {
                    console.log('写入文件失败');
                    console.error(err);
                    return false;
                } else {
                    fs.close(fd, () => {
                        console.log('close the cache file')
                    })
                }
            });
        });

    }

    get(key) {
        const filename = this.dir + '/' + key + this.ext;
        if (Utils.fsExistsSync(fs, filename)) {
            return fs.readFileSync(filename).toString();
        }

        return null;
    }

    del(key) {
        const filename = this.dir + '/' + key + this.ext;
        if (Utils.fsExistsSync(fs, filename)) {
            fs.unlinkSync(filename);
        } else {
            console.error('file not exits');
        }

    }
}

module.exports = FileCache