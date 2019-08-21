import { ResourceInformation } from "../resource-info";

/** 定义章节 */
export class Chapter {
    bid: string         //书籍ID
    cid: string         //章节ID
    title: string       //章节标题
    wordCount: number   //字数统计
    content: string     //章节内容

    resourceInfo: ResourceInformation //资源定位
}
