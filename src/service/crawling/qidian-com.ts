import * as cheerio from 'cheerio';
import * as superAgent from 'superagent';
import { Book, InfoLevel, UpdateStatus } from "../../domain/book/book";
import { Chapter } from '../../domain/book/chapter';
import { ProviderError } from '../../domain/exception';
import { RemoteSource, ResourceInformation } from "../../domain/resource-info";
import { ResourceProvider } from "../../domain/types/crawling";
import { logger } from '../../log/index';

const UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:81.0) Gecko/20100101 Firefox/81.0'

export class Qidian implements ResourceProvider {
  readonly name = RemoteSource.Qidian

  private csrfToken = {
    token: null,
    fetchTime: 0
  }

  public async search(keyword: string, page?: number): Promise<Book[]> {
    page = page > 0 ? Number(page) : 1
    const response = await superAgent.get('https://www.qidian.com/search')
      .set('User-Agent', UA)
      .set('Referer', 'https://www.qidian.com/')
      .query({ page: page, kw: keyword })
      .timeout({ deadline: 30000 })
      .catch(e => { logger.error(e) }) as superAgent.Response
    this._assertResponse(response, this.search.name)
    const books: Book[] = []
      , $ = cheerio.load(response.text)
      , items = $('#result-list .book-img-text .res-book-item')
    for (const item of items.toArray()) {
      try {
        const book = new Book()
        book.cover = "https:" + $(".book-img-box img", item).attr('src').trim()
        book.name = $(".book-mid-info h4 a", item).text().trim()
        book.author = $(".book-mid-info .author img", item).next().text().trim()
        const anchors = $(".book-mid-info .author a", item)
        if (anchors.length > 1) {
          book.category = $(anchors[anchors.length - 1]).text().trim()
        }
        const staus = $(".book-mid-info .author span", item).text().trim()
        book.status = staus === '完结' ? UpdateStatus.Completed : UpdateStatus.Serial
        book.intro = $(".book-mid-info .intro", item).text().trim()
        book.words = $(".book-right-info .total p:first-of-type span", item).text().trim()
        book.latestChapter = $(".book-mid-info .update a", item).text().slice(5).trim()
        book.lastUpdateTime = $(".book-mid-info .update span", item).text().trim()
        if (!book.name || !book.author) {
          this.throwError("爬虫策略异常", "获取书籍信息失败", this.search.name)
        }
        book.bid = book.makeId()
        const detailId = $(item).attr("data-bid")
        if (!detailId) {
          this.throwError("爬虫策略异常", "获取详情页信息失败", this.search.name)
        }
        //记录书籍名称和作者，获取详情数据时爬取搜索页而不是详情页。因为详情页有字体反爬而且数据量更大
        book.detailPageInfo = new ResourceInformation(this.name, JSON.stringify({
          name: book.name,
          author: book.author,
          qdId: detailId
        }))
        //使用detailPageInfo
        book.catalogPageInfo = null
        book.source = this.name
        book.infoLevel = InfoLevel.Search
        books.push(book)
      }
      catch (e) {
        if (e instanceof ProviderError) { throw e }
        logger.error(e)
        this.throwError("爬虫策略异常", "匹配书籍信息失败", this.search.name)
      }
    }
    return books
  }

  public async detail(bid: string, info: ResourceInformation): Promise<Book> {
    let data
    try {
      data = JSON.parse(info.data)
    }
    catch {
      this.throwError("无效的数据源", "详情页数据缺失", this.detail.name)
    }
    try {
      const books = await this.search(data.name + ' ' + data.author)
        , book = books.find(b => b.bid === bid)
      book.infoLevel = InfoLevel.Detail
      return book
    }
    catch (e) {
      if (e instanceof ProviderError) {
        e.name = this.detail.name
        throw e
      }
      this.throwError("未找到相关书籍信息，请尝试重新搜索书籍", null, this.detail.name)
    }
  }

  async catalog(bid: string, info: ResourceInformation): Promise<Chapter[]> {
    let qdId
    try {
      const data = JSON.parse(info.data)
      if (!data.qdId) {
        throw null
      }
      qdId = data.qdId
    }
    catch {
      this.throwError("无效的数据源", "详情页数据缺失", this.catalog.name)
    }
    const agent = superAgent.agent()
    agent.set('User-Agent', UA)
    if (Date.now() - this.csrfToken.fetchTime > 86400000) {
      const response = await agent.get('https://www.qidian.com/ajax/Help/getCode')
        , cookie = response.get('Set-Cookie').find(cookie => cookie.startsWith('_csrfToken='))
      this.csrfToken.fetchTime = Date.now()
      this.csrfToken.token = cookie.slice(cookie.indexOf('=') + 1, cookie.indexOf(';'))
    }
    const res = await agent.get('https://book.qidian.com/ajax/book/category').query({
      bookId: qdId,
      _csrfToken: this.csrfToken.token
    }).timeout({ deadline: 30000 })
    const volumes = JSON.parse(res.text).data.vs
      , chapters: Chapter[] = []
    for (const volume of volumes) {
      if (volume.vN === '作品相关') { continue }
      for (const chapterInfo of volume.cs) {
        const chapter = new Chapter()
        chapter.bid = bid
        chapter.source = this.name
        chapter.title = chapterInfo.cN.trim()
        chapter.wordCount = chapterInfo.cnt
        chapter.isVip = !!volume.vS
        if (chapter.isVip) {
          chapter.resourceInfo = new ResourceInformation(this.name, chapterInfo.id)
          chapter.makeId()
          chapter.resourceInfo = new ResourceInformation(this.name, '_vip')
        }
        else {
          chapter.resourceInfo = new ResourceInformation(this.name, chapterInfo.cU)
          chapter.cid = chapter.makeId()
        }
        chapters.push(chapter)
      }
    }
    return chapters
  }

  async chapter(bid: string, cid: string, info: ResourceInformation): Promise<Chapter> {
    if (!info || !info.data) {
      this.throwError("无效的数据源", "章节资源路径缺失", this.chapter.name)
    }
    if (info.data === '_vip') {
      this.throwError("本章节为VIP章节")
    }
    try {
      const res = await superAgent.get('https://read.qidian.com/chapter/' + info.data).timeout({
        deadline: 30000
      })
      const $ = cheerio.load(res.text)
        , chapter = new Chapter()
      chapter.title = $("#j_chapterBox .main-text-wrap .j_chapterName").text().trim()
      chapter.wordCount = parseInt($("#j_chapterBox .main-text-wrap .j_chapterWordCut").text(), 10)
      if ($("#j_chapterBox .main-text-wrap .vip-limit-wrap").length) {
        chapter.isVip = true
      }
      else {
        chapter.content = ''
        const paragraphs = $("#j_chapterBox .main-text-wrap .read-content p").toArray()
        for (const para of paragraphs) {
          chapter.content += $(para).text().trim() + '\n'
        }
        chapter.content = chapter.content.trim()
      }
      chapter.bid = bid
      chapter.cid = cid
      chapter.resourceInfo = info
      chapter.source = this.name
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

  private _assertResponse(response: superAgent.Response, caller?: string) {
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
}

export const instance = new Qidian()