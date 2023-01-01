/* eslint-disable no-undef */
// 该文件用于存放一些常量

const { version }  = require('../package.json'); // 获取版本号
// 构建一个临时目录
const downLoadTempDirectory = `${process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME']}/.template`;
console.log(downLoadTempDirectory);
module.export = {
    version,
    downLoadTempDirectory
};