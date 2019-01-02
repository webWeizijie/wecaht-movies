const xml2js = require('xml2js')
const template = require('../wechat/tpl')
const sha1 = require('sha1')

const parseXML = xml => {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, {
      trim: true
    }, (err, content) => {
      err ? reject(err) : resolve(content)
    })
  })
}

const formatMessage = result => {
  let message = {}

  if (typeof result === 'object') {
    const keys = Object.keys(result)

    for (let i = 0; i < keys.length; i++) {
      let item = result[keys[i]]
      let key = keys[i]

      if (!(item instanceof Array) || item.length === 0) {
        continue
      }

      if (item.length === 1) {
        let val = item[0]

        if (typeof val === 'object') {
          message[key] = formatMessage(val)
        } else {
          message[key] = (val || '').trim()
        }
      } else {
        message[key] = []

        for (let j = 0; j < item.length; j++) {
          message[key].push(formatMessage(item[j]))
        }
      }
    }

    return message
  }
}

const tpl = (content = null, message) => {
  let type = 'text'

  if (Array.isArray(content)) {
    type = 'news'
  }

  console.log(content, 'content')
  if (content == null) {
    content = 'Empty News'
  }
  if (content && content.type) {
    type = content.type
  }
  let info = Object.assign({}, {
    content: content,
    msgType: type,
    createTime: new Date().getTime(),
    toUserName: message.FromUserName,
    fromUserName: message.ToUserName
  })

  return template(info)
}

const createNonce = () => {
  return Math.random().toString(36).substr(2, 16)
}
const createTimestame = () => {
  return parseInt(new Date().getTime() / 1000, 10) + ''
}

const signIt = (paramsObj) => {
  let keys = Object.keys(paramsObj)
  let newArgs = []
  let str = ''

  keys = keys.sort()
  keys.forEach(key => {
    newArgs[key.toLowerCase()] = paramsObj[key]
  })

  for (let k in newArgs) {
    str += '&' + k + '=' + newArgs[k]
  }

  return str.substr(1)
}

const shaIt = (nonce, ticket, timestamp, url) => {
  const ret = {
    jsapi_ticket: ticket,
    nonceStr: nonce,
    timestamp,
    url
  }

  const str = signIt(ret)
  const sha = sha1(str)

  return sha
}
const sign = (ticket, url) => {
  const nonceStr = createNonce()
  const timestamp = createTimestame()
  const signature = shaIt(nonceStr, ticket, timestamp, url)

  return {
    nonceStr,
    timestamp,
    signature
  }
}

const isWechat = (ua) => {
  if (ua.indexOf('MicroMessenger') >= 0) {
    return true
  } else {
    return false
  }
}

module.exports = {
  isWechat,
  parseXML,
  formatMessage,
  tpl,
  sign
}
