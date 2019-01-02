const mongoose = require('mongoose')

const cacheUser = async (ctx, next) => {
  let UserModel = mongoose.model('User')
  let user = ctx.session.user

  if (user && user._id) {
    user = await UserModel.findOne({
      _id: user._id
    })

    ctx.session.user = {
      role: user.role,
      _id: user._id,
      nickname: user.nickname
    }

    ctx.state = Object.assign(ctx.state, {
      user: {
        role: user.role,
        _id: user._id,
        nickname: user.nickname
      }
    })
  } else {
    ctx.session.user = {}
  }

  await next()
}

module.exports = cacheUser
