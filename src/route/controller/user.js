const express = require('express')
const router = express.Router()
const handleAsync = require('../handle-async')
const userService = require('../../service/user').instance

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
    userService.assertToken(req.headers.token).then(() => {
        handleAsync(userService.updateConfig(req.headers.token, req.body), res)
    }).catch(result => res.json(result))
})
module.exports = router
