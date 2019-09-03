import path = require('path')
import cheerio = require('cheerio')
import * as superAgent from 'superagent'
import * as iconv from 'iconv-lite'
import { logger } from '../../log/index'
import { ResourceProvider } from "../../domain/types/crawling";
import { ResourceInformation, RemoteResource } from "../../domain/resource-info";
import { Book, InfoLevel, UpdateStatus } from "../../domain/book/book";
import { ProviderError } from '../../domain/exception';
import * as util from '../../util/index'
import { Chapter } from '../../domain/book/chapter';

//add request.Request.prototype.charset
require('superagent-charset')(superAgent)

const base = "https://www.x23us.com"

export class X23usCom implements ResourceProvider {
    readonly name = RemoteResource.X23usCom
    //搜索
    async search(keyword: string, _: never) {
        //关键词转gbk
        let kw = ''
        iconv.encode(keyword, 'gbk').forEach(i => {
            if (i > 127) { kw += '%' + i.toString(16) }
            else { kw += String.fromCharCode(i) }
        })
        let response: superAgent.Response = (await superAgent.get("https://www.x23us.com/modules/article/search.php").timeout({
            deadline: 12000
        }).buffer(true)['charset']('gbk').query('searchtype=keywords&searchkey=' + kw).catch(e => {
            logger.error(e)
        })) as superAgent.Response
        //检查是否正确响应
        this._assertResponse(response, this.search.name)
        let detailPagePrefix = "https://www.x23us.com/book/"
        if (String(response.redirects[0]).startsWith(detailPagePrefix)) {
            //如果是否单一结果（请求被重定向到到详情页）则直接调用相关接口
            let book = await this.detail(null, {
                source: this.name,
                data: response.redirects[0].slice(detailPagePrefix.length)
            })
            if (!book) {
                this.throwError("获取书籍信息失败", "detail函数返回了空值", this.search.name)
            }
            return [book]
        }
        let books: Book[] = []
        let $ = cheerio.load(response.text)
        let res = $('.bdsub #content table tr .odd a')
        //最多返回6个结果
        for (let el of res.toArray().slice(0, 6)) {
            let href = el.attribs['href']
            if (!href || !href.startsWith(detailPagePrefix)) {
                logger.warn(`@ResourceProvider: ${this.name}: `, "爬虫策略异常，匹配搜索结果失败")
                continue
            }
            let detailInfo = new ResourceInformation()
            detailInfo.source = this.name
            detailInfo.data = href.slice(detailPagePrefix.length)
            let book = await this.detail(null, detailInfo)
            book.infoLevel = InfoLevel.Search
            books.push(book)
        }
        if (res.length && !books.length) {
            this.throwError("爬虫策略异常", "匹配搜索结果失败", this.search.name)
        }
        return books
    }
    //书籍详情。内部允许bid为空
    async detail(bid: string, info: ResourceInformation) {
        if (!info || info.source != this.name) {
            this.throwError("无效的数据源")
            return
        }
        let response = await superAgent.get(base + path.posix.join('/book/', info.data)).timeout({
            deadline: 10000
        }).buffer(true)['charset']('gbk').catch(e => logger.error(e)) as superAgent.Response
        this._assertResponse(response, this.detail.name)
        const $ = cheerio.load(response.text)
        const context = $('.bdsub #content')
        if (!context.length) {
            this.throwError("爬虫策略异常", "匹配书籍详情页面失败", this.detail.name)
        }
        let book = new Book()
        try {
            //书籍名称
            let name = $('h1', context).text().trim()
            if (!name.endsWith('全文阅读')) {
                this.throwError("爬虫策略异常", "匹配书籍名称失败", this.detail.name)
            }
            book.name = name.slice(0, name.lastIndexOf('全文阅读')).trim()
            //书籍数据表格
            let trs = $('#at tr', context).toArray()
            if (trs.length !== 4 || trs.some(el => $('th', el).length != 3)) {
                this.throwError("爬虫策略异常", "匹配属性表格失败", this.detail.name)
            }
            if ($('th:nth-of-type(2)', trs[0]).text() != '文章作者') {
                this.throwError("爬虫策略异常", "匹配书籍作者失败", this.detail.name)
            }
            book.category = $('td:nth-of-type(1)', trs[0]).text().trim()
            book.author = $('td:nth-of-type(2)', trs[0]).text().trim()
            if ($('td:nth-of-type(2)', trs[0]).text().trim() == '已完成') {
                book.status = UpdateStatus.Completed
            }
            else { book.status = UpdateStatus.Serial }
            book.lastUpdateTime = $('td:nth-of-type(3)', trs[1]).text().trim()
            book.cover = $('.fl a.hst img', context).attr('src').trim()
            if (book.cover.startsWith('/')) { book.cover = base + book.cover }
            book.intro = $('dd:nth-of-type(4) p:nth-of-type(2)', context).text().trim()
            book.latestChapter = $('dd:nth-of-type(4) p:nth-last-of-type(2) a', context).first().text().trim()
            let catalogUrl = $('dd .fl .btnlinks a.read').first().attr('href')
            let prefix = base + '/html'
            if (!catalogUrl.startsWith(prefix)) {
                this.throwError("爬虫策略异常", "匹配书籍目录页信息失败", this.detail.name)
            }
            book.catalogPageInfo = new ResourceInformation()
            book.catalogPageInfo.source = this.name
            book.catalogPageInfo.data = catalogUrl.slice(prefix.length)
            book.detailPageInfo = info
            book.source = this.name
            book.infoLevel = InfoLevel.Detail
            if (bid) { book.bid = bid }
            else { book.makeId() }
        }
        catch (e) {
            if (e instanceof ProviderError) { throw e }
            logger.error(e)
            this.throwError("爬虫策略异常", "匹配书籍信息失败", this.detail.name)
        }
        return book
    }
    async catalog(bid: string, info: ResourceInformation) {
        let response = await superAgent.get(base + path.posix.join('/html/', info.data)).timeout({
            deadline: 12000
        }).buffer(true)['charset']('gbk').catch(e => logger.error(e)) as superAgent.Response
        this._assertResponse(response, this.catalog.name)
        let chapters: Chapter[] = []
        try {
            const $ = cheerio.load(response.text)
            let chpaterEls = $('#at td a').toArray()
            if (!chpaterEls.length) {
                this.throwError("爬虫策略异常", "无章节信息", this.catalog.name)
            }
            for (let chapterEl of chpaterEls) {
                let chapter = new Chapter()
                chapter.bid = bid
                chapter.source = this.name
                chapter.title = $(chapterEl).text().trim()
                chapter.resourceInfo = new ResourceInformation()
                chapter.resourceInfo.source = this.name
                chapter.resourceInfo.data = path.posix.join(info.data, chapterEl.attribs.href.trim())
                chapter.makeId()
                chapters.push(chapter)
            }
        }
        catch (e) {
            if (e instanceof ProviderError) { throw e }
            logger.error(e)
            this.throwError("爬虫策略异常", "匹配章节目录失败", this.catalog.name)
        }
        return chapters
    }
    async chapter(bid: string, cid: string, info: ResourceInformation) {
        let response = await superAgent.get(base + path.posix.join('/html/', info.data)).timeout({
            deadline: 12000
        }).buffer(true)['charset']('gbk').catch(e => logger.error(e)) as superAgent.Response
        this._assertResponse(response, this.chapter.name)
        try {
            const $ = cheerio.load(response.text)
            let paras = $('#contents').text().trim().split('    ')
            for (let i in paras) { paras[i] = paras[i].trim() }
            let chapter = new Chapter()
            chapter.cid = cid
            chapter.bid = bid
            chapter.source = this.name
            chapter.resourceInfo = info
            chapter.content = paras.join('\n')
            return chapter
        }
        catch (e) {
            if (e instanceof ProviderError) { throw e }
            logger.error(e)
            this.throwError("爬虫策略异常", "匹配章节内容失败", this.chapter.name)
        }
    }

