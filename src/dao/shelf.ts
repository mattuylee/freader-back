import { Db } from "mongodb";

import * as util from "../util";
import { Book } from "../domain/book/book";
import { ShelfBook, ShelfBookGroup } from "../domain/book/shelf";
import { db } from "./index";

const shelfCollection = (<Db>db).collection("ubook");
const groupCollection = (<Db>db).collection("bgroup");
const bookCollection = (<Db>db).collection("book");

export class ShelfDao {
  /**
   * 获取用户书籍列表
   * @param uid 用户ID
   * @param gid 可选，分组ID
   * @param bid 可选，书籍ID
   */
  async getShelfBooks(uid: string, gid?: string, bid?: string) {
    let books = await shelfCollection
      .find<ShelfBook>(
        util.trimEntity({
          uid: uid,
          gid: gid,
          bid: bid,
        }),
        {
          projection: { _id: false },
        }
      )
      .toArray();
    books.forEach((book) => util.setPrototype(book, Book.prototype));
    return books;
  }
  /**
   * 更新或添加书架书籍
   * @param shelfBook
   */
  async updateShelfBook(shelfBook: ShelfBook) {
    const updateResult = await shelfCollection.findOneAndUpdate(
      { uid: shelfBook.uid, bid: shelfBook.bid },
      { $set: shelfBook },
      { upsert: true, returnOriginal: true }
    );
    if (updateResult.ok && !updateResult.value) {
      if (!(await bookCollection.findOne({ bid: shelfBook.bid }))) {
        await shelfCollection.deleteOne({
          uid: shelfBook.uid,
          bid: shelfBook.bid,
        });
        updateResult.ok = 0;
      } //书籍不存在
    }
    return updateResult;
  }
  /**
   * 移除书架书籍
   * @param uid 用户ID
   * @param bid 书籍ID
   */
  removeShelfBook(uid: string, bid: string) {
    return shelfCollection.deleteOne({ uid: uid, bid: bid });
  }
  //获取书架分组
  async getShelfBookGroups(uid: string, gid?: string) {
    let groups = await groupCollection
      .find<ShelfBookGroup>(
        util.trimEntity({
          uid: uid,
          gid: gid,
        }),
        {
          projection: { _id: false },
        }
      )
      .toArray();
    groups.forEach((i) => util.setPrototype(i, Book.prototype));
    return groups;
  }
  //更新书架分组
  updateShelfBookGroup(group: ShelfBookGroup, upsert: boolean) {
    const update = { $set: group };
    if (upsert) {
      update["$setOnInsert"] = { _id: util.createRandomCode(32) };
    }
    return groupCollection.findOneAndUpdate(
      { uid: group.uid, gid: group.gid },
      update,
      { upsert: true, returnOriginal: false }
    );
  }
  //删除书架分组
  async removeShelfBookGroup(uid: string, gid: string) {
    //将被删除分组的书籍移到根分组
    await shelfCollection.updateMany(
      { uid: uid, gid: gid },
      { $unset: { gid: true } }
    );
    await groupCollection.deleteOne({ uid: uid, gid: gid });
  }
  //统计用户书架分组
  countShelfBookGroup(uid: string) {
    return groupCollection.countDocuments({ uid: uid });
  }
}

export const instance = new ShelfDao();
