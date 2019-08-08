const assert = require('assert')
const superAgent = require('superagent')

const logger = require('../../bin/log').logger
const testConfig = require('../test-config')

var token
const baseUrl = testConfig.host + ':' + testConfig.port + '/user'

module.exports.runTest = () => {
    logger.trace('【测试】用户模块...')
    
    //测试用户模块相关功能
    logger.trace('【测试】用户登录...')
    return superAgent.post(baseUrl + '/login').type('form').send({
        usr: testConfig.user,
        pwd: testConfig.password
    }).then((res) => {
        assertResult(res)
        token = res.token
        logger.info('【测试】登录，成功')
    }).then(() => {
        //获取用户配置
        logger.trace('【测试】获取用户配置...')
        superAgent.get(baseUrl + '/config').set('token', token)
    }).then((res) => {
        assertResult(res)
        logger.info('【测试】获取用户配置，成功')
    })
}

//结果断言
function assertResult(res) {
    assert.strictEqual(res.statusCode, 200)
    assert.strictEqual(res.body.error, undefined)
}