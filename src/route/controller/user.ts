import { instance as UserService } from '../../service/user'
import { Controller } from '../../domain/types/route';
import { User } from '../../domain/user';
import { UserConfig } from '../../domain/config';


const router: Controller = {
    type: "controller",
    description: "定义用户相关的接口",
    name: "user",
    service: UserService,
    path: "/user",
    routes: [{
        path: '/',
        requests: [{
            method: 'get',
            description: '获取用户信息',
            token: false,
            invoke: UserService.getUserInfo,
            params: [{
                from: 'headers',
                name: 'token',
                type: 'string',
                validation: { valueType: 'string' }
            },
            {
                from: 'query',
                name: 'uid',
                description: '用户ID',
                type: 'string',
                validation: { nullable: true, valueType: 'string' }
            }]
        },
        {
            method: 'put',
            description: '更新用户信息',
            token: false,
            invoke: UserService.updateUserInfo,
            params: [{
                from: 'headers',
                name: 'token',
                type: 'string',
                validation: { valueType: 'string' }
            },
            {
                from: 'body',
                description: '要更新的用户信息',
                name: null,
                type: 'object',
                validation: { valueType: User.empty }
            }]
        }]
    },
    {
        path: "/token",
        description: "更新会话ID",
        requests: [{
            method: "put",
            token: true,
            invoke: UserService.updateToken,
            params: [{
                from: "headers",
                name: "token",
                description: "旧会话ID",
                type: "string",
                validation: {}
            }]
        }]
    },
    {
        path: "/login",
        description: "登录",
        requests: [{
            method: "post",
            token: false,
            invoke: UserService.login,
            headers: { "Content-Type": 'application/x-www-form-urlencoded' },
            params: [{
                from: "body",
                name: "uid",
                description: "用户名",
                type: "string",
                validation: { type: 'name', valueType: 'string' }
            },
            {
                from: "body",
                name: "pwd",
                description: "密码",
                type: "string",
                validation: { type: 'password', valueType: 'string' }
            }]
        }]
    },
    {
        path: "/register",
        description: "注册",
        requests: [{
            method: 'post',
            token: false,
            invoke: UserService.register,
            headers: { "Content-Type": 'application/json' },
            params: [{
                from: "body",
                name: 'referrer',
                description: '邀请码，实际为当前存在用户的会话token',
                type: 'string',
                validation: { valueType: 'string' }
            },
            {
                from: "body",
                name: "user",
                description: "要注册的用户信息",
                type: User,
                validation: { valueType: User.empty }
            }]
        }]
    },
    {
        path: '/config',
        requests: [{
            method: 'get',
            description: '获取用户配置',
            token: false,
            invoke: UserService.getConfig,
            params: [{
                from: 'headers',
                name: 'token',
                type: 'string',
                validation: { valueType: 'string' }
            }]
        },
        {
            method: 'put',
            description: '更新用户配置',
            token: false,
            invoke: UserService.updateConfig,
            params: [{
                from: 'headers',
                name: 'token',
                type: 'string',
                validation: { valueType: 'string' }
            },
            {
                from: 'body',
                name: null,
                description: '要更新的用户配置',
                type: 'object',
                validation: { valueType: UserConfig.empty }
            }]
        }]
    }]
}

module.exports = router