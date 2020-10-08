const { expect } = require('chai')
const { RemoteResource, ResourceInformation } = require('../../bin/domain/resource-info')
const { instance: qidian } = require('../../bin/service/crawling/qidian-com')

describe("起点数据源测试", function () {
  it("测试获取书籍信息", async function () {
    const data = await qidian.search('诡秘之主')
    expect(data).to.be.an('array').that.lengthOf.above(0, "获取数据失败")
    const book = data[0]
    expect(book.name).to.equal('诡秘之主', "获取书籍名称失败")
    expect(book.author).to.equal('爱潜水的乌贼', "获取书籍作者失败")
    expect(book.detailPageInfo).have.property('data').that.is.an('string', "获取详情页信息失败")
    const detailInfo = JSON.parse(book.detailPageInfo.data)
    expect(detailInfo).has.property('qdId').that.is.an('string', "获取详情页信息失败")
    expect(book.bid).to.equal('63f44e872b6faa293ccac88c40809543')
  })

  it("测试获取书籍目录", async function () {
    const catalog = await qidian.catalog('63f44e872b6faa293ccac88c40809543', {
      source: RemoteResource.Qidian,
      data: JSON.stringify({
        name: '诡秘之主',
        author: '爱潜水的乌贼',
        qdId: '1010868264'
      })
    })
    expect(catalog).to.be.an('array', "获取书籍目录失败").that.lengthOf.above(0, "书籍目录信息为空")
  })

  it("测试获取章节内容", async function () {
    const chapter = await qidian.chapter(
      '63f44e872b6faa293ccac88c40809543',
      '72046ee64794248218b99f48725f40b9',
      new ResourceInformation(RemoteResource.Qidian, '3Q__bQt6cZEVDwQbBL_r1g2/GSlTBhSdiqP4p8iEw--PPw2')
    )
    expect(chapter.content).lengthOf.above(0, "获取章节内容失败")
  })
})