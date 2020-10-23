import * as express from "express";
import * as fs from "fs";
import * as path from "path";
import * as util from "../util/index";
import { Controller } from "../domain/types/route";
import { logger } from "../log/index";
import { Result } from "../domain/result";
import { instance as userService } from "../service/user";

const router = express.Router();
const root = path.resolve(__dirname, "controller");

//扫描controller目录，引入子路由
let routes = fs.readdirSync(root);
if (!routes) {
  routes = [];
}
routes.forEach((routeFile) => {
  let filename = path.join(root, routeFile);
  if (!fs.statSync(filename).isFile) {
    return;
  }
  const controller = require(filename);
  applyRoute(router, controller);
});

/**
 * 应用路由配置
 * @param router express路由配置器
 * @param controller 路由配置
 */
function applyRoute(router, controller: Controller) {
  const innerRouter = express.Router();
  for (let route of controller.routes) {
    for (let request of route.requests) {
      innerRouter[request.method](route.path, async (req, res) => {
        let params = [];
        let result = new Result();
        if (request.headers) {
          for (let key in request.headers) {
            if (req.get(key) != request.headers[key]) {
              result.code = 400;
              result.error = "请求格式错误";
              res.json(result);
              return;
            }
          }
        } //请求头验证
        for (let param of request.params) {
          let value = param.name
            ? req[param.from][param.name]
            : req[param.from];
          if (param.validation && !util.validate(value, param.validation)) {
            logger.warn(`Request failed to pass argument validation.
                            PARAM: ${param.name}
                            IP: ${req.hostname}
                            ROUTE: ${path.posix.join(
                              controller.path,
                              route.path
                            )}`);
            result.code = 400;
            result.error = "参数错误";
            res.json(result);
            return result;
          } //参数验证
          params.push(value);
        }
        if (request.token) {
          await userService
            .assertToken(<string>req.headers.token)
            .catch((e) => {
              result = e;
            });
          if (result.error) {
            res.json(result);
            return;
          }
        } //身份认证
        let callback: Function, thisObject: object;
        if (!request.invoke) {
          res.json(result);
          return;
        } else if (typeof request.invoke == "function") {
          callback = request.invoke;
          thisObject = request.thisObject
            ? request.thisObject
            : controller.service;
        } else if (typeof request.invoke == "string") {
          callback = controller.service[request.invoke];
          thisObject = controller.service;
        }
        //调用service
        try {
          let asyncResult = await callback.apply(thisObject, params);
          res.json(util.filterResponse(asyncResult));
        } catch (e) {
          let result = new Result();
          result.code = 500;
          result.error = "服务器内部错误";
          res.json(result);
          logger.error(e);
        }
      });
    }
  }
  router.use(controller.path, innerRouter);
}

module.exports = router;
