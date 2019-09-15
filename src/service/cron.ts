import { logger } from '../log/index'
import { instance as cronDao } from "../dao/cron";
import { instance as bookDao } from "../dao/book";
import { instance as bookService } from "./book";
import { UpdateStatus } from '../domain/book/book';
import { globalConfig } from '../util';
import * as util from '../util/index'

/**
 * 全局定时任务
 */
class CronService {
    /** 启用定时任务 */
    public enable() {
        let t = this._getNextCheckTime()
        logger.info("计划任务已启动，下次执行时间：" + util.formatTime(new Date(t), 'chineseFull'))
        setTimeout(() => {
            this._doCheck()
        }, t - Date.now())
    }

    //执行检查
    private async _doCheck() {
        let t = Date.now()
        await this._checkBooks()
        t = Date.now() - t
        logger.debug("定时任务执行完毕，耗时" + (t / 1000).toFixed(0) + '秒')
        setTimeout(() => {
            this._doCheck()
        }, this._getNextCheckTime() - Date.now())
    }
    //获取下次任务执行时间
    private _getNextCheckTime() {
        let t = new Date(globalConfig.cron.initialTime).getTime()
        while (t < Date.now()) { t += globalConfig.cron.checkPeriod * 1000 }
        return t
    }

    //检查书籍数据是否需要更新
    private async _checkBooks() {
        let books = cronDao.getBooksNeedUpdating()
        let updateCount = await books.count() //记录总文档数
        let updatedCount = 0    //记录已更新数
        let exceptionCount = 0  //记录异常数
        while (await books.hasNext()) {
            let oldbook = await books.next()
            const provider = bookService.getResourceProvider(oldbook.source, true)
            if (!provider) {
                logger.warn(`无效的数据源【${oldbook.source}】\nfrom 【${oldbook.name}】\nbid:${oldbook.bid}】`)
                continue
            }
            try {
                let newbook = await provider.detail(oldbook.bid, oldbook.detailPageInfo)
                //用于检查最新章节是否存在于数据库（弱检测）
                //由于获取书籍详情时不保证更新目录信息，得到的最新章节也不保证是完整的章节数据（指
                //有章节ID，因为章节ID可能需要有完整目录时才能计算）如果连续两次章节名称相同则无法
                //检测出来，但这仅仅会导致一定的更新延迟，这并非不可接受的代价（除非连续很多章节同
                //名）
                let filter: any = {
                    bid: newbook.bid,
                    source: newbook.source,
                    title: newbook.latestChapter
                }
                //完本或有新章节时更新目录
                if (newbook.status == UpdateStatus.Completed || !filter.title || !await cronDao.getChapter(filter)) {
                    logger.debug(`更新书籍目录【${newbook.name}】`)
                    let catalog = await provider.catalog(newbook.bid, newbook.catalogPageInfo ? newbook.catalogPageInfo : newbook.detailPageInfo)
                    await bookDao.updateCatalog(newbook.bid, newbook.source, catalog)
                    newbook.chapterCount = catalog.length
                }
                await bookDao.updateBook(newbook)
                ++updatedCount
            }
            catch (e) {
                logger.error(e)
                ++exceptionCount
                if (exceptionCount > 10) {
                    logger.fatal("异常过多，任务终止")
                    break
                }
                continue
            }
        }
        logger.debug(`扫描到${updateCount}条书籍记录需要更新，成功更新：${updatedCount}，产生异常：${exceptionCount}`)
        await books.close()
    }
}

export const cron = new CronService()
