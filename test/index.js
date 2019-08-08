const fs = require('fs')
const path = require('path')
const process = require('process')

const app = require('../bin/app')
const logger = require('../bin/log').logger


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
    let dir = path.resolve(__dirname, 'case')
    let testCases = fs.readdirSync(dir)
    for (let c of testCases) {
        console.log(dir, c)
        if (!c.endsWith('.test.js')) { continue }
        const testCase = await require(path.join(dir, c))
        if (testCase.runTest) { await testCase.runTest() }
    }
    return
}
