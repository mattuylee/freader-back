/**
 * @class 统一请求响应体
 */
export class Result<T = any> {
  constructor(data?: T) {
    if (data) {
      this.data = data;
    }
  }
  /** 错误代码 */
  code: number;
  /** 错误内容 */
  error: string;
  /** 新的会话ID */
  token?: string;
  /** 是否需要重新登录 */
  needLogin?: boolean;
  /** 设置响应内容 */
  data: T;
}
