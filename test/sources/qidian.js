const { expect } = require("chai");
const {
  SourceLiteral,
  ResourceInformation,
} = require("../../bin/domain/resource-info");
const { instance: qidian } = require("../../bin/service/crawling/qidian-com");

describe("起点数据源测试", function () {
  it("测试获取书籍信息", async function () {
    const data = await qidian.search("诡秘之主");
    expect(data).to.be.an("array").that.lengthOf.above(0, "获取数据失败");
    const book = data[0];
    expect(book.name).to.equal("诡秘之主", "获取书籍名称失败");
    expect(book.author).to.equal("爱潜水的乌贼", "获取书籍作者失败");
    expect(book.detailPageInfo)
      .have.property("data")
      .that.is.an("string", "获取详情页信息失败");
    const detailInfo = JSON.parse(book.detailPageInfo.data);
    expect(detailInfo)
      .has.property("qdId")
      .that.is.an("string", "获取详情页信息失败");
    expect(book.bid).to.equal("63f44e872b6faa293ccac88c40809543");
  }).timeout(10000);

  it("测试获取书籍目录", async function () {
    const catalog = await qidian.catalog("83e1bba9754905d8df9b8041f15a0bd7", {
      source: SourceLiteral.Qidian,
      data: JSON.stringify({
        name: "超神机械师",
        author: "齐佩甲",
        qdId: "1009480992",
      }),
    });
    expect(catalog)
      .to.be.an("array", "获取书籍目录失败")
      .that.lengthOf.above(0, "书籍目录信息为空");
  }).timeout(10000);

  it("测试获取章节内容", async function () {
    const chapter = await qidian.chapter(
      "63f44e872b6faa293ccac88c40809543",
      "72046ee64794248218b99f48725f40b9",
      new ResourceInformation(
        SourceLiteral.Qidian,
        "3Q__bQt6cZEVDwQbBL_r1g2/GSlTBhSdiqP4p8iEw--PPw2"
      )
    );
    expect(chapter.content).lengthOf.above(0, "获取章节内容失败");
  }).timeout(10000);

  it("测试获取书单列表", async function () {
    const series = await qidian.serieses("male");
    expect(series).to.be.an("array").that.length.above(0, "获取书单失败");
    expect(series[0])
      .have.property("books")
      .that.is.an("array")
      .that.length.above(0);
  }).timeout(10000);

  it("测试获取书单书籍", async function () {
    const bookList = await qidian.bookList("bestSelllist", 2, "male");
    expect(bookList).to.be.an("object", "获取书籍列表失败");
    expect(bookList).to.have.property("seriesId", "bestSelllist");
    expect(bookList).to.have.property("page", 2);
    expect(bookList)
      .have.property("books")
      .that.is.an("array")
      .that.length.above(0);
  }).timeout(10000);

  it("测试获取分类", async function () {
    const cateMale = await qidian.categories({ gender: "male" }),
      cateFemale = await qidian.categories({ gender: "female" });
    expect(cateMale).to.be.an("array").that.has.length.above(0);
    expect(cateFemale).to.be.an("array").that.has.length.above(0);
    expect(JSON.stringify(cateMale)).to.not.equal(JSON.stringify(cateFemale));
  }).timeout(10000);
});
