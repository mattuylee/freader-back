const fs = require('fs')
const path = require('path')
const logger = require('../log/index').logger

//全局配置
const defaultGlobalConfig = {
    //根路由
    "baseRoute": "/",
    //监听端口
    "port": 3280,
    //数据库配置
    "database": {
        //连接字符串
        "url": "mongodb://localhost:27017",
        //使用的数据库名称
        "name": "freader"
    }
}

try {
    let data = fs.readFileSync(path.resolve(__dirname, '..', 'config.json'))
    let config = JSON.parse(data.toString())
    if (config) { defaultGlobalConfig = { ...defaultGlobalConfig, ...config } }
}
catch {
    logger.warn('Failed to load config file, and the default config is used.')
}

module.exports = defaultGlobalConfig