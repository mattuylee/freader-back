const ResponseFilter = require('./response-filter').responseFilter

/**
 * 为了@see ResponseFilter.filter() 能够正常过滤掉不需要的字段，我们需要将相关实体对象的prototype设
 * 置为其构造函数的prototype
 * @param target 
 * @param prototype 
 */
function _setPrototype(target, prototype) {
    if (!target || typeof target !== 'object') { return }
    Reflect.setPrototypeOf(target, prototype)
}

module.exports = _setPrototype