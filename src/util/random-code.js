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

module.exports = createRandomCode