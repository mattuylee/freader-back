import { instance as userDao } from '../dao/user'
import { Result } from '../domain/result';
import { User, UserGroup } from '../domain/user';

/**
 * 用户验证相关的逻辑
 */
export class UserService {
    /** 判断token是否合法。如果非法返回的Promise将被reject */
    assertToken(token: string): Promise<never> {
        return new Promise(async (resolve, reject) => {
            if (await userDao.userExists({ token: token })) { resolve() }
            else {
                let result = new Result()
                result.code = 403
                result.error = '验证失败'
                result.needLogin = true
                reject(result)
            }
        })
    }
    /**
     * 登录
     * @param user 用户名
     * @param password 密码
     * @return {Result}
     */
    async login(uid: string, password: string): Promise<Result> {
        let user = await userDao.getUser(uid)
        let result = new Result()
        if (user && user.password == password) {
            result.data = user
            result.token = user.token
        }
        else {
            result.error = '用户名或密码错误'
        }
        return result
    }
    /** 注册 */
    async register(referrerToken, user: User): Promise<Result> {
        let result = new Result()
        if (!user || !/^[_0-9a-zA-Z\u4e00-\u9fbb]{2,16}$/.test(user.uid)) {
            result.error = '无效的用户名'
            return result
        }
        else if (!/^[!-~]{2,18}/.test(user.password)) {
            result.error = '密码只能是字母、数字、符号，2-18位'
            return result
        }
        else if (!user.nickName || user.nickName.length > 40) {
            result.error = '昵称不能超过40个字符'
            return result
        }
        let referrer = await userDao.getUserByToken(referrerToken)
        if (!referrer && !await userDao.userExists()) {
            result.error = '邀请码已失效'
            return result
        }
        else if (await userDao.getUser(user.uid)) {
            result.error = '用户名已存在'
            return result
        }
        //防止客户端垃圾数据
        let newUser = new User(user)
        if (!newUser.nickName) { newUser.nickName = newUser.uid }
        newUser.referrer = referrer ? referrer.uid : null
        newUser.userGroup = newUser.referrer ? UserGroup[UserGroup.User] : UserGroup[UserGroup.Admin]
        newUser.token = createToken()
        userDao.register(newUser)
        result.data = newUser
        return result
    }
}

//创建新token
function createToken() {
    return require('uuid').v1().replace('-', '')
}


export const instance = new UserService()