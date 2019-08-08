var log4js = require("log4js")

log4js.configure({
    appenders: {
        develop: { type: 'console' },
        product: { type: 'file', filename: __dirname + '/freader.log' }
    },
    categories: {
        develop: { appenders: ['develop'], level: log4js.levels.ALL },
        product: { appenders: ['product'], level: log4js.levels.INFO },
        default: { appenders: ['develop'], level: log4js.levels.ALL }
    }
})

var config = {
    logger: log4js.getLogger(),
    useDevelop: function () {
        config.logger = log4js.getLogger('develop')
        // app.use(log4js.connectLogger(config.logger, { level: log4js.levels.ALL }))
    },
    useProduct: function() {
        config.logger = log4js.getLogger('develop')
        // app.use(log4js.connectLogger(config.logger, { level: log4js.levels.WARN }))
    }
}

module.exports = config
