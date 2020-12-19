import { strict } from "assert";
import * as cheerio from "cheerio";
import * as fs from "fs";
import { stringify } from "querystring";
import * as superAgent from "superagent";
import { Book, InfoLevel, UpdateStatus } from "../../domain/book/book";
import { Chapter } from "../../domain/book/chapter";
import { ResourceInformation, SourceLiteral } from "../../domain/resource-info";
import { ResourceProvider } from "../../domain/types/crawling";
import { logger } from "../../log/index";
import { instance as noopProvider } from "./noop";

// 西红柿小说网 - fqxs.org
export class FqxsOrg implements ResourceProvider {
  readonly name = SourceLiteral.FqxsOrg;

  async search(keyword: string, _: never) {
    const response = (await superAgent
      .post("http://www.fqxs.org/modules/article/search.php")
      .timeout({ response: 20000, deadline: 60000 })
      .set("Content-Type", "application/x-www-form-urlencoded")
      .send({ keyword })
      .catch((e) => logger.error(e && e.message))) as superAgent.Response;
    if (!response.ok || !response.text) {
      this.throwError("数据源异常", "请求失败", "search");
    }
    const $ = cheerio.load(response.text),
      bookListEls = $("#main ul li"),
      books: Book[] = [];
    if (bookListEls.length === 0) {
      this.throwError("爬虫策略异常", "匹配搜索结果失败", this.search.name);
    }
    const bookEls = bookListEls.toArray();
    // 去除表头
    bookEls.shift();
    const bookInfoArray: { name: string; info: string }[] = [];
    for (const bookEl of bookEls) {
      const name = $("span:nth-of-type(1) a", bookEl).text().trim();
      const url = $("span:nth-of-type(1) a", bookEl).attr("href"),
        match = /^http:\/\/www\.fqxs\.org\/book\/([\-a-z0-9]+)\/?/.exec(url);
      if (!match || !match[1]) {
        continue;
      }
      bookInfoArray.push({ name, info: match[1] });
    }
    const bookInfos = bookInfoArray
      .sort((a, b) => {
        const objs = [a, b],
          results = [0, 0];
        for (let i = 0; i < objs.length; i++) {
          const obj = objs[i];
          if (obj.name.startsWith(keyword)) {
            results[i] += 10000;
          }
          if (obj.name.endsWith(keyword)) {
            results[i] += 1000;
          }
          const index = obj.name.indexOf(keyword);
          // 位置越靠前越好，但不包含不好
          results[i] = index >= 0 ? results[i] - index : -results[i];
        }
        return results[0] - results[1];
      })
      .slice(0, 6);
    for (const e of bookInfos) {
      const info = new ResourceInformation(this.name, e.info);
      const book = await this.detail(null, info);
      book.infoLevel = InfoLevel.Search;
      books.push(book);
    }
    return books;
  }

  async detail(bid: string, info: ResourceInformation) {
    if (!info || info.source !== this.name) {
      this.throwError("无效的数据源");
    }
    const response = (await superAgent
      .get("http://m.fqxs.org/book/" + info.data)
      .timeout({ response: 20000, deadline: 60000 })) as superAgent.Response;
    if (!response.ok || !response.text) {
      this.throwError("数据源异常", "请求失败", "detail");
    }
    const $ = cheerio.load(response.text),
      bookEl = $("body > .cover"),
      book = new Book();
    book.cover = $(".block .block_img2 img", bookEl).attr("src").trim();
    book.name = $(".block .block_txt2 h2", bookEl).text().trim();
    book.author = $(".block .block_txt2 p:first-of-type", bookEl).text().trim();
    book.author = book.author.replace("作者：", "");
    book.category = $(".block .block_txt2 p:nth-of-type(2)", bookEl)
      .text()
      .trim()
      .replace("分类：", "");
    book.status = $(".block .block_txt2 p:nth-of-type(3)", bookEl)
      .text()
      .includes("完结")
      ? UpdateStatus.Finished
      : UpdateStatus.Serial;
    book.infoLevel = InfoLevel.Detail;
    const lastUpdateTime = $(".block .block_txt2 p:nth-of-type(4)", bookEl)
      .text()
      .trim();
    book.lastUpdateTime = lastUpdateTime.replace("更新：", "").trim();
    book.latestChapter = $(".block .block_txt2 p:nth-of-type(5)", bookEl)
      .text()
      .replace("最新：", "")
      .trim();
    book.intro = $(".intro_info", bookEl).text().trim();
    book.detailPageInfo = info;
    book.infoLevel = InfoLevel.Detail;
    book.source = this.name;
    if (!book.name || !book.author) {
      this.throwError("爬虫策略异常", "匹配书籍信息失败", this.detail.name);
    }
    book.bid = bid ? bid : book.makeId();
    return book;
  }

  async catalog(bid: string, info: ResourceInformation) {
    if (!info || info.source !== this.name) {
      this.throwError("无效的数据源");
    }
    const response = (await superAgent
      .get("http://m.fqxs.org/book/" + info.data + "/all.html")
      .timeout({ response: 20000, deadline: 60000 })) as superAgent.Response;
    if (!response.ok || !response.text) {
      this.throwError("数据源异常", "请求失败", "catelog");
    }
    const $ = cheerio.load(response.text);
    const chapterEls = $("body .cover ul li").toArray();
    if (!chapterEls.length) {
      this.throwError("爬虫策略异常", "无章节信息", this.catalog.name);
    }
    const chapters: Chapter[] = [];
    for (const chapterEl of chapterEls) {
      const chapter = new Chapter();
      chapter.bid = bid;
      chapter.source = this.name;
      chapter.title = $(chapterEl).text().trim();
      const href = $("a", chapterEl).attr("href").trim();
      chapter.resourceInfo = new ResourceInformation(
        this.name,
        href.slice(href.lastIndexOf("/html/") + 6)
      );
      chapter.makeId();
      chapters.push(chapter);
    }
    return chapters;
  }

  async chapter(bid: string, cid: string, info: ResourceInformation) {
    const response = (await superAgent
      .get("http://m.fqxs.org/html/" + info.data)
      .timeout(30000)) as superAgent.Response;
    if (!response.ok || !response.text) {
      this.throwError("数据源异常", "请求失败", "chapter");
    }
    try {
      const $ = cheerio.load(response.text),
        paraEls = $("#nr #nr1 p").toArray(),
        paras: string[] = [];
      for (const el of paraEls) {
        paras.push($(el).text().trim());
      }
      let chapter = new Chapter();
      chapter.cid = cid;
      chapter.bid = bid;
      chapter.title = $("#nr_title").text().trim();
      chapter.source = this.name;
      chapter.resourceInfo = info;
      chapter.content = paras.join("\n");
      return chapter;
    } catch {
      this.throwError("爬虫策略异常", "匹配章节内容失败", this.chapter.name);
    }
  }

  async categories(..._) {
    this.throwError("该数据源不支持分类");
    return null;
  }
  async serieses(..._) {
    this.throwError("该数据源不支持推荐");
    return null;
  }
  async bookList(..._) {
    this.throwError("该数据源不支持书单");
    return null;
  }

  throwError(message: string, detail?: string, caller?: string): never {
    try {
      noopProvider.throwError(message, detail, caller);
    } catch (e) {
      e.stack = `@ResourceProvider: ${this.name}\n@${__filename}`;
      throw e;
    }
    throw null;
  }
}

export const instance = new FqxsOrg();
