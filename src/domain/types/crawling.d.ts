import { Book } from "../book/book";
import { ResourceInformation } from "../resource-info";
import { Chapter } from "../book/chapter";

/**
 * 定义远程数据提供者（数据源）接口
 * 方法中如果遇到错误应该抛出一个名称为数据源名称的异常作为错误说明，由调用者捕获。
 * 数据提供者应该保证数据的完备性，如果数据部分缺失应该抛出异常而不应该返回异常数据
 * 或者空数据，如果接口应该允许空结果，应对应的返回[]等结果而非null或undefined
 */
export interface ResourceProvider {
    /** 数据源名称 */
    name: string
    /**
     * 搜索书籍
     * @param keyword 关键词
     * @deprecated @param {number} page 页面索引
     * @return 搜索到的书籍列表。列表中的书籍仅包含基本信息，信息级别应为“搜索级”
     */
    search(keyword: string, page?: never): Promise<Book[]>
    /**
     * 获取书籍详情数据
     * @param bid 书籍ID
     * @param info 数据源自定义的资源定位信息
     * @return 书籍详细信息，信息级别为“详情级”
     */
    detail(bid: string, info: ResourceInformation): Promise<Book>
    /**
     * 获取章节列表
     * @param bid 书籍ID
     * @param info 书籍目录的资源定位信息
     */
    catalog(bid: string, info: ResourceInformation): Promise<Chapter[]>
    /**
     * 获取章节内容
     * @param bid 书籍ID
     * @param cid 章节ID
     * @param info 章节资源定位信息
     */
    chapter(bid: string, cid: string, info: ResourceInformation): Promise<Chapter>
    /**
     * 抛出异常
     * @param message 错误信息
     * @throws {ProviderError}
     */
    throwError(message: string): never
}
