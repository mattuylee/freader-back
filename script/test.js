const childProcess = require('child_process')
  , path = require('path')
  , help = `
【测试】
测试接口：npm test api
运行本地服务器并测试接口：npm test api --run
测试所有数据源：npm test sources
测试特定数据源：npm test <数据源名称>
可用的数据源（不区分大小写）：
* Qidian
* X23usCom
`.trim()
  , sources = { qidian: 'qidian.js', x23uscom: 'x23us-com.js' }
  , args = process.argv.slice(2)

if (args.length === 0) {
  console.log(help)
  return
}

const target = args[0]
if (/^-?-?help$/.test(target)) {
  console.log(help)
}
else if (target.toLowerCase() === 'api') {
  let shouldRun = false
  if (/^--?run$/.test(args[1])) {
    shouldRun = true
  }
  else if (args.length > 1) {
    console.error("未识别的参数：" + args[1])
    return
  }
  require('../test/index').run(shouldRun).finally(() => process.exit(0))
}
else if (target.toLowerCase() === 'sources') {
  if (args.length > 1) {
    console.error("未识别的参数：" + args[1])
  }
  childProcess.spawn(
    'npx',
    ['mocha', path.resolve(__dirname, '../test/sources', '*.js')],
    { shell: true, stdio: 'inherit' }
  )
}
else {
  const targets = []
  for (const source of args) {
    if (sources[source.toLowerCase()]) {
      targets.push(sources[source.toLowerCase()])
    }
    else {
      console.error("参数错误：找不到数据源 " + source)
      return
    }
  }
  const files = targets.map(t => path.resolve(__dirname, '../test/sources', t))
  childProcess.spawn('npx', ['mocha', ...files], { shell: true, stdio: 'inherit' })
}
