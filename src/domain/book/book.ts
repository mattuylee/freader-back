import { ResourceInformation } from "../resource-info";
import { Chapter } from "./chapter";
import * as util from '../../util/index'

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
    status: BookUpdateStatus    //更新状态
    words: string               //字数（概数）
    lastUpdateTime: string      //书籍上次更新时间
    latestChapter: Chapter      //最新章节
    source: string              //数据源
    /**@region 仅服务端存储 */
    infoLevel: InfoLevel        //书籍信息完善度
    lastWriteTime: number       //数据库上次更新时间
    //书籍详情数据页面的信息
    detailPageInfo: ResourceInformation
    //章节目录页面，如果省略则使用详情页信息
    catalogPageInfo: ResourceInformation
    /**@endregion */

    /**
     * @deprecated 不在书籍信息中存储章节数目。因为既然目录被独立出来单独存储，章
     * 节数目应该作为目录的属性存储而非书籍。存储在书籍信息中不仅造成数据冗余且增
     * 加更新章节信息的代价（需要同时更新章节和书籍） 
     */
    chapterCount: number    //章节计数

    /** 生成书籍ID */
    makeId(): string {
        this.bid = util.hash(this.name + '#' + this.author)
        return this.bid
    }
}

/**
 * @enum 书籍信息完善级别
 */
export class InfoLevels {
    static readonly None = 'None'     //无数据
    static readonly Search = 'Search' //仅搜索记录
    static readonly Detail = 'Detail' //有详情数据
    static readonly All = 'All'       //有所有数据（手动录入）
    /**
     * 判断信息级别是否满足特定的级别（包含相等情况）
     * @param level 待验证的信息级别
     * @param target 要满足的信息级别
     * @return 是否满足
     */
    static enough(level: InfoLevel, target: InfoLevel): boolean {
        if (target == InfoLevels.None) { return true }
        if (target == InfoLevels.Search && [InfoLevels.Search, InfoLevels.Detail, InfoLevels.All].includes(level)) {
            return true
        }
        if (target == InfoLevels.Detail && [InfoLevels.Detail, InfoLevels.All].includes(level)) {
            return true
        }
        if (target == InfoLevels.All && level == InfoLevels.All) { return true }
        return false
    }
}
type InfoLevel = string

/** 书籍更新状态 */
export class BookUpdateStatus {
    static readonly Serial = '连载'
    static readonly completed = '完本'
}
type UpdateStatus = string