const fs = require('fs')
const path = require('path')

const logger = require('../log').logger

//全局配置

globalConfig = {
    baseRoute: "/",
    port: 3280
}

try {
    let data = fs.readFileSync(path.resolve('..', 'config.json'))
    let config = data.toJSON()
    if (config) { globalConfig = { ...globalConfig, ...config } }
}
catch {
    logger.warn('Failed to load config file, and the default config is used.')
}

module.exports = globalConfig