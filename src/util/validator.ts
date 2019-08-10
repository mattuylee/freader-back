import * as assert from 'assert'
/**
 * 对数据进行验证
 * @param options 验证选项
 * @return {boolean} 验证是否通过
 */
export function validate(value: any, options: ValidateOption): boolean {
    if (!options) { options = {} }
    try {
        if (options.nullable) {
            assert.strictEqual((!value && typeof value !== 'number' && typeof value !== 'string' && value !== false), false)
        } //非空断言
        if (options.type !== undefined) {
            if (typeof options.type === 'string') {
                if (options.type === 'number') {
                    assert.strictEqual(Number.isNaN(Number(value)), false)
                }
                else if (options.type === 'string') {
                    assert.strictEqual(typeof value == 'number' || typeof value == 'string', true)
                }
                else { assert.strictEqual(typeof value, options.type) }
            } //类型名称断言
            else if (typeof options.type === 'function') {
                assert.strictEqual(value instanceof options.type, true)
            } //构造函数断言
            else if (typeof options.type === 'object') {
                for (const key in value) { assert.strictEqual(key in options.type, true) }
            } //对象兼容断言
            else if (Number.isNaN(options.type)) {
                assert.strictEqual(Number.isNaN(options.type), true)
            } //NaN断言
            else { assert.strictEqual(value, options.type) } //未知类型断言
        } //类型断言
        if (options.min !== undefined) {
            assert.strictEqual(value < options.min, false)
        } //最小值断言
        if (options.max !== undefined) {
            assert.strictEqual(value > options.max, false)
        } //最大值断言
        if (options.pattern) {
            assert.strictEqual(new RegExp(options.pattern).test(String(value)), true)
        } //模式匹配断言
    }
    catch {
        return false
    }
    return true
}
/**
 * 验证特定类型的值
 * @param value 值
 * @param type 验证类型
 *  name 标识符验证
 *  password 密码验证
 */
export function specifiedValidate(value: string, type: 'name' | 'password'): boolean {
    switch (type) {
        case 'name':
            return /^[_0-9a-zA-Z\u4e00-\u9fbb]{2,16}$/.test(value)
        case 'password':
            return /^[!-~]{2,18}$/.test(value)
        default:
            return false
    }
}

/**
 * 验证选项
 */
class ValidateOption {
    /**
     * 类型验证，根据不同的参数类型决定行为：
     * {string} 对value执行typeof运算，执行严格相等断言
     * {Function} 执行构造函数断言
     * {object} 对value执行for (let key in value) 运算，必须每一个key in options.type为true
     * {NaN} 执行是否为NaN断言
     * 其它 执行严格相等断言
     * 注意，number类型默认可以通过string类型验证，而如果string类型的value可以正确转化为数值，也通过验证
     */
    type?: string | object | any
    /**
     * 是否可空，默认不可为空
     * 注意：0, false, ''等值不被认为是空值
     */
    nullable?: boolean
    /**
     * 最大值
     */
    max?: any
    /**
     * 最小值
     */
    min?: any
    /**
     * 匹配规则
     */
    pattern?: RegExp
}