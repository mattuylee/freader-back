import { Book } from "./book";
import { SourceLiteral } from "../resource-info";

/** 书单 */
export interface Series {
  id: string;
  type: SeriesType;
  name: string;
  //显示在发现页的预览书籍，可为空数组
  books?: Book[];
  support: number;
  source: SourceLiteral;
}

/** 书单的类别 */
export enum SeriesType {
  //普通书单
  Recommand = "Series",
  //排行榜
  Rank = "Rank",
  //类别
  Category = "Category",
}

/** 书籍列表，按需获取的响应体 */
export interface SeriesBookList {
  seriesId: string;
  books: Book[];
  isLast: boolean;
  page: number;
  total?: number;
  source: SourceLiteral;
}
/** 书单支持的选项，可通过按位或运算叠加 */
export enum SeriesSupport {
  None = 0b0,
  //是否支持按类别筛选
  Category = 0b00000001,
  //是否支持按页码获取
  MultiPage = 0b00000010,
  //是否支持不同性别筛选
  Gender = 0b00000100,
  //是否支持根据更新状态筛选
  FinishState = 0b00001000,
}
/** 获取书单的选项，各数据源可按需支持 */
export interface SeriesOptions {
  /** 性别 */
  gender?: "male" | "female" | null;
  /** 类别 */
  categoryId?: string;
  /** 限定更新状态 */
  state?: "all" | "serial" | "finished";
}
