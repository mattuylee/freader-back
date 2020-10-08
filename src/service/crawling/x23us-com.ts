import * as iconv from 'iconv-lite';
import * as superAgent from 'superagent';
import cheerio = require('cheerio');
import * as path from 'path';
import { Book, InfoLevel, UpdateStatus } from "../../domain/book/book";
import { Chapter } from '../../domain/book/chapter';
import { ProviderError } from '../../domain/exception';
import { ResourceInformation, RemoteResource } from "../../domain/resource-info";
import { ResourceProvider } from "../../domain/types/crawling";
import { logger } from '../../log/index';

//add request.Request.prototype.charset
require('superagent-charset')(superAgent)

const base = "https://www.230book.com"

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
    const response = (await superAgent.post(base + "/modules/article/search.php")
      .type('form')
      .timeout({ deadline: 30000 })
      .send({
        searchtype: 'articlename',
        searchkey: kw
      })
      //顶点小说网的搜索关键词必须按照gbk编码转义
      //我们自己序列化好了，重写superAgent的序列化函数
      .serialize(obj => {
        let param = ''
        for (const key in obj) {
          param += `${param ? '&' : ''}${key}=${obj[key]}`
        }
        return param
      })
      .buffer(true)['charset']('gbk')
      .catch(e => logger.error(e))) as superAgent.Response
    //检查是否正确响应
    this._assertResponse(response, this.search.name)
    let detailPagePrefix = base + "/book/"
    if (String(response.redirects[0]).startsWith(detailPagePrefix)) {
      //如果是单一结果（请求被重定向到到详情页）则直接调用相关接口
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
    let res = $('#main #content table tr .odd a')
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
    }
    let response = await superAgent.get(base + path.posix.join('/book/', info.data))
      .timeout({ deadline: 30000 })
      .buffer(true)['charset']('gbk')
      .catch(e => logger.error(e)) as superAgent.Response
    this._assertResponse(response, this.detail.name)
    const $ = cheerio.load(response.text)
    let book = new Book()
    try {
      const mainInfo = $('#wrapper .box_con')
      book.name = $('#maininfo h1', mainInfo).first().text().trim()
      const topText = $('.con_top', mainInfo).text()
      let firstStop = topText.indexOf('>')
        , lastStop = topText.indexOf('>', firstStop + 1)
      book.category = topText.slice(firstStop + 1, lastStop).trim()
      const authorText = $('#maininfo #info p:first-of-type', mainInfo).text()
      book.author = authorText.slice(authorText.indexOf('：') + 1).trim()
      //数据源连载状态有问题，全都是连载中
      book.status = UpdateStatus.Serial
      const updateTimeText = $('#maininfo #info p:nth-of-type(3)', mainInfo).text()
      firstStop = updateTimeText.indexOf('：')
      lastStop = updateTimeText.indexOf(' ', firstStop)
      book.lastUpdateTime = updateTimeText.slice(firstStop + 1, lastStop).trim()
      book.latestChapter = $('#maininfo #info p:nth-of-type(4) a', mainInfo).text().trim()
      book.words = null
      book.cover = base + $('#sidebar #fmimg img', mainInfo).attr('src').trim()
      book.intro = $('#maininfo #intro p', mainInfo).text().trim().split(/\s\s+/).join('\n')
      book.detailPageInfo = info
      book.catalogPageInfo = null
      book.source = this.name
      book.infoLevel = InfoLevel.Detail
      book.bid = bid ? bid : book.makeId()
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
      deadline: 30000
    }).buffer(true)['charset']('gbk').catch(e => logger.error(e)) as superAgent.Response
    this._assertResponse(response, this.catalog.name)
    let chapters: Chapter[] = []
    try {
      const $ = cheerio.load(response.text)
      let chpaterEls = $('#at td a').toArray()
      if (!chpaterEls.length) {
        this.throwError("爬虫策略异常", "无章节信息", this.catalog.name)
      }
      chpaterEls.forEach((chapterEl, index) => {
        let chapter = new Chapter()
        chapter.bid = bid
        chapter.source = this.name
        chapter.title = $(chapterEl).text().trim()
        chapter.resourceInfo = new ResourceInformation()
        chapter.resourceInfo.source = this.name
        chapter.resourceInfo.data = path.posix.join(info.data, chapterEl.attribs.href.trim())
        chapter.makeId()
        chapters.push(chapter)
      })
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
      deadline: 30000
    }).buffer(true)['charset']('gbk').catch(e => logger.error(e)) as superAgent.Response
    this._assertResponse(response, this.chapter.name)
    try {
      const $ = cheerio.load(response.text)
      let paras = $('#contents').text().trim().split('    ')
      for (let i in paras) { paras[i] = paras[i].trim() }
      let chapter = new Chapter()
      chapter.cid = cid
      chapter.bid = bid
      chapter.title = $('h1').text().trim()
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
  //将字数转化为更易读的形式
  private _humanizeWordCount(count: number): string {
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