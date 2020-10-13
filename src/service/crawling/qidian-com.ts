import * as cheerio from 'cheerio';
import * as superAgent from 'superagent';
import { isNumber } from 'util';
import { Book, InfoLevel, Series, SeriesBookList, SeriesSupport, SeriesType, UpdateStatus } from "../../domain/book/book";
import { Chapter } from '../../domain/book/chapter';
import { ProviderError } from '../../domain/exception';
import { SourceLiteral, ResourceInformation } from "../../domain/resource-info";
import { ResourceProvider, SeriesOptions } from "../../domain/types/crawling";
import { logger } from '../../log/index';

const UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:81.0) Gecko/20100101 Firefox/81.0'
  , recommendSupport = SeriesSupport.MultiPage | SeriesSupport.Gender
  , rankSupport = SeriesSupport.MultiPage | SeriesSupport.Gender | SeriesSupport.Category
  , categorySupport = SeriesSupport.MultiPage
    | SeriesSupport.Gender
    | SeriesSupport.Category
    | SeriesSupport.FinishState
  , recommendSerieses = [{
    id: 'bestSelllist',
    type: SeriesType.Recommand,
    name: "畅销书籍",
    more: true,
    support: recommendSupport
  }, {
    id: 'newBooklist',
    type: SeriesType.Recommand,
    name: "新书抢鲜",
    more: true,
    support: recommendSupport
  }, {
    id: 'sanjiangList',
    type: SeriesType.Recommand,
    name: "精品好书",
    support: recommendSupport
  }, {
    id: 'classiclist',
    type: SeriesType.Recommand,
    name: "经典必读",
    support: recommendSupport
  }]
  , rankSerieses = [{
    id: 'yuepiaolist',
    type: SeriesType.Rank,
    name: '风云榜',
    support: rankSupport
  }, {
    id: 'hotsaleslist',
    type: SeriesType.Rank,
    name: "畅销榜",
    support: rankSupport
  }, {
    id: 'readIndexlist',
    type: SeriesType.Rank,
    name: "阅读榜",
    support: rankSupport
  }, {
    id: 'reclist',
    type: SeriesType.Rank,
    name: '推荐榜',
    support: rankSupport
  }, {
    id: 'newfanslist',
    type: SeriesType.Rank,
    name: '涨粉榜',
    support: rankSupport
  }, {
    id: 'updatelist',
    type: SeriesType.Rank,
    name: '更新榜',
    support: rankSupport
  }, {
    id: 'newauthorlist',
    type: SeriesType.Rank,
    name: '新人榜',
    support: rankSupport
  }, {
    id: 'newbooklist',
    type: SeriesType.Rank,
    name: '新书榜',
    support: rankSupport
  }]

