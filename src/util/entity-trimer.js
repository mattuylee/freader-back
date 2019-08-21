/** 修剪对象，将其值为undefined的字段删去 */
function _trim(target) {
    if (typeof target !== 'object') { return target }
    for (const key in target) {
        if (target[key] === undefined) { delete target[key] }
    }
    return target
}

module.exports = _trim