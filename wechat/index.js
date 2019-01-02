const config = require('../util/config')
const Wechat = require('../wechat-lib/index')
const WechatOAuth = require('../wechat-lib/oauth')
const mongoose = require('mongoose')

const wechatCfg = {
  wechat: {
    appId: config.appId,
    appSecret: config.appSecret,
    token: config.token,
    getAccessToken: async () => {
      const Token = mongoose.model('Token')
      const res = await Token.getAccessToken()

      return res
    },
    saveAccessToken: async (data) => {
      const Token = mongoose.model('Token')
      const res = await Token.saveAccessToken(data)

      return res
    },
    getTicket: async () => {
      const Ticket = mongoose.model('Ticket')
      const res = await Ticket.getTicket()

      return res
    },
    saveTicket: async (data) => {
      const Ticket = mongoose.model('Ticket')
      const res = await Ticket.saveTicket(data)

      return res
    }
  }
}

const getWechat = () => new Wechat(wechatCfg.wechat)
const getOAuth = () => new WechatOAuth(wechatCfg.wechat)

module.exports = {
  getWechat,
  getOAuth
}
