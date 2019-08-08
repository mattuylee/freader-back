import * as entityParser from "../util/entity-parser";

/**
 * @class 用户实体
 */
export class User {
    constructor(user?: User) { entityParser.assign(this, user) }
    /** @member 用户ID */
    uid: string = null
    /** @member 密码 */
    password: string = null
    /** @member 昵称 */
    nickName: string = null
    /** @member 推荐人ID */
    referrer: string
    /** @member 用户组 */
    userGroup: string
    /** @member 用户当前会话ID */
    token: string
}

/**
 * @enum 用户组
 */
export enum UserGroup {
    User,
    Admin
}