import * as util from '../../util/index'
import { ResourceInformation, SourceLiteral } from "../resource-info";

/**
 * 定义书籍主体
 * 注意，书籍单位由书籍名称+作者确定，不同数据源共享同一个书籍ID。要定位特定的书籍文
 * 档，需要同时指定书籍ID和数据源
 */
export class Book {
  bid: string                 //书籍ID，计算参量应包含书籍名称、作者
  name: string                //书籍名称
  author: string              //作者
  category: string            //分类
  cover: string               //封面
  intro: string               //简介
  status: UpdateStatus        //更新状态
  words: string               //字数（概数）
  lastUpdateTime: string      //书籍上次更新时间
  latestChapter: string       //最新章节
  chapterCount: number        //章节计数
  source: SourceLiteral      //数据源
  /**@region 仅服务端存储 */
  infoLevel: InfoLevel        //书籍信息完善度
  lastWriteTime: number       //数据库上次更新时间
  //书籍详情数据页面的信息
  detailPageInfo: ResourceInformation
  //章节目录页面，如果省略则使用详情页信息
  catalogPageInfo: ResourceInformation
  /**@endregion */


  /** 生成书籍ID */
  makeId(): string {
    this.bid = util.hash(this.name + '#' + this.author)
    return this.bid
  }
}

/**
 * @enum 书籍信息完善级别
 */
export enum InfoLevel {
  None = 'None',      //无数据
  Meta = "Meta",      //仅有元数据
  Search = 'Search',  //仅搜索记录
  Detail = 'Detail',  //有详情数据
  All = 'All'         //有所有数据（手动录入）
}

/** 书籍更新状态 */
export enum UpdateStatus {
  Serial = '连载',
  Finished = '完本'
}