/**
 * 资源信息定位
 */
export class ResourceInformation {
    constructor(source?: RemoteResource, data?: string) {
      this.source = source
      this.data = data
    }
    source: RemoteResource  //数据源
    data: string            //自定义数据，结构由数据源和资源类型决定，一般为url字符串
}

/**
 * 远程数据源
 */
export enum RemoteResource {
    Qidian = 'Qidian',      //起点
    X23usCom = 'X23usCom'   //顶点小说x23us.com
}
