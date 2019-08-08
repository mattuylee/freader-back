import { User } from "../domain/user";
import { logger } from '../log/index'

//最大递归深度
const MAX_DEPTH = 10
/**
 * 过滤响应体对象。如果对象类型为object，递归扫描是否有需要过滤的对象，
 * 对于未被过滤的对象不会进行复制，而被改变的对象将会进行浅复制。
 * 过滤器工作的关键在于 instanceof 操作符的使用，因此务必保证对象的prototype指向
 * 正确的构造函数的prototype，否则过滤动作将失效
 * @param {} data 被过滤的对象
 * @return 过滤后的对象
 */
export function filter<T>(data): T {
    return filterOrigin(data, 0)
}

function filterOrigin(data, depth) {
    if (!data) { return data }
    if (!data || depth > MAX_DEPTH) {
        logger.warn(`response filter: recursion count exceeds MAX_DEPTH(${MAX_DEPTH})`)
        return data
    }
    if (typeof data !== 'object') { return data }
    
    let copy = {}
    for (let key in data) {
        //ObjectId
        if (key == '_id') { continue }
        //用户密码
        if (data instanceof User && key == 'password') { continue }
        copy[key] = filterOrigin(data[key], depth + 1)
    }
    return copy
}
