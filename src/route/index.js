const express = require('express')
const fs = require('fs')
const path = require('path')

const router = express.Router()
const root = path.resolve(__dirname, 'controller')

//扫描controller目录，引入子路由
let routes = fs.readdirSync(root)
if (!routes) { routes = [] }
routes.forEach(route => {
    let filename = path.join(root, route)
    if (!fs.statSync(filename).isFile) { return }
    //基路由为controller的名称
    router.use('/' + route.slice(0, route.lastIndexOf('.')), require(filename))
})


module.exports = router
