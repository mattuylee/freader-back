import { Db, Cursor } from "mongodb";
import { db } from '../dao/index'
import { Book, InfoLevel } from "../domain/book/book";
import { Chapter } from "../domain/book/chapter";
import * as util from '../util/index'

const bookCollection = (<Db>db).collection('book')
const chapterCollection = (<Db>db).collection('chapter')

export class BookDao {
    /**
     * 获取书籍
     * @param bid 书籍ID
     * @param source 数据源，可选，如果未提供则默认为所有数据源
     */
    async getBook(bid: string, source?: string): Promise<Book> {
        let book = await bookCollection.findOne(util.trimEntity({ source: source, bid: bid }), {
            projection: { _id: false }
        })
        return util.setPrototype(book, Book.prototype)
    }
    /**
     * 更新书籍数据
     * @param book 要更新的书籍数据
     */
    updateBook(book: Book) {
        if (!book) { return }
        let update = { $set: util.trimEntity(book, [undefined, null, '']) }
        let updatesOnInsert: any = {}
        if (!util.isInfoLevelEnough(book.infoLevel, InfoLevel.Detail)) {
            //如果信息丰富级别低于“详情”级别，仅插入新文档时插入信息级别，防止信息级别回退
            updatesOnInsert.infoLevel = book.infoLevel
            delete book.infoLevel
            update['$setOnInsert'] = updatesOnInsert
        }
        book.lastWriteTime = Date.now()
        return bookCollection.updateOne({ bid: book.bid, source: book.source }, update, { upsert: true })
    }
    /**
     * 获取章节列表
     * @param bid 书籍ID
     * @param source 数据源
     */
    async getCatalog(bid: string, source?: string): Promise<Chapter[]> {
        let chapters = await chapterCollection.find(util.trimEntity({ bid: bid, source: source }), {
            projection: { _id: false, content: false }
        }).toArray()
        chapters.forEach(c => util.setPrototype(c, Chapter.prototype))
        return chapters
    }
    /**
     * 更新章节目录。注意，已存在的章节不会被更新
     * @param bid 书籍ID
     * @param source 数据源
     * @param catalog 书籍目录（正序）
     */
    async updateCatalog(bid: string, source: string, catalog: Chapter[]) {
        if (!catalog || !catalog.length) { return }
        let chapters = await chapterCollection.find({ bid: bid, source: source }, {
            sort: { cid: -1 },
            projection: { cid: true }
        }).toArray()
        chapters = chapters.map(c => c.cid)
        let inserts = []
        catalog.forEach((c, i) => {
            //预测章节位置并对比，不相等再查找
            if (c.cid != chapters[chapters.length - i - 1] && !chapters.includes(c.cid)) {
                inserts.push(c)
            }
        })
        if (!inserts.length) { return }
        await chapterCollection.insertMany(inserts, { ordered: false })
    }
    /**
     * 获取章节信息
     * @param cid 章节ID
     * @param bid 书籍ID，可选
     * @param source 数据源，可选
     */
    async getChapter(cid: string, bid: string, source: string): Promise<Chapter> {
        let chapter = await chapterCollection.findOne(util.trimEntity(
            { cid: cid, bid: bid, source: source }),
            { projection: { _id: false } })
        return util.setPrototype(chapter, Chapter.prototype)
    }
    /**
     * 更新章节数据
     * @param chapter 章节
     */
    updateChapter(chapter: Chapter) {
        if (!chapter) { return }
        return chapterCollection.updateOne(
            { cid: chapter.cid, bid: chapter.bid, source: chapter.source },
            { $set: chapter })
    }
}

export const instance = new BookDao()
