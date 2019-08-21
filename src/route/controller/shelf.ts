import { Controller } from "../../domain/types/route";
import { instance as ShelfService } from '../../service/shelf'
import { ShelfBook, ShelfBookGroup } from "../../domain/book/shelf";

const router: Controller = {
    type: "controller",
    description: "书架相关的接口",
    name: "shelf",
    service: ShelfService,
    path: '/shelf',
    routes: [{
        path: '/',
        requests: [{
            method: 'get',
            description: '获取书架书籍列表',
            token: true,
            invoke: ShelfService.getShelfBooks,
            params: [{
                from: 'headers',
                name: 'token',
                validation: {}
            },
            {
                from: 'query',
                description: '书籍ID。当此参数存在时其他参数失效',
                name: 'bid',
                type: 'string',
                validation: { nullable: true, valueType: 'string' }
            },
            {
                from: 'query',
                description: '书架分组ID',
                name: 'gid',
                type: 'string',
                validation: { nullable: true, valueType: 'string' }
            }]
        },
        {
            method: 'put',
            description: '更新或添加书架书籍内容',
            token: true,
            invoke: ShelfService.updateShelfBooks,
            params: [{
                from: 'headers',
                name: 'token',
                validation: { valueType: 'string' }
            },
            {
                from: 'body',
                description: '书架书籍信息',
                name: null,
                type: 'object',
                validation: { valueType: ShelfBook.empty }
            }]
        },
        {
            method: 'delete',
            description: '移除书架书籍',
            token: true,
            invoke: ShelfService.removeShelfBook,
            params: [{
                from: 'headers',
                name: 'token',
                validation: { valueType: 'string' }
            },
            {
                from: 'query',
                name: 'bid',
                description: '要删除的书架书籍的书籍ID',
                validation: { valueType: 'string' }
            }]
        }]
    },
    {
        path: '/group',
        requests: [{
            method: 'get',
            description: '获取书架分组',
            token: true,
            invoke: ShelfService.getShelfBookGroups,
            params: [{
                from: 'headers',
                name: 'token',
                validation: { valueType: 'string' }
            },
            {
                from: 'query',
                name: 'gid',
                description: '分组ID',
                type: 'string',
                validation: { nullable: true, valueType: 'string' }
            }]
        },
        {
            method: 'put',
            description: '更新或新增书架分组',
            token: true,
            invoke: ShelfService.updateShelfBookGroup,
            params: [{
                from: 'headers',
                name: 'token',
                validation: { valueType: 'string' }
            },
            {
                from: 'body',
                name: null,
                description: '分组信息',
                type: 'object',
                validation: { valueType: ShelfBookGroup.empty }
            }]
        },
        {
            method: 'delete',
            description: '删除书架分组',
            token: true,
            invoke: ShelfService.removeShelfBookGroup,
            params: [{
                from: 'headers',
                name: 'token',
                validation: {}
            },
            {
                from: 'query',
                name: 'gid',
                description: '要删除的分组ID',
                type: 'string',
                validation: { valueType: 'string' }
            }]
        }]
    }]
}


module.exports = router
