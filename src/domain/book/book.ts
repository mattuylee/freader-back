import { ResourceInformation } from "../resource-info";
import { Chapter } from "./chapter";

/** 定义书籍主体 */
export class Book {
    bid: string             //书籍ID，计算参量应包含书籍名称、作者和数据源
    name: string            //书籍名称
    author: string          //作者
    category: string        //分类
    cover: string           //封面
    intro: string           //简介
    status: string          //更新状态
    words: string           //字数（概数）
    lastUpdateTime: string  //书籍上次更新时间
    latestChapter: Chapter  //最新章节
    /**@region 仅服务端存储 */
    infoLevel: InfoLevel    //书籍信息完善度
    lastAccessTime: Date    //数据库上次更新时间
    //书籍详情数据页面的信息
    detailPageInfo: ResourceInformation
    /**@endregion */

    /**
     * @deprecated 不在书籍信息中存储章节数目。因为既然目录被独立出来单独存储，章
     * 节数目应该作为目录的属性存储而非书籍。存储在书籍信息中不仅造成数据冗余且增
     * 加更新章节信息的代价（需要同时更新章节和书籍） 
     */
    chapterCount: number    //章节计数
}

/**
 * @enum 书籍信息完善级别
 */
export class InfoLevels {
    static readonly None = 'None'     //无数据
    static readonly Search = 'Search' //仅搜索记录
    static readonly Detail = 'Detail' //有详情数据
    static readonly All = 'All'       //有所有数据（手动录入）
}
type InfoLevel = string
