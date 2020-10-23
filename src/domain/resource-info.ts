/**
 * 资源信息定位
 */
export class ResourceInformation {
  constructor(source?: SourceLiteral, data?: string) {
    this.source = source;
    this.data = data;
  }
  source: SourceLiteral; //数据源
  data: string; //自定义数据，结构由数据源和资源类型决定，一般为url字符串
}

/**
 * 远程数据源
 */
export enum SourceLiteral {
  Default = "Default",
  Qidian = "Qidian", //起点
  X23usCom = "X23usCom", //顶点小说x23us.com
}

/** 定义一个数据源 */
export interface RemoteSource {
  source: string;
  name: string;
  vip: boolean;
  support: SourceSupport | number;
}

/** 数据源支持的功能，可通过按位或运算叠加 */
export enum SourceSupport {
  None = 0b0,
  //是否支持搜索
  Search = 0b00000001,
  //是否支持分类浏览
  Category = 0b00000010,
  //是否有排行榜
  Rank = 0b00000100,
  //是否支持推荐书单
  Recommend = 0b00001000,
}

/** 远程数据源列表 */
export const RemoteSources: RemoteSource[] = [
  {
    source: "Qidian",
    name: "起点",
    vip: true,
    support: SourceSupport.Search | SourceSupport.Category | SourceSupport.Rank,
  },
  {
    source: "X23usCom",
    name: "顶点",
    vip: false,
    support: SourceSupport.Search,
  },
];
