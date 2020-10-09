const { expect } = require('chai')
const { RemoteSource, ResourceInformation } = require('../../bin/domain/resource-info')
const { instance: dingdian } = require('../../bin/service/crawling/x23us-com')

describe("顶点（x23us）数据源测试", function () {
  it("测试搜索书籍", async function () {
    const data = await dingdian.search('超级')
    expect(data).to.be.an('array').that.lengthOf.above(1, "应搜索到多个结果")
  }).timeout(0)

  it("测试获取书籍信息", async function () {
    const book = await dingdian.detail('63f44e872b6faa293ccac88c40809543', new ResourceInformation(RemoteSource.X23usCom, '503/'))
    expect(book.name).to.equal('诡秘之主', "获取书籍名称失败")
    expect(book.author).to.equal('爱潜水的乌贼', "获取书籍作者失败")
    expect(book.detailPageInfo).have.property('data').that.is.an('string', "获取详情页信息失败")
    expect(book.bid).to.equal('63f44e872b6faa293ccac88c40809543')
  }).timeout(0)


  it("测试获取书籍目录", async function () {
    const catalog = await dingdian.catalog('63f44e872b6faa293ccac88c40809543', {
      source: RemoteSource.X23usCom,
      data: '503/'
    })
    expect(catalog).to.be.an('array', "获取书籍目录失败").that.lengthOf.above(0, "书籍目录信息为空")
  }).timeout(0)

  it("测试获取章节内容", async function () {
    const chapter = await dingdian.chapter(
      '63f44e872b6faa293ccac88c40809543',
      '4dc7ec75ae24572889678010ac57dc92',
      new ResourceInformation(RemoteSource.X23usCom, '503/49020.html')
    )
    expect(chapter.content).lengthOf.above(0, "获取章节内容失败")
  }).timeout(0)
})