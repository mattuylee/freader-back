import * as jwt from "../util/jwt";
import * as util from "../util/index";
import { Result } from "../domain/result";
import { User, UserGroup } from "../domain/user";
import { UserConfig } from "../domain/config";
import { instance as userDao } from "../dao/user";

/**
 * 用户验证相关的逻辑
 */
export class UserService {
  /** 判断token是否合法。 */
  async assertToken(token: string): Promise<never> {
    const uid = util.jwtTokenToUserID(token);
    if (uid) {
      const user = await userDao.getUser(uid, true);
      try {
        if (
          user &&
          util.jwtVerify(token, util.jwtSecret(uid, user.password, user.salt))
        ) {
          return;
        }
      } catch {}
    }
    const result = new Result();
    result.code = 401;
    result.error = "认证失败";
    result.needLogin = true;
    throw result;
  }

  /**
   * 更新会话ID（token）
   * @param 旧ID
   */
  async updateToken(token: string): Promise<Result> {
    const result = new Result();
    if (util.jwtShouldUpdate(token)) {
      const uid = util.jwtTokenToUserID(token);
      const user = await userDao.getUser(uid, true);
      if (!user) {
        result.code = 401;
        result.error = "认证失败";
        return result;
      }
      result.token = jwt.jwtCreateToken(
        uid,
        jwt.jwtSecret(uid, user.password, user.salt)
      );
    } else {
      result.token = token;
    }
    return result;
  }
  /**
   * 获取用户信息。注意，普通用户只能获取自己的信息
   * @param token 当前会话ID
   * @param uid 要获取的用户的ID
   */
  async getUserInfo(token: string, uid?: string): Promise<Result<User>> {
    const user = await userDao.getUser(util.jwtTokenToUserID(token));
    let result = new Result();
    if (!user || !uid || user.uid == uid) {
      if (!user) {
        result.error = "认证失败";
        result.needLogin = true;
      } else {
        result.data = user;
      }
      return result;
    }
    //获取其他用户信息
    if (user.userGroup != UserGroup.Admin) {
      result.error = "权限不足";
    } else {
      result.data = await userDao.getUser(uid);
      if (!result.data) {
        result.error = "用户不存在";
      }
    }
    return result;
  }
  /**
   * 更新用户信息
   * @param token 会话ID
   * @param userinfo 要更新的用户信息
   */
  async updateUserInfo(token: string, userinfo: User): Promise<Result> {
    const user = await userDao.getUser(util.jwtTokenToUserID(token));
    let result = new Result();
    if (!userinfo || typeof userinfo != "object") {
      return result;
    }
    if (!user) {
      result.error = "认证失败";
      result.needLogin = true;
      return result;
    }
    let update: any = {};
    if (userinfo.nickName) {
      if (
        util.validate(userinfo.nickName, {
          minLength: 0,
          maxLength: 40,
          valueType: "string",
        })
      ) {
        update.nickName = userinfo.nickName;
      } else {
        result.error = "昵称不能超过40个字符";
      }
    }
    if (userinfo.password) {
      if (
        util.validate(userinfo.password, {
          type: "password",
          valueType: "string",
        })
      ) {
        update.password = userinfo.password;
      } else {
        result.error = "密码只能是字母、数字、符号，2-18位";
      }
    }
    if (!result.error) {
      await userDao.updateUser(user.uid, update);
    }
    return result;
  }
  /**
   * 登录
   * @param user 用户名
   * @param password 密码
   * @return {Result}
   */
  async login(uid: string, password: string): Promise<Result<User>> {
    let user = await userDao.login(uid, password);
    let result = new Result();
    if (user) {
      result.data = user;
      const secret = util.jwtSecret(uid, password, user.salt);
      result.token = util.jwtCreateToken(uid, secret);
    } else {
      result.error = "用户名或密码错误";
    }
    return result;
  }
  /** 注册 */
  async register(referrerToken, user: User): Promise<Result<User>> {
    let result = new Result();
    if (!user || !util.validate(user.uid, { type: "name" })) {
      result.error = "无效的用户名";
    } else if (!util.validate(user.password, { type: "password" })) {
      result.error = "密码只能是字母、数字、符号，2-18位";
    } else if (!user.nickName || user.nickName.length > 40) {
      result.error = "昵称不能超过40个字符";
    }
    if (result.error) {
      return result;
    }
    // todo: 增加推荐人字段
    let referrer = true;
    if (!referrer) {
      result.error = "邀请码已失效";
      return result;
    }
    if (await userDao.getUser(user.uid)) {
      result.error = "用户名已存在";
      return result;
    }
    if (!user.nickName) {
      user.nickName = user.uid;
    }
    user.salt = util.createRandomCode(32);
    // todo: 记录推荐人
    user.referrer = null;
    user.userGroup = UserGroup.User;
    if (!(await userDao.insertUser(user)).result.ok) {
      result.error = "数据库错误";
    } else {
      result.data = user;
    }
    return result;
  }
  /** 获取用户配置 */
  async getConfig(token: string): Promise<Result<UserConfig>> {
    let result = new Result();
    const user = await userDao.getUser(util.jwtTokenToUserID(token));
    if (!user) {
      result.error = "认证失败";
      result.needLogin = true;
    }
    result.data = await userDao.getConfig((user as User).uid);
    //没有配置信息属于正常情况
    return result;
  }
  /**更新用户配置 */
  async updateConfig(token: string, config: UserConfig): Promise<Result> {
    if (!config) {
      return new Result();
    }
    const user = await userDao.getUser(util.jwtTokenToUserID(token));
    const result = new Result();
    if (!user) {
      result.error = "认证失败";
      result.needLogin = true;
    } else {
      config.uid = user.uid;
      let updateResult = await userDao.updateConfig(user.uid, config);
      if (!updateResult.result.ok) {
        result.error = "更新配置失败";
      }
    }
    return result;
  }
}

export const instance = new UserService();
