import { Db } from "mongodb";
import { db } from './index'
import { ShelfBook, ShelfBookGroup } from "../domain/book/shelf";
import { entityTrimer } from "../util";

const shelfCollection = (<Db>db).collection('ubook')
const groupCollection = (<Db>db).collection('bgroup')

export class ShelfDao {
    /**
     * 获取用户书籍列表
     * @param uid 用户ID
     * @param gid 可选，分组ID
     * @param bid 可选，书籍ID
     */
    getShelfBooks(uid: string, gid?: string, bid?: string) {
        return shelfCollection.find<ShelfBook>(entityTrimer.trim({
            uid: uid,
            gid: gid,
            bid: bid
        })).toArray()
    }
    /**
     * 更新或添加书架书籍
     * @param shelfBook 
     */
    updateShelfBook(shelfBook: ShelfBook) {
        return shelfCollection.updateOne(
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
    getShelfBookGroups(uid: string, gid?: string) {
        return groupCollection.find<ShelfBookGroup>(entityTrimer.trim({
            uid: uid,
            gid: gid
        })).toArray()
    }
    //更新书架分组
    updateShelfBookGroup(group: ShelfBookGroup) {
        return shelfCollection.updateOne(
            { uid: group.uid, bid: group.gid },
            { $set: group },
            { upsert: true })
    }
    //删除书架分组
    removeShelfBookGroup(uid: string, gid: string) {
        return shelfCollection.deleteOne({ uid: uid, gid: gid })
    }
}


export const instance = new ShelfDao()