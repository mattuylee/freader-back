import { ValidateOption } from "./validator-option";

/**
 * 定义controller
 */
export interface Controller {
    type?: 'controller'
    /** 名称 */
    name: string
    /** 描述说明 */
    description: string
    /** controller的基本路径 */
    path: string
    /** 要调用的service */
    service: object
    /** 路由列表 */
    routes: Route[]
}

/** 定义路由配置结构 */
interface Route {
    /** 请求路径 */
    path: string
    /** 请求方法及参数列表 */
    requests: RequestMethod[]
    /** 描述说明 */
    description?: string
}
/** 定义请求配置结构 */
interface RequestMethod {
    /** 请求方法 */
    method: 'get' | 'post' | 'put' | 'delete'
    /** 描述说明 */
    description?: string,
    /** 是否需要进行自动身份验证 */
    token: boolean
    /**
     * 要调用的service的方法
     * 如果是函数，则直接调用对应方法
     * 否则调用对应@see Controller#service 属性的对应方法
     */
    invoke: Function | string
    /** @see RequestMethod#invoke 方法的this对象，仅当其为函数时有效 */
    thisObject?: object
    /** 请求头限制 */
    headers?: { [param: string]: string }
    /** 请求参数 */
    params?: RequestParam[]
}
/** 定义请求参数配置结构 */
interface RequestParam {
    /**
     * 参数来源。
     * headers 来源于请求头
     * query 来源于url查询参数
     * params 来源于url路径参数
     * body 来源于上传的json对象或表单
     */
    from: 'headers' | 'query' | 'params' | 'body'
    /** 参数名称。当@see from 为body时，参数名称可为null，若为null则认为参数是整个body对象 */
    name: string | null
    /** 参数说明 */
    description?: string
    /** 参数验证机制 */
    validation: ValidateOption
    /** 参数类型，仅用于说明 */
    type: any
}
