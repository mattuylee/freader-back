var fs = require("fs");
var path = require("path");

const SOURCE_ROOT = path.resolve(__dirname, "..");
const DEST_ROOT = path.resolve(__dirname, "..", "bin");

try {
  copyStatic();
  if (
    fs.existsSync(path.join(SOURCE_ROOT, "src/config.json")) &&
    !fs.existsSync(path.join(DEST_ROOT, "config.json"))
  ) {
    //复制配置文件
    fs.copyFileSync(
      path.join(SOURCE_ROOT, "src/config.json"),
      path.join(DEST_ROOT, "config.json")
    );
  }
} catch (e) {
  console.error("fatal: failed to copy static files.");
  console.error(e.message);
}

//复制静态资源文件（public目录）
function copyStatic() {
  if (!fs.existsSync(path.join(DEST_ROOT, "public"))) {
    fs.mkdirSync(path.join(DEST_ROOT, "public"), { recursive: true });
  }
  if (fs.existsSync(path.join(SOURCE_ROOT, "public"))) {
    copyDirectory({
      src: path.resolve(SOURCE_ROOT, "public"),
      dest: path.resolve(DEST_ROOT, "public"),
      skipScriptFile: false,
    });
  }
}

/**
 * 复制目录下的文件/子目录到另一个目录
 * @param options 配置选项
 * @param {string} options.src 被复制的目录（目录本身不会被复制）
 * @param {string} options.dest 复制到的目录
 */
function copyDirectory(options = {}) {
  if (!options.src) {
    options.src = SOURCE_ROOT;
  }
  if (!options.dest) {
    options.dest = DEST_ROOT;
  }
  let files = fs.readdirSync(options.src);
  if (!files || !files.length) {
    return;
  }
  files.forEach((file) => {
    let srcPath = path.join(options.src, file);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory({
        ...options,
        ...{
          src: path.join(options.src, file),
          dest: path.join(options.dest, file),
        },
      });
      return;
    }
    let destPath = path.join(options.dest, file);
    if (!fs.existsSync(path.dirname(destPath))) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
    }
    if (
      !fs.existsSync(destPath) ||
      fs.statSync(destPath).mtimeMs < fs.statSync(srcPath).mtimeMs
    ) {
      //复制已修改文件
      fs.copyFileSync(srcPath, destPath);
    }
  });
}
