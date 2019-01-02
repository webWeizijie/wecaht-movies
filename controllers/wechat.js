const reply = require('../wechat/reply')
const config = require('../util/config')
const wecahtMiddle = require('../wechat-lib/middleware')
const api = require('../api/index')
const {
  isWechat
} = require('../util/index')
exports.hear = async (ctx, next) => {
  const middle = wecahtMiddle(config, reply)

  await middle(ctx, next)
}

exports.oauth = async (ctx, next) => {
  const target = config.baseUrl + 'userinfo'
  const scope = 'snsapi_userinfo'
  const state = ctx.query.id
  const url = api.wechat.getAuthorizeURL(scope, target, state)

  ctx.redirect(url)
}

exports.sdk = async (ctx, next) => {
  const url = ctx.href
  const params = await api.wechat.getSignature(url)

  await ctx.render('wechat/sdk', params)
}

exports.checkWechat = async (ctx, next) => {
  const ua = ctx.headers['user-agent']
  const code = ctx.query.code

  if (ctx.method === 'GET') {
    if (code) {
      await next()
    } else if (isWechat(ua)) {
      const target = ctx.href
      const scope = 'snsapi_userinfo'
      const url = api.wechat.getAuthorizeURL(scope, target, 'fromWechat')

      ctx.redirect(url)
    } else {
      await next()
    }
  } else {
    await next()
  }
}

exports.wechatRedirect = async (ctx, next) => {
  const {
    code,
    state
  } = ctx.query

  if (code && state === 'fromWechat') {
    const userData = await api.wechat.getUserInfoByCode(code)
    const user = await api.wechat.saveWecahtUser(userData)

    ctx.session.user = {
      _id: user._id,
      role: user.role,
      nickname: user.nickname
    }

    ctx.state = Object.assign(ctx.state, {
      user: {
        role: user.role,
        _id: user._id,
        nickname: user.nickname
      }
    })

    await next()
  } else {
    await next()
  }
}

exports.userInfo = async (ctx, next) => {
  const userData = await api.wechat.getUserInfoByCode(ctx.query.code)

  ctx.body = userData
}

exports.getSDKSignature = async (ctx, next) => {
  const params = await api.wechat.getSignature()

  ctx.body = {
    success: true,
    data: params
  }
}
