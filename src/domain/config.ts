import { assign } from "../util/entity-parser";
import * as validator from '../util/validator'

/** 用户配置 */
export class UserConfig {
    constructor(config?: UserConfig) { assign(this, config) }
    uid: string = undefined
    darkMode: boolean = undefined
    fontSize: number = undefined
    lineSpace: number = undefined   //行间距，单位倍
    background: string = undefined  //背景色十六进制格式
    foreground: string = undefined  //前景色十六进制格式
    slideMode: boolean = undefined  //是否为覆盖翻页模式
    landscape: boolean = undefined  //是否横屏模式

    /** 只读的空对象，仅用于判断对象兼容性。@see validator */
    static  empty = Object.freeze(new UserConfig)
}

