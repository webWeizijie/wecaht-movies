const request = require('request-promise')
const base = 'https://api.weixin.qq.com/sns/'
const api = {
  oathUrl: 'https://open.weixin.qq.com/connect/oauth2/authorize?',
  accessToken: base + 'oauth2/access_token?',
  userInfo: base + 'userinfo?'
}
module.exports = class WechatOath {
  constructor (opts) {
    this.appId = opts.appId
    this.appSecret = opts.appSecret
  }
  async request (options) {
    options = Object.assign({}, options, {
      json: true
    })

    try {
      const res = await request(options)

      return res
    } catch (error) {
      console.log(error)
    }
  }
  /**
     *
     * @param {string} scope 详细信息/主动授权  基本信息/静默授权
     * @param {object} target
     * @param {object} state
     */
  getAuthorizeURL (scope = 'snsapi_base', target, state) {
    const redirectUri = encodeURIComponent(target)
    const url = `${api.oathUrl}appid=${this.appId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`

    return url
  }

  async fetchAccessToken (code) {
    const url = `${api.accessToken}appid=${this.appId}&secret=${this.appSecret}&code=${code}&grant_type=authorization_code`

    const res = await this.request({
      url
    })

    return res
  }

  async getUserInfo (token, openID, lang = 'zh_CN') {
    const url = `${api.userInfo}access_token=${token}&openid=${openID}&lang=${lang}`

    const res = await this.request({
      url
    })

    return res
  }
}
