require("crypto"); //确保支持crypto模块
const cors = require("cors");
const express = require("express");
const path = require("path");
const logger = require("./log/index");

var app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

module.exports.run = async function () {
  //加载全局配置
  const { defaultGlobalConfig: globalConfig } = require("./util/global-config");
  //配置日志级别
  logger.useDevelop();
  if (/^product(ion)?$/.test(globalConfig.mode)) {
    logger.useProduct();
  } else if (/^develop(ment)?$/.test(globalConfig.mode)) {
    logger.useDevelop();
  }
  //初始化数据库
  await require("./dao/index").init();
  //初始化路由
  app.use(globalConfig.baseRoute, require("./route/index"));
  //开始监听端口
  await new Promise((resolve) => {
    app.listen(globalConfig.port, () => {
      logger.logger.info(
        `application is listening on port ${globalConfig.port}!`
      );
      resolve();
    });
  });
  //启用/禁用定时任务
  if (globalConfig.cron.enabled) {
    const cron = require("./service/cron").cron;
    cron.enable();
  }
};
