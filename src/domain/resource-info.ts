/**
 * 资源信息定位
 */
export class ResourceInformation {
    source: RemoteResource  //数据源
    data: string    //自定义数据，结构由数据源和资源类型决定，一般为url字符串
}

/**
 * 远程数据源
 */
export class RemoteResources {
    Qidian = 'Qidian'     //起点
    X23usCom = 'X23usCom' //顶点小说x23us.com
}
type RemoteResource = string
