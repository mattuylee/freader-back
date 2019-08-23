import { Result } from "../domain/result";
import { instance as bookDao } from "../dao/book";
import { RemoteResources } from "../domain/resource-info";
import { instance as x23usComProvider } from "./crawling/x23us-com";
import { ResourceProvider } from "../domain/types/crawling";
import { Book, InfoLevels } from "../domain/book/book";
import { logger } from '../log/index'
import { Chapter } from "../domain/book/chapter";

/**
 * 处理数据源抛出的异常。如果错误是数据源主动抛出（Error.name等于数据源的名称）则打印错
 * 误，否则重新抛出异常
 * @param e 错误
 * @param providerName 数据源名称
 */
function handleError(e: Error, providerName: string) {
    if (e && e.name != providerName) { throw e }
    else { logger.error(e) }
}

export class BookService {
    /**
     * 搜索书籍
     * @param source 数据源 
     * @param keyword 关键词
     * @param page 可选，页数索引，从0开始，默认为0
     */
    async search(source: string, keyword: string, page?: number) {
        const provider = this.getResourceProvider(source)
        let result = new Result<Book[]>()
        try {
            let books = await provider.search(keyword)
            result.data = books
            if (books) {
                for (let book of books) { await bookDao.updateBook(book) }
            }
        }
        catch (e) {            
            handleError(e, provider.name)
            result.error = e.message
        }
        return result
    }
    /**
     * 获取书籍详情信息
     * @param source 数据源
     * @param bid 书籍ID
     */
    async getBook(source: string, bid: string) {
        const provider = this.getResourceProvider(source)
        source = provider.name
        let book = await bookDao.getBook(bid, source)
        let result = new Result()
        if (!book) {
            result.code = 404
            result.error = '书籍不存在'
            return result
        }
        if (InfoLevels.enough(book.infoLevel, InfoLevels.Detail)) {
            result.data = book
            return result
        }
        //从远程数据源获取最新数据
        try {
            book = await provider.detail(bid, book.detailPageInfo)
            await bookDao.updateBook(book)
            result.data = book
        }
        catch(e) {
            handleError(e, provider.name)
            result.error = e.message
        }
        return result
    }
    /**
     * 获取书籍章节列表（不含章节内容）
     * @param source 数据源
     * @param bid 书籍ID
     */
    async getCatalog(source: string, bid: string) {
        const provider = this.getResourceProvider(source)
        source = provider.name
        let catalog = await bookDao.getCatalog(bid, source)
        if (catalog && catalog.length) {
            return new Result(catalog)
        }
        let result = new Result<Chapter[]>()
        const book = await bookDao.getBook(bid, source)
        if (!book) {
            result.code = 404
            result.error = '书籍不存在'
            return result
        }
        try {
            catalog = await provider.catalog(bid, book.catalogPageInfo ? book.catalogPageInfo : book.detailPageInfo) 
            await bookDao.updateCatalog(bid, catalog)
            result.data = catalog
        }
        catch(e) {
            handleError(e, provider.name)
            result.error = e.message
        }
        return result
    }
    /**
     * 获取章节
     * @param source 数据源
     * @param cid 章节ID
     * @param bid 书籍ID
     */
    async getChapter(source: string, cid: string, bid?: string) {
        const provider = this.getResourceProvider(source)
        source = provider.name
        let result = new Result()
        let chapter = await bookDao.getChapter(cid, bid, source)
        if (!chapter) {
            result.code = 404
            result.error = '章节不存在'
            return result
        }
        if (chapter.content) {
            //如果有章节内容数据直接返回
            result.data = chapter
            return result
        }
        try {
            chapter = await provider.chapter(chapter.bid, chapter.resourceInfo)
            await bookDao.updateChapter(chapter)
            result.data = chapter
        }
        catch (e) {
            handleError(e, provider.name)
            result.error = e.message
        }
        return result
    }

    //获取数据提供者（数据源）
    private getResourceProvider(source: string): ResourceProvider {
        switch (String(source).toLowerCase()) {
            default:
            case RemoteResources.X23usCom:
            return x23usComProvider
        }
    }
}


export const instance = new BookService()