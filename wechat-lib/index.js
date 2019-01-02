const request = require('request-promise')
const fs = require('fs')
const base = 'https://api.weixin.qq.com/cgi-bin/'
const mpbase = 'https://mp.weixin.qq.com/cgi-bin/'
const semanticUrl = 'https://api.weixin.qq.com/semantic/'

const api = {
  accessToken: base + 'token?grant_type=client_credential',
  temporary: {
    upload: base + 'media/upload?',
    fetch: base + 'media/get?'
  },
  permanent: {
    upload: base + 'material/add_material?',
    uploadNews: base + 'material/add_news?',
    uploadNewsPic: base + 'media/uploadimg?',
    fetch: base + 'material/get_material?',
    batch: base + 'material/batchget_material?',
    count: base + 'material/get_materialcount?',
    del: base + 'material/del_material?',
    update: base + 'material/update_news?'
  },
  tag: {
    create: base + 'tags/create?',
    fetch: base + 'tags/get?',
    update: base + 'tags/update?',
    del: base + 'tags/delete?',
    fetchUsers: base + 'user/tag/get?',
    batchTag: base + 'tags/members/batchtagging?',
    batchUnTag: base + 'tags/members/batchuntagging?',
    getUserTags: base + 'tags/getidlist?'
  },
  user: {
    fetch: base + 'user/get?',
    info: base + 'user/info?',
    batch: base + 'user/info/batchget?'
  },
  qrcode: {
    create: base + 'qrcode/create?',
    show: mpbase + 'showqrcode?'
  },
  shortUrl: {
    create: base + 'shorturl?'
  },
  semantic: {
    search: semanticUrl + 'semproxy/search?'
  },
  ai: {
    translate: base + 'media/voice/translatecontent?'
  },
  menu: {
    create: base + 'menu/create?',
    delete: base + 'menu/delete?'
  },
  ticket: {
    getticket: base + 'ticket/getticket?'
  }
}

