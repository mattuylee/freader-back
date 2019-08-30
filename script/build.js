const fs = require('fs')
const path = require('path')
const child_process = require('child_process')

const binPath = path.resolve(__dirname, '..', 'bin')
const options = {
    cwd: path.resolve(__dirname, '..')
}
if (fs.existsSync(binPath)) {
    child_process.execSync('rm ./bin -rf', options)
}
child_process.execSync('tsc && node ./script/copy-static.js', options)
