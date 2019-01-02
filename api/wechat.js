const {
  getOAuth,
  getWechat
} = require('../wechat/index')
const {
  sign
} = require('../util/index')
const mongoose = require('mongoose')
const User = mongoose.model('User')

exports.getSignature = async (url) => {
  const client = getWechat()
  const data = await client.fetchAccessToken()
  const token = data.access_token
  const ticketData = await client.fetchTicket(token)
  const ticket = ticketData.ticket

  let params = sign(ticket, url)
  params.appId = client.appId

  return params
}

exports.getAuthorizeURL = (scope, target, state) => {
  const oauth = getOAuth()
  const url = oauth.getAuthorizeURL(scope, target, state)

  return url
}

exports.getUserInfoByCode = async (code) => {
  const oauth = getOAuth()
  const data = await oauth.fetchAccessToken(code)
  const userData = await oauth.getUserInfo(data.access_token, data.openid)

  console.log(userData, 'userData')
  console.log(data, 'data')
  return userData
}

exports.saveWecahtUser = async (userData) => {
  let query = {
    openid: userData.openid
  }

  if (userData.unionid) {
    query = {
      uniond: userData.uniond
    }
  }

  let user = await User.findOne(query)
  if (!user) {
    user = new User({
      openid: [userData.openid],
      uniond: userData.uniond || 0,
      nickname: userData.nickname,
      province: userData.province,
      country: userData.country,
      city: userData.city,
      gender: userData.gender || userData.sex,
      email: (userData.uniond || userData.openid) + '@wx.com'
    })

    user = await user.save()
  }

  return user
}
