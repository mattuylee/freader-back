import { Db } from 'mongodb';

import * as util from '../util/index';
import { User } from '../domain/user';
import { UserConfig } from '../domain/config';
import { db } from './index';


const userCollection = (<Db>db).collection('user')
const configCollection = (<Db>db).collection('uconfig')

/**
 * 暴露账户相关的持久层接口
 */
export class UserDao {
    /**
     * 更新会话ID（token）
     * @param _token 原token
     * @returns 新token，失败返回原token
     */
    async updateToken(_token: string): Promise<string> {
        const token = util.createRandomCode(32)
        const res = await userCollection.updateOne({ token: _token }, { $set: { token: token } })
        return res.result.ok ? token : _token
    }
    /** 登录 */
    async login(uid: string, pwd: string): Promise<User> {
        let token = util.createRandomCode(32)
        //登录更新token
        let result = await userCollection.findOneAndUpdate(
            { uid: uid, password: pwd },
            { $set: { token: token } },
            { returnOriginal: false, projection: { _id: false } })
        return result.value
    }
    /** 获取用户信息 */
    async getUser(filter: object | string): Promise<User> {
        if (!filter) { return null }
        if (typeof filter == 'string') { filter = { uid: filter } }
        let user = await userCollection.findOne(filter, { projection: { _id: false } })
        util.setPrototype(user, User.prototype)
        return user
    }
    /**
     * 根据token获取用户
     * @deprecated 请使用@function getUser()
     */
    async getUserByToken(token: string): Promise<User> {
        let user = await userCollection.findOne({ token: token })
        util.setPrototype(user, User.prototype)
        return user
    }
    /**注册 */
    async insertUser(user: User) {
        return userCollection.insertOne(user, { forceServerObjectId: true })
    }
    /** 更新用户信息 */
    async updateUser(uid: string, user: User) {
        return userCollection.updateOne({ uid: uid }, { $set: user })
    }
    /** 统计特定条件的用户是否存在 */
    async userExists(filter?: object): Promise<boolean> {
        if (!filter) { filter = {} }
        return Boolean(await userCollection.findOne(filter, { returnKey: true }))
    }
    /** 获取用户配置信息 */
    async getConfig(uid: string): Promise<UserConfig> {
        const config = await configCollection.findOne({ uid: uid }, { projection: { _id: false } })
        util.setPrototype(config, UserConfig.prototype)
        return config
    }
    /** 更新配置 */
    async updateConfig(uid: string, config: UserConfig) {
        return configCollection.updateOne({ uid: uid }, { $set: config }, { upsert: true })
    }
}

export const instance = new UserDao()