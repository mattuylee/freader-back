/**
 * 数据验证选项
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