import { ResourceInformation } from "../resource-info";
import * as util from '../../util/index'

/**
 * 定义章节
 * 注意，章节ID由书籍ID、章节名称和章节的位置索引生成，故不同数据源的相同书籍可能共
 * 享同一章节ID。要定位章节，需要指定数据源
 */
export class Chapter {
    cid: string         //章节ID
    bid: string         //书籍ID
    title: string       //章节标题
    wordCount: number   //字数统计
    content: string     //章节内容
    source: string      //数据源

    resourceInfo: ResourceInformation //资源定位
       /**
        * 生成章节ID
        */
       makeId(index?: number): string {
        this.bid = String(index).padStart(4, '0') + util.hash(this.bid  + index + this.title)
        return this.bid
    }
}
