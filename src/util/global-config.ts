import fs = require('fs')
import path = require('path')
import { logger } from '../log/index'

//全局配置
var globalConfig = {
    //根路由
    baseRoute: "/",
    //监听端口
    port: 3280
}

try {
    let data = fs.readFileSync(path.resolve(__dirname, '..', 'config.json'))
    let config = JSON.parse(data.toString())
    if (config) { globalConfig = { ...globalConfig, ...config } }
}
catch {
    logger.warn('Failed to load config file, and the default config is used.')
}

module.exports = globalConfig