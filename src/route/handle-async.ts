import { Result } from "../domain/result"
import { filter as responseFilter } from '../util/response-filter'
import { logger } from '../log'

//处理异步结果，写响应体
export function handleAsync(promise, response) {
    promise.then((res) => {
        response.json(responseFilter(res))
    }).catch(e => {
        let result = new Result()
        result.code = 500
        result.error = '服务器内部错误'
        response.json(result)
        logger.error(e.message ? e.message : e)
    })
}