module.exports = class Wechat {
  constructor (opts) {
    this.opts = Object.assign({}, opts)
    this.appId = opts.appId
    this.appSecret = opts.appSecret
    this.getAccessToken = opts.getAccessToken
    this.saveAccessToken = opts.saveAccessToken
    this.getTicket = opts.getTicket
    this.saveTicket = opts.saveTicket

    this.fetchAccessToken()
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

  async fetchAccessToken () {
    let data = await this.getAccessToken()

    if (!this.isValid(data, 'access_token')) {
      data = await this.updateAccessToken()
    }

    await this.saveAccessToken(data)

    return data
  }

  async updateAccessToken () {
    const url = `${api.accessToken}&appid=${this.appId}&secret=${this.appSecret}`
    const data = await this.request({
      url
    })
    const now = new Date().getTime()
    const expiresIn = now + (data.expires_in - 20) * 1000

    data.expires_in = expiresIn
    data.token = data.access_token

    return data
  }

  isValid (data, name) {
    if (!data || !data.expires_in) {
      return false
    }

    const expiresIn = data.expires_in
    const now = new Date().getTime()

    if (now < expiresIn) {
      return true
    } else {
      return false
    }
  }

  uploadMaterial (token, type, material, permanent = false) {
    let form = {}
    let url = api.temporary.upload

    if (permanent) {
      url = api.permanent.upload

      form = Object.assign(form, permanent)
    }

    if (type === 'pic') {
      url = api.permanent.uploadNewsPic
    }

    if (type === 'news') {
      url = api.permanent.uploadNews

      form = material
    } else {
      form.media = fs.createReadStream(material)
    }

    let uploadUrl = `${url}access_token=${token}`

    if (!permanent) {
      uploadUrl += `&type=${type}`
    } else {
      if (type !== 'news') {
        // form.accessToken = token
      }
    }

    const options = {
      method: 'POST',
      url: uploadUrl,
      json: true
    }

    if (type === 'news') {
      options.body = form
    } else {
      options.formData = form
    }

    return options
  }

  async handle (operation, ...args) {
    const tokenData = await this.fetchAccessToken()
    const options = this[operation](tokenData.token, ...args)
    const data = await this.request(options)

    return data
  }

  fetchMaterial (token, mediaId, type, permanert) {
    let form = {}
    let fetchUrl = api.temporary.fetch

    if (permanert) {
      fetchUrl = api.permanent.fetch
    }

    let url = fetchUrl + 'access_token=' + token
    let options = {
      method: 'POST',
      url
    }

    if (permanert) {
      form.media_id = mediaId
      form.access_token = token
      options.body = form
    } else {
      if (type === 'video') {
        url = url.replace('https:', 'http:')
      }

      url += `&media_id=${mediaId}`
    }

    return options
  }

  deleteMaterial (token, mediaId) {
    const form = {
      media_id: mediaId
    }
    const url = `${api.permanent.del}access_token=${token}&media_id=${mediaId}`

    return {
      method: 'POST',
      url,
      body: form
    }
  }

  updateMaterial (token, mediaId, news) {
    let form = {
      media_id: mediaId
    }
    form = Object.assign(form, news)

    const url = `${api.permanent.update}access_token=${token}&media_id=${mediaId}`

    return {
      method: 'POST',
      url,
      body: form
    }
  }

  countMaterial (token) {
    const url = `${api.permanent.count}access_token=${token}`

    return {
      method: 'POST',
      url
    }
  }

  batchMaterial (token, options) {
    options.type = options.type || 'image'
    options.offset = options.offset || 0
    options.count = options.count || 10

    const url = `${api.permanent.batch}access_token=${token}`

    return {
      method: 'POST',
      url,
      body: options
    }
  }

  createTag (token, name) {
    const body = {
      tag: {
        name
      }
    }

    const url = api.tag.create + 'access_token=' + token

    return {
      method: 'POST',
      url,
      body
    }
  }

  fetchTags (token) {
    const url = api.tag.fetch + 'access_token=' + token

    return {
      url
    }
  }

  updateTag (token, id, name) {
    const body = {
      tag: {
        id,
        name
      }
    }

    const url = api.tag.update + 'access_token=' + token

    return {
      method: 'POST',
      url,
      body
    }
  }

  delTag (token, id) {
    const body = {
      tag: {
        id
      }
    }

    const url = api.tag.del + 'access_token=' + token

    return {
      method: 'POST',
      url,
      body
    }
  }

  fetchTagUsers (token, id, openId = '') {
    const body = {
      tagid: id,
      next_openid: openId
    }

    const url = api.tag.fetchUsers + 'access_token=' + token

    return {
      method: 'POST',
      url,
      body
    }
  }

  batchTag (token, openidList, id, unTag) {
    const body = {
      openid_list: openidList,
      tagid: id
    }

    let url = !unTag ? api.tag.batchTag : api.tag.batchUnTag
    url += 'access_token=' + token

    return {
      method: 'POST',
      url,
      body
    }
  }

  getUserTags (token, openId) {
    const body = {
      openid: openId
    }

    const url = api.tag.getUserTags + 'access_token=' + token

    return {
      method: 'POST',
      url,
      body
    }
  }

  fetchUserList (token, openId = '') {
    const url = `${api.user.fetch}access_token=${token}&next_openid=${openId}`

    return {
      url
    }
  }

  fetchUserInfo (token, openId, lang = 'CN') {
    const url = `${api.user.info}access_token=${token}&openid=${openId}&lang=${lang}`

    return {
      url
    }
  }

  fetchUserInfoList (token, openIdList) {
    const body = {
      user_list: openIdList
    }

    const url = api.user.batch + 'access_token=' + token

    return {
      method: 'POST',
      url,
      body
    }
  }

  createQrcode (token, qr) {
    const url = api.qrcode.create + 'access_token=' + token
    const body = qr

    return {
      method: 'POST',
      url,
      body
    }
  }

  showQrcode (ticket) {
    let t = encodeURI(ticket)
    const url = `${api.qrcode.show}ticket=${t}`

    return url
  }

  shortUrl (token, longUrl) {
    const url = api.shortUrl.create + 'access_token=' + token
    const body = {
      action: 'long2short',
      long_url: longUrl
    }

    return {
      method: 'POST',
      body,
      url
    }
  }

  semantic (token, data) {
    const url = api.semantic.search + 'access_token=' + token
    data.appid = this.appId

    return {
      method: 'POST',
      url,
      body: data
    }
  }

  aiTranslate (token, body) {
    const url = api.ai.translate + 'access_token=' + token + '&lfrom=zh_CN&lto=en_US'

    return {
      method: 'POST',
      url,
      body
    }
  }

  createMenu (token, menu) {
    const url = api.menu.create + 'access_token=' + token

    return {
      method: 'POST',
      url,
      body: menu
    }
  }

  deleteMenu (token, menu) {
    const url = api.menu.delete + 'access_token=' + token

    return {
      url
    }
  }

  async fetchTicket (token) {
    let data = await this.getTicket()

    if (!this.isValid(data, 'ticket')) {
      data = await this.updateTicket(token)
    }

    await this.saveTicket(data)

    return data
  }
  async updateTicket (token) {
    const url = `${api.ticket.getticket}access_token=${token}&type=jsapi`
    const data = await this.request({
      url
    })
    const now = new Date().getTime()
    const expiresIn = now + (data.expires_in - 20) * 1000

    data.expires_in = expiresIn

    return data
  }
}
