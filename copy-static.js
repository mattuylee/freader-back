var fs = require('fs')
var path = require('path')

if (!fs.existsSync('./bin/public')) {
    fs.mkdirSync('./bin/public', { recursive: true })
}

const SOURCE_ROOT = path.resolve('./public')
const DEST_ROOT = path.resolve('./bin/public')

if (fs.existsSync('./public')) {
    copyDirectory('')
}


/** 复制静态资源到输出目录 */
function copyDirectory(root) {
    let files = fs.readdirSync(path.resolve(SOURCE_ROOT, root))
    if (!files) { return }
    files.forEach(file => {
        let src = path.resolve(SOURCE_ROOT, root, file)
        if (fs.statSync(src).isDirectory()) {
            copyDirectory(path.join(root, file))
        }
        else {
            fs.mkdirSync(path.resolve(DEST_ROOT, root), { recursive: true })
            fs.copyFileSync(src, path.resolve(DEST_ROOT, root, file))
        }
    })
}