export class Qidian implements ResourceProvider {
  readonly name = SourceLiteral.Qidian

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
        book.status = staus === '完结' ? UpdateStatus.Finished : UpdateStatus.Serial
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
    const token = await this.getCsrfToken()
    const res = await agent.get('https://book.qidian.com/ajax/book/category').query({
      bookId: qdId,
      _csrfToken: token
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

  async serieses(options: SeriesOptions): Promise<Series[]> {
    options = options || {}
    const result: Series[] = []
    for (const seriesInfo of [...recommendSerieses, ...rankSerieses]) {
      try {
        const bookList = await this.bookList(seriesInfo.id, 1, options)
        result.push({
          id: seriesInfo.id,
          type: seriesInfo.type,
          name: seriesInfo.name,
          source: this.name,
          books: bookList.books,
          support: seriesInfo.support
        })
      }
      catch (e) {
        logger.log(e)
      }
    }
    return result
  }

  async categories(options: SeriesOptions): Promise<Series[]> {
    let gender = options && options.gender
    gender = gender === 'female' ? 'female' : 'male'
    const result: Series[] = []
      , res = await superAgent.get('https://m.qidian.com/category/' + gender)
      , $ = cheerio.load(res.text)
      , cates = $('.page .module-merge .sort-ul .sort-li .sort-li-header')
    for (const el of cates.toArray()) {
      const series: Series = {
        id: null,
        type: SeriesType.Category,
        name: $('h3', el).text().trim(),
        source: this.name,
        support: categorySupport
      }
      const id = $(el).attr('href').trim()
      series.id = id.slice(id.lastIndexOf('/') + 1)
      result.push(series)
    }
    return result
  }

  async bookList(seriesId: string, page: number, options?: SeriesOptions): Promise<SeriesBookList> {
    seriesId = String(seriesId).toLowerCase()
    options = options || {}
    const serieses = [...recommendSerieses, ...rankSerieses]
    let series = serieses.find(s => s.id.toLowerCase() === seriesId)
    if (!series && !Number.isNaN(Number(seriesId))) {
      this.throwError("书单不存在", null, this.bookList.name)
    }
    if (!series) {
      //分类
      series = {
        id: seriesId,
        type: SeriesType.Category,
        name: null,
        support: categorySupport
      }
    }
    return await this.fetchBookList(series, page, options)

  }

  private async fetchBookList(
    series: { type: SeriesType, id: string, support: number },
    page: number,
    options: SeriesOptions): Promise<SeriesBookList> {
    options = options || {}
    let url = 'https://m.qidian.com/majax/'
    switch (series.type) {
      case SeriesType.Recommand:
        url += 'recommend/' + series.id
        break
      case SeriesType.Rank:
        url += 'rank/' + series.id
        break
      case SeriesType.Category:
        url += 'category/list'
    }
    const req = superAgent.get(url)
      .query({ _csrfToken: await this.getCsrfToken() })
      .query({ pageNum: page > 0 ? page : 1 })
      .query({ gender: options.gender === 'female' ? 'female' : 'male' })
      .timeout(10000)
    if ((series.support & SeriesSupport.Category) && options.categoryId !== undefined) {
      req.query({ catId: options.categoryId })
    }
    if ((series.support & SeriesSupport.FinishState) && options.state) {
      if (options.state === 'finished') {
        req.query({ isfinish: 1 })
      }
      else if (options.state === 'serial') {
        req.query({ isfinish: 0 })
      }
    }
    const res = await req
      , bookList = JSON.parse(res.text)
      , data = bookList.data
      , records = bookList.data.records
      , result: SeriesBookList = {
        seriesId: series.id,
        isLast: !!data.isLast,
        page: +data.pageNum,
        source: this.name,
        total: +data.total,
        books: []
      }
    for (const bookInfo of records) {
      const book = new Book()
      book.name = bookInfo.bName
      book.author = bookInfo.bAuth
      book.intro = bookInfo.desc
      book.category = bookInfo.cat
      book.status = bookInfo.state === '完结' ? UpdateStatus.Finished : UpdateStatus.Serial
      book.words = bookInfo.cnt
      book.cover = `https://bookcover.yuewen.com/qdbimg/349573/${bookInfo.bid}/300`
      book.infoLevel = InfoLevel.Meta
      book.detailPageInfo = new ResourceInformation(this.name, JSON.stringify({
        name: book.name,
        author: book.author,
        qdId: bookInfo.bid
      }))
      book.makeId()
      result.books.push(book)
    }
    return result
  }


  private async getCsrfToken(): Promise<string> {
    if (Date.now() - this.csrfToken.fetchTime > 86400000 * 7) {
      //每7天重新获取csrf token
      const response = await superAgent.get('https://www.qidian.com/ajax/Help/getCode')
        , cookie = response.get('Set-Cookie').find(cookie => cookie.startsWith('_csrfToken='))
      this.csrfToken.fetchTime = Date.now()
      this.csrfToken.token = cookie.slice(cookie.indexOf('=') + 1, cookie.indexOf(';'))
    }
    return this.csrfToken.token
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