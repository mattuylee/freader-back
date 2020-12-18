const assert = require("assert");
/**
 * 对数据进行验证
 * @param value 待验证的值
 * @param {ValidateOption} options 验证选项
 * @return {boolean} 验证是否通过
 */
function validate(value, options) {
  if (!options) {
    options = {};
  }
  if (options.type && options.type != "normal") {
    return specifiedValidate(value, options.type);
  } //特定类型验证
  try {
    if (options.not) {
      assert.strictEqual(options.not.includes(value), false);
    } //禁止值断言
    if (options.in) {
      assert.strictEqual(options.in.includes(value), true);
    } //允许值断言
    if (!options.nullable) {
      assert.strictEqual(
        value === null || value === undefined || value === "",
        false
      );
    } //非空断言
    else if (
      options.nullable &&
      (value === null || value === undefined || value === "")
    ) {
      return true;
    } //如果允许为空且值为空直接返回true
    if (options.valueType !== undefined) {
      if (typeof options.valueType === "string") {
        if (options.valueType === "number") {
          assert.strictEqual(Number.isNaN(Number(value)), false);
        } else if (options.valueType === "string") {
          assert.strictEqual(
            typeof value == "number" || typeof value == "string",
            true
          );
        } else {
          assert.strictEqual(typeof value, options.valueType);
        }
      } //类型名称断言
      else if (typeof options.valueType === "function") {
        assert.strictEqual(value instanceof options.valueType, true);
      } //构造函数断言
      else if (typeof options.valueType === "object") {
        assert.strictEqual(objectTypeValidate(value, options.valueType), true);
      } //对象兼容断言
      else if (Number.isNaN(options.valueType)) {
        assert.strictEqual(Number.isNaN(options.valueType), true);
      } //NaN断言
      else {
        assert.strictEqual(value, options.valueType);
      } //未知类型断言
    } //类型断言
    if (options.min !== undefined) {
      assert.strictEqual(value < options.min, false);
    } //最小值断言
    if (options.max !== undefined) {
      assert.strictEqual(value > options.max, false);
    } //最大值断言
    if (options.minLength !== undefined) {
      if (value === null || value === undefined) {
        assert.strictEqual(0 < options.minLength, false);
      } else if (value && value.length) {
        assert.strictEqual(value.length < options.minLength, false);
      } else {
        assert.strictEqual(String(value).length < options.minLength, false);
      }
    } //最小长度断言
    if (options.maxLength !== undefined) {
      if (value === null || value === undefined) {
        assert.strictEqual(0 > options.maxLength, false);
      } else if (value && value.length) {
        assert.strictEqual(value.length > options.maxLength, false);
      } else {
        assert.strictEqual(String(value).length > options.maxLength, false);
      }
    } //最大长度断言
    if (options.pattern) {
      assert.strictEqual(options.pattern.test(String(value)), true);
    } //模式匹配断言
  } catch {
    return false;
  }
  return true;
}

/**
 * @deprecated 使用@see validate() 代替
 * 验证特定类型的值
 * @param value 值
 * @param type 验证类型
 * @return {boolean}
 */
function specifiedValidate(value, type) {
  switch (type) {
    case "name":
      return validate(value, {
        nullable: false,
        pattern: /^[-_0-9a-zA-Z\u4e00-\u9fbb]{2,16}$/,
      });
    case "password":
      return validate(value, {
        nullable: false,
        pattern: /^[!-~]{2,18}$/,
      });
    default:
      return false;
  }
}
/**
 * 类型兼容性检验。当待验证对象的每一个字段都存在于参考对象中且类型相同时通过验证。
 * 验证行为是递归的，因此对于object类型会递归比对
 * @param {object} target 待验证的对象
 * @param {object} reference 参考对象
 * @return {boolean} 对象是否兼容
 */
function objectTypeValidate(target, reference) {
  for (const key in target) {
    if (!(key in reference)) {
      return false;
    }
    if (
      typeof target[key] == "object" &&
      !objectTypeValidate(target[key], reference[key])
    ) {
      return false;
    }
  }
  return true;
}

module.exports = { validate };
