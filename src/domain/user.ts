/**
 * @class 用户实体
 */
export class User {
    uid: string             //用户ID
    password: string        //密码
    nickName: string        //昵称
    referrer: string        //推荐人ID
    userGroup: UserGroup    //用户组
    token: string           //用户当前会话ID
    // 用于类型验证的对象
    static readonly empty: User = Object.freeze({
        uid: '',
        password: '',
        nickName: '',
        referrer: '',
        userGroup: '',
        token: '',
    })
}

/**
 * @enum 用户组
 */
export class UserGroups {
    static readonly User = 'User'
    static readonly Admin = 'Admin'
}
type UserGroup = string