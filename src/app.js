require('crypto') //确保支持crypto模块
const express = require('express')
const path = require('path')
const logger = require('./log/index')
const cron = require('./service/cron').cron

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
    //启用/禁用定时任务 
    if (globalConfig.cron.enabled) { cron.enable() }
    //开始监听端口
    return new Promise((resolve) => {
        app.listen(globalConfig.port, () => {
            logger.logger.info(`application is listening on port ${globalConfig.port}!`)
            resolve()
        })
    })
}
