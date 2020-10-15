const fs = require('fs')
const path = require('path')
const superAgent = require('superagent')
const superagentCharset = require('superagent-charset')
const logger = require('../bin/log').logger

var testConfig
var token

async function run(shouldRun) {
  if (shouldRun) {
    const app = require('../bin/app')
    await app.run()
  }
  logger.trace('---测试开始---')
  await runTest().then(() => {
    logger.info('---测试通过---')
  }).catch(e => {
    logger.error(e.message ? e.message : e)
    logger.error('---测试失败---')
  })
}

/** 执行测试用例 */
async function runTest() {
  try {
    testConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, './test-config.json')).toString('utf-8'))
  }
  catch {
    logger.fatal('Failed to run test: test config file not found.')
    return
  }
  let baseUrl
  if (testConfig.baseUrl) {
    baseUrl = testConfig.baseUrl
  }
  else if (testConfig.host && testConfig.port) {
    baseUrl = 'http://' + testConfig.host + ':' + testConfig.port + testConfig.basePath
  }
  else {
    baseUrl = 'http://localhost:3280'
  }
  if (baseUrl.endsWith('/')) { baseUrl = baseUrl.slice(0, baseUrl.length - 1) }
  //执行登录，获取凭证
  const res = await superAgent.post(baseUrl + '/user/login')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({ uid: testConfig.user, pwd: testConfig.password })
    .catch(e => {
      logger.error("failed to login", e)
    })
  if (!res) {
    return
  }
  assertResult(res)
  //执行测试用例
  await runTests(testConfig.testCases, baseUrl)
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
      if (method == 'get' || method == 'delete') {
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
  if (res.statusCode !== 200) {
    throw Error("request failed: " + res.statusCode + ' ' + res.statusMessage)
  }
  else if (!res.body) {
    throw Error("empty response")
  }
  else if (res.body.code || res.body.error) {
    throw Error("the server returned an error: " + res.body.error)
  }
  if (res.body.token) {
    token = res.body.token
    logger.debug('token changed: ', token)
  }
}

module.exports = { run }