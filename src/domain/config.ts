import { assign } from "../util/entity-parser";

/** 用户配置 */
export class UserConfig {
    constructor(config?: UserConfig) { assign(this, config) }
    uid: string
    darkMode: boolean
    fontSize: number
    lineSpace: number   //行间距，单位倍
    background: string  //背景色十六进制格式
    foreground: string  //前景色十六进制格式
    slideMode: boolean  //是否为覆盖翻页模式
    landscape: boolean  //是否横屏模式
}
