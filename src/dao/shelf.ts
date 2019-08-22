import { Db } from "mongodb";
import { db } from './index'
import { ShelfBook, ShelfBookGroup } from "../domain/book/shelf";
import * as util from "../util";
import { Book } from "../domain/book/book";

const shelfCollection = (<Db>db).collection('ubook')
const groupCollection = (<Db>db).collection('bgroup')

export class ShelfDao {
    /**
     * 获取用户书籍列表
     * @param uid 用户ID
     * @param gid 可选，分组ID
     * @param bid 可选，书籍ID
     */
    async getShelfBooks(uid: string, gid?: string, bid?: string) {
        let books = await shelfCollection.find<ShelfBook>(util.trimEntity({
            uid: uid,
            gid: gid,
            bid: bid
        })).toArray()
        books.forEach(book => util.setPrototype(book, Book.prototype))
        return books
    }
    /**
     * 更新或添加书架书籍
     * @param shelfBook 
     */
    async updateShelfBook(shelfBook: ShelfBook) {
        return await shelfCollection.updateOne(
            { uid: shelfBook.uid, bid: shelfBook.bid },
            { $set: shelfBook },
            { upsert: true })
    }
    /**
     * 移除书架书籍
     * @param uid 用户ID
     * @param bid 书籍ID
     */
    removeShelfBook(uid: string, bid: string) {
        return shelfCollection.deleteOne({ uid: uid, bid: bid })
    }
    //获取书架分组
    async getShelfBookGroups(uid: string, gid?: string) {
        let groups = await groupCollection.find<ShelfBookGroup>(util.trimEntity({
            uid: uid,
            gid: gid
        })).toArray()
        groups.forEach(group => util.setPrototype(group, Book.prototype))
        return groups
    }
    //更新书架分组
    updateShelfBookGroup(group: ShelfBookGroup) {
        return groupCollection.updateOne(
            { uid: group.uid, bid: group.gid },
            { $set: group },
            { upsert: true })
    }
    //删除书架分组
    removeShelfBookGroup(uid: string, gid: string) {
        return groupCollection.deleteOne({ uid: uid, gid: gid })
    }
    //统计用户书架分组
    countShelfBookGroup(uid: string) {
        return groupCollection.countDocuments({ uid: uid })
    }
}


export const instance = new ShelfDao()