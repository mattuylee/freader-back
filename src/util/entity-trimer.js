/**
 * 修剪对象，将其值为undefined的字段删去
 * @param target 目标对象
 * @param values 可选，要去除的值列表，默认为[undefined]
 */
function _trim(target, values = [undefined]) {
  if (typeof target !== "object") {
    return target;
  }
  if (!Array.isArray(values)) {
    values = [undefined];
  }
  for (const key in target) {
    for (let value of values) {
      if (target[key] === value) {
        delete target[key];
        break;
      }
    }
  }
  return target;
}

module.exports = _trim;
