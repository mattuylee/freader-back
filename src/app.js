const express = require('express')
const path = require('path')
const logger = require('./log/index')

var app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

module.exports.run = async function () {
    //配置日志级别
    logger.useDevelop()
    //加载全局配置
    const globalConfig = require('./util/global-config')
    //初始化数据库
    await require('./dao/index').init()
    //初始化路由
    app.use(globalConfig.baseRoute, require('./route/index'))
    //开始监听端口
    return new Promise((resolve) => {
        app.listen(globalConfig.port, () => {
            logger.logger.info(`application is listening on port ${globalConfig.port}!`)
            resolve()
        })
    })
}
