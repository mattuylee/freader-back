import { Db, Cursor } from "mongodb";
import { db } from '../dao/index'
import { Book, BookUpdateStatus, InfoLevels } from "../domain/book/book";
import * as util from '../util/index'
import { Chapter } from "../domain/book/chapter";

const bookCollection = (<Db>db).collection('book')
const chapterCollection = (<Db>db).collection('chapter')

/** 定时任务持久层 */
class CronDao {
    /** 获取可能需要更新数据的书籍列表 */
    getBooksNeedUpdating(): Cursor<Book> {
        return bookCollection.find<Book>({
            status: BookUpdateStatus.Serial,
            infoLevel: InfoLevels.Detail,
            lastWriteTime: { $lt: Date.now() - util.globalConfig.cron.minUpdatePeriod * 1000 }
        })
    }
    /** 获取章节 */
    getChapter(query: any) {
        return chapterCollection.findOne<Chapter>(query)
    }
}

export const instance = new CronDao()
