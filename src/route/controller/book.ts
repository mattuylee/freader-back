import { Controller } from "../../domain/types/route";
import { instance as BookService } from "../../service/book";

const router: Controller = {
    type: 'controller',
    description: '书籍数据相关的接口',
    name: 'book',
    service: BookService,
    path: '/book',
    routes: [{
        path: '/search',
        description: '搜索书籍',
        requests: [{
            method: 'get',
            token: true,
            invoke: BookService.search,
            params: [{
                from: 'query',
                name: 'source',
                description: '数据源',
                type: 'string',
                validation: {}
            },
            {
                from: 'query',
                name: 'kw',
                description: '搜索关键词',
                type: 'string',
                validation: {}
            },
            {
                from: 'query',
                name: 'page',
                description: '页数索引，从0开始',
                type: 'integer',
                validation: { nullable: true }
            }]
        }]
    },
    {
        path: '/detail/:bid',
        requests: [{
            method: 'get',
            token: true,
            description: '获取书籍数据',
            invoke: BookService.getBook,
            params: [
                {
                    from: 'query',
                    name: 'source',
                    description: '数据源',
                    type: 'string',
                    validation: {}
                },
                {
                    from: 'params',
                    name: 'bid',
                    description: '书籍ID',
                    type: 'string',
                    validation: {}
                }
            ]
        }]
    },
    {
        path: '/catalog/:bid',
        requests: [{
            method: 'get',
            token: true,
            description: '获取书籍章节列表',
            invoke: BookService.getCatalog,
            params: [{
                from: 'query',
                name: 'source',
                description: '数据源',
                type: 'string',
                validation: {}
            },
            {
                from: 'params',
                name: 'bid',
                description: '书籍ID',
                type: 'string',
                validation: {}
            }]
        }]
    },
    {
        path: '/chapter/:cid',
        requests: [{
            method: 'get',
            token: true,
            description: '获取章节内容',
            invoke: BookService.getChapter,
            params: [{
                from: 'query',
                name: 'source',
                description: '数据源',
                type: 'string',
                validation: {}
            },
            {
                from: 'params',
                name: 'cid',
                description: '章节ID',
                type: 'string',
                validation: {}
            },
            {
                from: 'query',
                name: 'bid',
                description: '书籍ID。保留，未启用',
                type: 'string',
                validation: { nullable: true }
            }]
        }]
    }]
}

module.exports = router