const crypto = require('crypto')
/**
 * 创建随机编码
 * @param length 编码长度
 * @return {string}
 */
function createRandomCode(length) {
    if (!(length > 0 && length <= 128)) {
        length = 32
    }
    let token = ''
    for (let i = 0; i < length; ++i) {
        token += Math.round((Math.random() * 36)).toString(36)
    }
    return token
}

/**
 * 计算数据的hash值
 * @param {string | any} data 要计算哈希值的数据
 * @return {string} 传入数据的hash值
 */
function hash(data) {
    return crypto.createHash('md5').update(data).digest('hex')
}


module.exports._createRandomCode = createRandomCode
module.exports._hash = hash
