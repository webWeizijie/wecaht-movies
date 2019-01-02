const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const session = require('koa-session')
const logger = require('koa-logger')
const config = require('./util/config')
const cacheUser = require('./middleare/cacheUser')
const moment = require('moment')
const {
  resolve
} = require('path')
const {
  initSchemas,
  connect
} = require('./database/init')
// error handler
onerror(app)

// session
app.keys = ['imooc']
app.use(session({
  key: 'movie',
  prefix: 'movie:uid'
}, app))

// middlewares
app.use(bodyparser({
  extendTypes: ['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(resolve(__dirname, './public')))
app.use(views(resolve(__dirname, './views'), {
  extension: 'pug',
  options: {
    moment: moment
  }
}))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
})

// 连接数据库
;
(async () => {
  await connect(config.db)
  initSchemas()
  // 路由
  const index = require('./routes/index')
  const wechatController = require('./controllers/wechat')

  app.use(wechatController.checkWechat)
  app.use(wechatController.wechatRedirect)
  app.use(cacheUser)
  app.use(index.routes(), index.allowedMethods())
})()

module.exports = app
