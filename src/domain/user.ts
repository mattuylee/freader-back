import * as entityParser from "../util/entity-parser";

/**
 * @class 用户实体
 */
export class User {
    constructor(user?: User) { entityParser.assign(this, user) }
    /** @member 用户ID */
    uid: string = undefined
    /** @member 密码 */
    password: string  = undefined
    /** @member 昵称 */
    nickName: string  = undefined
    /** @member 推荐人ID */
    referrer: string = undefined
    /** @member 用户组 */
    userGroup: string = undefined
    /** @member 用户当前会话ID */
    token: string = undefined

    static readonly empty: User = Object.freeze(new User)
}

/**
 * @enum 用户组
 */
export enum UserGroup {
    User,
    Admin
}
