const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TokenSchema = new Schema({
  name: String,
  token: String,
  expires_in: Number,
  meta: {
    createAt: {
      type: Date,
      default: Date.now()
    },
    updatedAt: {
      type: Date,
      default: Date.now()
    }
  }
})

TokenSchema.pre('save', function (next) {
  if (this.isNew) {
    this.meta.createAt = this.meta.updatedAt = Date.now()
  } else {
    this.meta.updatedAt = Date.now()
  }

  next()
})

// statics 是给Token这样的表生成的方法 用这个schema new出来的表都会拥有这个静态方法
TokenSchema.statics = {
  async getAccessToken () {
    const token = await this.findOne({
      name: 'access_token'
    })

    if (token && token.token) {
      token.access_token = token.token
    }

    return token
  },
  async saveAccessToken (data) {
    let token = await this.findOne({
      name: 'access_tokken'
    })

    if (token) {
      token.token = data.access_token
      token.expires_in = data.expires_in
    } else {
      token = new Token({
        name: 'access_token',
        token: data.access_token,
        expires_in: data.expires_in
      })
    }

    await token.save()

    return token
  }
}

const Token = mongoose.model('Token', TokenSchema)