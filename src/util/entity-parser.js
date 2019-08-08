/**
 * 复制两个对象**共有的**属性到target对象
 * @param 赋值到的对象
 * @param 被复制的对象
 * @return 返回target对象
 */
function _assign(target, source) {
    if (!source || typeof source != 'object' || !target || typeof target != 'object') {
        return target
    }
    for (let key in source) {
        if (key in target) { target[key] = source[key] }
    }
    return target
}

module.exports.assign = _assign