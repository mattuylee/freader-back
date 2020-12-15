import { InfoLevel } from "../domain/book/book";
export { createRandomCode, hash } from "./random-encoder";
export { defaultGlobalConfig as globalConfig } from "./global-config";
export { filter as filterResponse } from "./response-filter";
export { setPrototype } from "./prototype-setter";
export { trim as trimEntity } from "./entity-trimer";
export { validate } from "./validatior";
export {
  jwtCreateToken,
  jwtSecret,
  jwtShouldUpdate,
  jwtTokenToUserID,
  jwtVerify,
} from "./jwt";

/**
 * 格式化时间
 * @param time 时间，允许字符串或时间戳
 * @param format 输出格式
 * @param format.chineseFull 中文年月日 HH:MM:SS
 * @param format.chineseDate 中文年月日
 * @param format.englishFull YYYY-MM-DD hh:mm:ss
 * @param format.englishDate YYYY-MM-DD
 */
export function formatTime(time, format: string) {
  let t = new Date(time);
  switch (format) {
    case "chineseFull":
      return `${t.getFullYear()}年${
        t.getMonth() + 1
      }月${t.getDate()}日 ${String(t.getHours()).padStart(2, "0")}:${String(
        t.getMinutes()
      ).padStart(2, "0")}:${String(t.getSeconds()).padStart(2, "0")}`;
    case "chineseDate":
      return `${t.getFullYear()}年${t.getMonth() + 1}月${t.getDate()}日`;
    case "englishFull":
      return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(t.getDate()).padStart(2, "0")} ${String(
        t.getHours()
      ).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}:${String(
        t.getSeconds()
      ).padStart(2, "0")}`;
    case "englishDate":
      return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(t.getDate()).padStart(2, "0")}`;
    default:
      return t.toString();
  }
}

/**
 * 判断信息级别是否满足特定的级别（包含相等情况）
 * @param level 待验证的信息级别
 * @param target 要满足的信息级别
 * @return {boolean} 是否满足
 */
export function isInfoLevelEnough(
  level: InfoLevel,
  target: InfoLevel
): boolean {
  const levels = [
      InfoLevel.None,
      InfoLevel.Meta,
      InfoLevel.Search,
      InfoLevel.Detail,
      InfoLevel.All,
    ],
    index = levels.indexOf(level),
    targetIndex = levels.indexOf(target);
  if (index === -1 || targetIndex === -1) {
    return false;
  }
  return index >= targetIndex;
}
