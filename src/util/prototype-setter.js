const ResponseFilter = require('./response-filter').responseFilter

/**
 * 为了@see ResponseFilter.filter() 能够正常过滤掉不需要的字段，我们需要将相关实体对象的prototype设
 * 置为其构造函数的prototype
 * @param target 目标对象
 * @param prototype 对象的prototype
 * @return {any} 目标对象
 */
function _setPrototype(target, prototype) {
    if (!target || typeof target !== 'object') { return target }
    Reflect.setPrototypeOf(target, prototype)
    return target
}

module.exports = _setPrototype