    throwError(message: string, detail?: string, caller?: string): never {
        let error = new ProviderError()
        error.name = this.name
        error.message = message
        error.stack = `@ResourceProvider: ${this.name}\n@${__filename}`
        if (detail) { error.detail = detail }
        if (caller) {
            error.stack = `@${caller}` + error.stack
        }
        throw error
    }

    /**
     * @private 判断请求响应是否正常，异常时抛出异常
     * @param response 响应体
     * @param caller 调用者
     * @throws {Error}
     */
    _assertResponse(response: superAgent.Response, caller?: string) {
        if (!response) {
            this.throwError("数据源异常", null, caller)
        }
        else if (!response.ok) {
            this.throwError("数据源请求异常", `请求返回了异常的响应代码：${response.status}`, caller)
        }
        else if (!response.text) {
            this.throwError("数据源请求异常", "服务器返回了空响应体", caller)
        }
    }
    //将字数转化为更易读的形式
    _humanizeWordCount(count: number): string {
        if (count <= 10000) {
            return count + '字'
        }
        count /= 10000
        let words: string
        if (count < 10) { words = count.toFixed(1).toString() }
        else { words = count.toFixed(0).toString() }
        while (/\.0*$/.test(words)) {
            words = words.slice(0, words.length - 1)
        }
        return words + '万字'
    }
}

export const instance = new X23usCom()