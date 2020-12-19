const { expect } = require("chai");
const {
  SourceLiteral,
  ResourceInformation,
} = require("../../bin/domain/resource-info");
const { instance: fqxs } = require("../../bin/service/crawling/fqxs-org");

describe("番茄小说网数据源测试", function () {
  it("测试搜索书籍", async function () {
    const data = await fqxs.search("超级");
    expect(data).to.be.an("array").that.lengthOf.above(1, "应搜索到多个结果");
  }).timeout(0);

  it("测试获取书籍信息", async function () {
    const book = await fqxs.detail(
      null,
      new ResourceInformation(SourceLiteral.FqxsOrg, "guimizhizhu")
    );
    expect(book.name).to.equal("诡秘之主", "获取书籍名称失败");
    expect(book.author).to.equal("爱潜水的乌贼", "获取书籍作者失败");
    expect(book.detailPageInfo)
      .have.property("data")
      .that.is.an("string", "获取详情页信息失败");
    expect(book.bid).to.equal(
      "63f44e872b6faa293ccac88c40809543",
      "书籍ID计算出错"
    );
  }).timeout(0);

  it("测试获取书籍目录", async function () {
    const catalog = await fqxs.catalog("63f44e872b6faa293ccac88c40809543", {
      source: SourceLiteral.FqxsOrg,
      data: "guimizhizhu",
    });
    expect(catalog)
      .to.be.an("array", "获取书籍目录失败")
      .that.lengthOf.above(0, "书籍目录信息为空");
  }).timeout(0);

  it("测试获取章节内容", async function () {
    const chapter = await fqxs.chapter(
      "63f44e872b6faa293ccac88c40809543",
      "d7418160eaaee90e70673edfb4bc3b27",
      new ResourceInformation(SourceLiteral.FqxsOrg, "89670/1024803.html")
    );
    expect(chapter.content).lengthOf.above(0, "获取章节内容失败");
  }).timeout(0);
});
