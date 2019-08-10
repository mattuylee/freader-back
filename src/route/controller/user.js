const express = require('express')
const handleAsync = require('../handle-async').handleAsync
const userService = require('../../service/user').instance
const router = express.Router()

//获取用户信息
router.get('/', (req, res) => {
    handleAsync(userService.getUserInfo(req.headers.token, req.params.uid), res)
})
//更新用户信息
router.put('/', (req, res) => {
    handleAsync(userService.updateUserInfo(req.headers.token, req.body), res)
})
//登录
router.post('/login', (req, res) => {
    handleAsync(userService.login(req.body.uid, req.body.pwd), res)
})
//注册
router.post('/register', (req, res) => {
    handleAsync(userService.register(req.body.referrer, req.body.user), res)
})
//获取用户配置
router.get('/config', (req, res) => {
    handleAsync(userService.getConfig(req.headers.token), res)
})
//更新用户配置
router.put('/config', (req, res) => {
    handleAsync(userService.updateConfig(req.headers.token, req.body), res)
})

module.exports = router
