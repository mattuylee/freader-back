const fs = require('fs')
const path = require('path')
const logger = require('../log/index').logger

//全局配置
var defaultGlobalConfig = {
    //根路由
    "baseRoute": "/",
    //监听端口
    "port": 3280,
    //日志模式
    "mode": 'develop',
    //数据库配置
    "database": {
        //连接字符串
        "url": "mongodb://localhost:27017",
        //使用的数据库名称
        "name": "freader"
    },
    //定时任务配置
    "cron": {
        "enabled": true,
        //最小更新周期，新于此时间的更新过数据将跳过检测。单位秒
        "minUpdatePeriod": 86400,
        //检测周期，每次自动任务执行的时间间隔（包含任务执行时间）。下一次任务执行总是在初始时间的n个最小检测周期之后。单位秒
        "checkPeriod": 86400,
        //任务初始时间。任务执行时间基于此时间
        "initialTime": "1998-07-05 03:00:00 GMT+0800"
    }
}

try {
    let config = require(path.resolve(__dirname, '..', 'config.json'))
    if (config) { defaultGlobalConfig = { ...defaultGlobalConfig, ...config } }
}
catch(e) {
    logger.warn('Failed to load config file, and the default config is used.')
}

module.exports = defaultGlobalConfig
