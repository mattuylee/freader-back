import * as assert from 'assert'
import { User } from '../domain/user';
/**
 * 对数据进行验证
 * @param options 验证选项
 * @return {boolean} 验证是否通过
 */
export function validate(value: any, options?: ValidateOption): boolean {
    if (!options) { options = {} }
    if (options.type && options.type != 'normal') {
        return specifiedValidate(value, options.type)
    } //特定类型验证
    try {
        if (options.nullable) {
            assert.strictEqual((value === null || value === undefined), false)
        } //非空断言
        if (options.valueType !== undefined) {
            if (typeof options.valueType === 'string') {
                if (options.valueType === 'number') {
                    assert.strictEqual(Number.isNaN(Number(value)), false)
                }
                else if (options.valueType === 'string') {
                    assert.strictEqual(typeof value == 'number' || typeof value == 'string', true)
                }
                else { assert.strictEqual(typeof value, options.valueType) }
            } //类型名称断言
            else if (typeof options.valueType === 'function') {
                assert.strictEqual(value instanceof options.valueType, true)
            } //构造函数断言
            else if (typeof options.valueType === 'object') {
                for (const key in value) {
                    assert.strictEqual(key in options.valueType, true)
                }
            } //对象兼容断言
            else if (Number.isNaN(options.valueType)) {
                assert.strictEqual(Number.isNaN(options.valueType), true)
            } //NaN断言
            else { assert.strictEqual(value, options.valueType) } //未知类型断言
        } //类型断言
        if (options.min !== undefined) {
            assert.strictEqual(value < options.min, false)
        } //最小值断言
        if (options.max !== undefined) {
            assert.strictEqual(value > options.max, false)
        } //最大值断言
        if (options.minLength !== undefined) {
            if (value === null || value === undefined) {
                assert.strictEqual(0 < options.minLength, false)
            }
            else if (value && value.length) {
                assert.strictEqual(value.length < options.minLength, false)
            }
            else {
                assert.strictEqual(String(value).length < options.minLength, false)
            }
        } //最小长度断言
        if (options.maxLength !== undefined) {
            if (value === null || value === undefined) {
                assert.strictEqual(0 > options.maxLength, false)
            }
            else if (value && value.length) {
                assert.strictEqual(value.length > options.maxLength, false)
                console.log(3)
            }
            else {
                assert.strictEqual(String(value).length > options.maxLength, false)
            }
        } //最大长度断言
        if (options.pattern) {
            assert.strictEqual(options.pattern.test(String(value)), true)
        } //模式匹配断言
    }
    catch {
        return false
    }
    return true
}

/**
 * 验证选项
 */
export interface ValidateOption {
    /**
     * 特定类型数据的验证
     * normal 正常验证
     * name 名称验证
     * password 密码验证
     */
    type?: 'normal' | 'name' | 'password'
    /**
     * 类型验证，根据不同的参数类型决定行为：
     * {string} 对value执行typeof运算，执行严格相等断言
     * {Function} 执行构造函数断言
     * {object} 对value执行for (let key in value) 运算，必须每一个key in options.valueType为true
     * {NaN} 执行是否为NaN断言
     * 其它 执行严格相等断言
     * 注意，number类型默认可以通过string类型验证，而如果string类型的value可以正确转化为数值，也通过验证
     */
    valueType?: string | object | any
    /**
     * 是否可空，默认不可为空
     * 注意：0, false, ''等值不被认为是空值
     */
    nullable?: boolean
    /** 范围限定 */
    max?: any
    min?: any
    /**
     * 尺寸限定
     * 如果值为null或undefined则认为长度为0
     * 如果值具有length属性则为对length属性的限定
     * 否则如果值的类型不是string则转化为string后计算
     */
    maxLength?: number
    minLength?: number
    /** 模式匹配规则 */
    pattern?: RegExp
}

/**
 * @deprecated 使用@see validate() 代替
 * 验证特定类型的值
 * @param value 值
 * @param type 验证类型
 */
function specifiedValidate(value: string, type: 'name' | 'password'): boolean {
    switch (type) {
        case 'name':
            return validate(value, {
                nullable: false,
                pattern: /^[-_0-9a-zA-Z\u4e00-\u9fbb]{2,16}$/,
            })
        case 'password':
            return validate(value, {
                nullable: false,
                pattern: /^[!-~]{2,18}$/,
            })
        default:
            return false
    }
}
