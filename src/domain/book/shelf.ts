import { RemoteSource } from "../resource-info"

/**
 * 定义书架书籍。
 * 书架书籍由用户ID与书籍ID共同决定。对于不同数据源的相同书
 * 籍（定义见书籍实体定义），仅允许存在同一条书架书籍记录
 */
export class ShelfBook {
    uid: string             //用户ID
    bid: string             //书籍ID
    gid: string             //分组ID
    cid: string             //当前阅读章节ID
    chapterIndex: number    //阅读进度
    readProgress: number    //当前章节阅读进度
    latestReadTime: number  //最近阅读时间
    source: RemoteSource
    //用于类型验证
    static readonly empty: ShelfBook = Object.freeze({
        uid: '',
        bid: '',
        gid: '',
        cid: '',
        chapterIndex: 0,
        readProgress: 0,
        latestReadTime: 0,
        source: RemoteSource.Default
    })
}

/** 书架书籍分组 */
export class ShelfBookGroup {
    uid: string             //用户ID
    gid: string             //分组ID
    size: number            //书架书籍数量
    title: string           //分组名称
    covers: string[]        //封面
    lastAccessTime: number  //上次阅读时间
    //用于验证的对象
    static readonly empty: ShelfBookGroup = Object.freeze({
        uid: '',
        gid: '',
        size: null,
        title: '',
        covers: null,
        lastAccessTime: 0
    })
}
