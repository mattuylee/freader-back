import { Db } from "mongodb";
import { UserConfig } from "../domain/config";
import { User } from "../domain/user";
import * as util from "../util/index";
import { db } from "./index";

const userCollection = (<Db>db).collection("user");
const configCollection = (<Db>db).collection("uconfig");

/**
 * 暴露账户相关的持久层接口
 */
export class UserDao {
  /**
   * 更新加密salt
   * @param uid 用户ID
   * @returns 新salt
   */
  async updateSalt(uid: string): Promise<boolean> {
    const salt = util.createRandomCode(32);
    const res = await userCollection.updateOne(
      { uid: uid },
      { $set: { salt: salt } }
    );
    return !!res.result.ok;
  }
  /** 登录 */
  async login(uid: string, pwd: string): Promise<User> {
    let user = await userCollection.findOne<User>(
      { uid: uid, password: pwd },
      { projection: { _id: false, token: false } }
    );
    if (!user) {
      return null;
    }
    if (!user.salt) {
      user.salt = util.createRandomCode(32);
      await userCollection.findOneAndUpdate(
        { uid: uid },
        { $set: { salt: user.salt } }
      );
    }
    util.setPrototype(user, User.prototype);
    return user;
  }
  /** 获取用户信息 */
  async getUser(uid: string, withPassword: boolean = false): Promise<User> {
    const projection = { _id: false, token: false };
    if (!withPassword) {
      projection["password"] = false;
    }
    let user = await userCollection.findOne({ uid }, { projection });
    util.setPrototype(user, User.prototype);
    return user;
  }
  /**注册 */
  async insertUser(user: User) {
    return userCollection.insertOne(user, { forceServerObjectId: true });
  }
  /** 更新用户信息 */
  async updateUser(uid: string, user: User) {
    return userCollection.updateOne({ uid: uid }, { $set: user });
  }
  /** 统计特定条件的用户是否存在 */
  async userExists(filter?: object): Promise<boolean> {
    if (!filter) {
      filter = {};
    }
    return Boolean(await userCollection.findOne(filter, { returnKey: true }));
  }
  /** 获取用户配置信息 */
  async getConfig(uid: string): Promise<UserConfig> {
    const config = await configCollection.findOne(
      { uid: uid },
      { projection: { _id: false } }
    );
    util.setPrototype(config, UserConfig.prototype);
    return config;
  }
  /** 更新配置 */
  async updateConfig(uid: string, config: UserConfig) {
    return configCollection.updateOne(
      { uid: uid },
      { $set: config },
      { upsert: true }
    );
  }
}

export const instance = new UserDao();
