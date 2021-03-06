import * as util from "../util/index";
import { Result } from "../domain/result";
import { ShelfBook, ShelfBookGroup } from "../domain/book/shelf";
import { instance as userDao } from "../dao/user";
import { instance as shelfDao } from "../dao/shelf";

export class ShelfService {
  /**
   * 获取书架书籍列表
   * @param token 会话ID
   * @param gid 分组ID
   * @param bid 书籍ID
   */
  async getShelfBooks(token: string, gid?: string, bid?: string) {
    let user = await userDao.getUser(util.jwtTokenToUserID(token));
    if (bid) {
      gid = undefined;
    }
    let result = new Result();
    result.data = await shelfDao.getShelfBooks(user.uid, gid, bid);
    return result;
  }
  /**
   * 更新书架书籍
   * @param token 会话ID
   * @param shelf 书架书籍信息
   */
  async updateShelfBook(token: string, shelf: ShelfBook) {
    let user = await userDao.getUser(util.jwtTokenToUserID(token));
    shelf.uid = user.uid;
    let updateResult = await shelfDao.updateShelfBook(shelf);
    let result = new Result();
    if (!updateResult.ok) {
      result.code = 1;
      result.error = "修改书架书籍失败";
    }
    return result;
  }
  /**
   * 移除书架书籍
   * @param token 会话ID
   * @param bid 书籍ID
   */
  async removeShelfBook(token: string, bid: string) {
    let user = await userDao.getUser(util.jwtTokenToUserID(token));
    await shelfDao.removeShelfBook(user.uid, bid);
    return new Result();
  }
  /**
   * 获取书架书籍分组
   * @param token 会话ID
   * @param gid 分组ID
   */
  async getShelfBookGroups(token: string, gid?: string) {
    let user = await userDao.getUser(util.jwtTokenToUserID(token));
    return new Result(await shelfDao.getShelfBookGroups(user.uid, gid));
  }
  /**
   * 更新或新增书架分组
   * @param token 会话ID
   * @param group 分组信息
   */
  async updateShelfBookGroup(token: string, group: ShelfBookGroup) {
    const result = new Result();
    let user = await userDao.getUser(util.jwtTokenToUserID(token));
    group.uid = user.uid;
    const isCreate = !group.gid;
    if (!group.gid) {
      group.gid = util.createRandomCode(12);
    }
    let updateResult = await shelfDao.updateShelfBookGroup(group, isCreate);
    if (!updateResult.ok || !updateResult.value) {
      result.code = 1;
      result.error = "修改分组失败";
      return result;
    }
    if (isCreate) {
      let groupCount = await shelfDao.countShelfBookGroup(user.uid);
      if (groupCount > 100) {
        shelfDao.removeShelfBookGroup(user.uid, group.gid);
        result.code = 1;
        result.error = "分组数已达上限";
        return result;
      }
    } //新增分组，判断是否超出
    result.data = updateResult.value;
    return result;
  }
  /**
   * 移除书架分组
   * @param token 会话ID
   * @param gid 分组ID
   */
  async removeShelfBookGroup(token: string, gid: string) {
    let user = await userDao.getUser(util.jwtTokenToUserID(token));
    await shelfDao.removeShelfBookGroup(user.uid, gid);
    return new Result();
  }
}

export const instance = new ShelfService();
