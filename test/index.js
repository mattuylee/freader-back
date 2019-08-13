const assert = require('assert')
const fs = require('fs')
const path = require('path')
const process = require('process')
const superAgent = require('superagent')
const logger = require('../bin/log').logger

const app = require('../bin/app')

var testConfig
var token

app.run().then(() => {
    logger.trace('---测试开始---')
    runTest().then(() => {
        logger.info('---测试通过---')
        process.exit(0)
    }).catch(e => {
        logger.error('---测试失败---')
        logger.error(e.message ? e.message : e)
        process.exit()
    })
})

/** 执行测试用例 */
async function runTest() {
    try {
        testConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, './test-config.json')).toString('utf-8'))
    } 
    catch {
        logger.fatal('Failed to run test: test config file not found.')
        return
    }
    let hostname = testConfig.host + ':' + testConfig.port + testConfig.basePath
    if (hostname.endsWith('/')) { hostname = hostname.slice(0, hostname.length - 1) }
    //执行登录，获取凭证
    await superAgent.post(hostname + '/user/login').type('form').send({
        uid: testConfig.user,
        pwd: testConfig.password
    }).then(async res => {
        assertResult(res)
        //执行测试用例
        await runTests(testConfig.testCases, hostname)
    })
    return
}
async function runTests(testcase, route = '') {
    if (!testcase || typeof testcase != 'object') { return }
    if (testcase.title) {
        logger.trace('【测试】' + testcase.title)
    }
    if (testcase.type == 'route') {
        if (!testcase.title) { testcase.title = '' }
        for (let method in testcase) {
            if (method == 'form') {
                logger.trace(`[POST-FORM]${route}`)
                assertResult(await superAgent.post(route).set('token', token).type('form').send(testcase.form))
                continue
            }
            else if (method != 'get' && method != 'post' && method != 'put' && method != 'delete') {
                continue
            }
            logger.trace(`[${method.toUpperCase()}]${route}`)
            let sendMethod
            if(method == 'get' || method == 'delete') {
                sendMethod = 'query'
            }
            else { sendMethod = 'send' }
            //发起请求，并对结果进行正常性断言
            assertResult(await superAgent[method](route).set('token', token)[sendMethod](testcase[method]))
        }
    } //路由级测试用例
    else if (testcase.type == 'module' || !testcase.type) {
        for (const key in testcase) { await runTests(testcase[key], route + key) }
        return
    } //模块级测试用例
}


//结果断言
function assertResult(res) {
    if (!res) { return }
    assert.strictEqual(res.statusCode, 200)
    assert.strictEqual(!res.body.code, true)
    if (!res.body.error) { res.body.error = null }
    assert.strictEqual(res.body.error, null)
    if (res.body.token) {
        token = res.body.token
        logger.debug('token changed', token)
    }
}