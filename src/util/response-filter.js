const User = require("../domain/user").User;
const Chapter = require("../domain/book/chapter").Chapter;
const Book = require("../domain/book/book").Book;
const logger = require("../log/index").logger;

//最大递归深度
const MAX_DEPTH = 10;
/**
 * 过滤响应体对象。如果对象类型为object，递归扫描是否有需要过滤的对象，
 * 对于未被过滤的对象不会进行复制，而被改变的对象将会进行浅复制。
 * 过滤器工作的关键在于 instanceof 操作符的使用，因此务必保证对象的prototype指向
 * 正确的构造函数的prototype，否则过滤动作将失效
 * @param data 被过滤的对象
 * @return 过滤后的对象
 */
function _filter(data) {
  return filterOrigin(data, 0);
}

function filterOrigin(data, depth) {
  if (!data) {
    return data;
  }
  if (!data || depth > MAX_DEPTH) {
    logger.warn(
      `response filter: recursion count exceeds MAX_DEPTH(${MAX_DEPTH})`
    );
    return data;
  }
  if (typeof data !== "object") {
    return data;
  }

  let copy = Array.isArray(data) ? [] : {};
  for (let key in data) {
    //去除空字段
    if (data[key] === undefined) {
      continue;
    }
    //用户密码
    if (data instanceof User && key == "password") {
      continue;
    }
    //书籍
    if (
      data instanceof Book &&
      (key == "infoLevel" ||
        key == "lastWriteTime" ||
        key == "detailPageInfo" ||
        key == "catalogPageInfo")
    ) {
      continue;
    }
    //章节资源定位信息
    if (data instanceof Chapter && key == "resourceInfo") {
      continue;
    }
    copy[key] = filterOrigin(data[key], depth + 1);
  }
  return copy;
}

module.exports = _filter;
