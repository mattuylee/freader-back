module.exports = {
    "host": "localhost",
    "port": "3280",
    "basePath": "/",
    "user": "ui",
    "password": "ui",

    "testCases": {
        "/user": {
            "title": "用户模块",
            "type": "module",
            "/": {
                "title": "用户信息",
                "type": "route",
                "get": {
                    "uid": 'ui'
                },
                "put": {
                    "password": "ui",
                    "nickName": "Mattuy Lee",
                    "SHOULD_NOT": "SHOULD_NOT_VALUE",
                    "uid": "invalid",
                    "userGroup": "Admin"
                }
            },
            "/login": {
                "title": "登录",
                "type": "route",
                "form": {
                    "uid": "ui",
                    "pwd": "ui"
                }
            },
            "/register": {
                "title": "注册",
                "type": "route",
                "post": {
                    "referrer": "",
                    "user": {
                        "uid": "new-user-test",
                        "password": "123456",
                        "nickName": "Mattuy Lee",
                        "SHOULD_NOT": "SHOULD_NOT_VALUE",
                        "referrer": "tuijianrenid",
                        "userGroup": "Admin",
                        "token": "23412rermfe8"
                    }
                }
            },
            "/config": {
                "title": "用户配置",
                "type": "route",
                "get": {},
                "put": {
                    "darkMode": false,
                    "fontSize": 20,
                    "lineSpace": 1.6,
                    "background": '#fff',
                    "foreground": '#666',
                    "slideMode": true,
                    "landscape": false,
                    "SHOULD_NOT": "SHOULD_NOT_VALUE",
                    "uid": "1234"
                }
            }
        }
    }
}