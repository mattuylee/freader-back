/** 用户配置 */
export class UserConfig {
    uid: string         //用户ID
    darkMode: boolean   //夜间模式
    fontSize: number    //字体大小
    lineSpace: number   //行间距，单位倍
    background: string  //背景色十六进制格式
    foreground: string  //前景色十六进制格式
    slideMode: boolean  //是否为覆盖翻页模式
    landscape: boolean  //是否横屏模式

    /** 只读的对象，仅用于判断对象兼容性。@see validator */
    static empty: UserConfig = Object.freeze({
        uid: '',
        darkMode: false,
        fontSize: 20,
        lineSpace: 1.5,
        background: '',
        foreground: '',
        slideMode: false,
        landscape: false
    })
}
