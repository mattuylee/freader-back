import { Db } from 'mongodb'
import { db } from './index'
import { User } from '../domain/user';
import { UserConfig } from '../domain/config';

const userCollection = (<Db>db).collection('user')
const configCollection = (<Db>db).collection('uconfig')

export class UserDao {
    /** 获取用户信息 */
    async getUser(uid: string): Promise<User> {
        let user = await userCollection.findOne({ uid: uid })
        if (user) { Reflect.setPrototypeOf(user, User.prototype) }
        return user
    }
    /** 根据token获取用户 */
    async getUserByToken(token: string): Promise<User> {
        let user = await userCollection.findOne({ token: token })
        if (user) { Reflect.setPrototypeOf(user, User.prototype) }
        return user
    }
    /**注册 */
    async register(user: User) {
        return userCollection.insertOne(user)
    }
    /** 更新用户信息 */
    async updateUser(user: User) {
        return userCollection.updateOne({ uid: user.uid }, { $set: user })
    }
    /** 统计特定条件的用户是否存在 */
    async userExists(filter?: object): Promise<boolean> {
        if (!filter) { filter = {} }
        return Boolean(await userCollection.findOne(filter))
    }
    /** 更新配置 */
    async updateConfig(uid: string, config: UserConfig) {
        return configCollection.updateOne({ uid: uid }, { $set: config })
    }
}

export const instance = new UserDao()