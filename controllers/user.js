const mongoose = require('mongoose')
const User = mongoose.model('User')

exports.showSignup = async (ctx, next) => {
  await ctx.render('pages/signup', {
    title: '注册页面'
  })
}

exports.showSignin = async (ctx, next) => {
  await ctx.render('pages/signin', {
    title: '登录页面'
  })
}

exports.signup = async (ctx, next) => {
  const {
    email,
    password,
    nickname
  } = ctx.request.body.user

  let user = await User.findOne({
    email
  })

  if (user) return ctx.redirect('/user/signin')

  user = new User({
    email,
    password,
    nickname
  })

  ctx.session.user = {
    role: user.role,
    _id: user._id,
    nickname: user.nickname
  }

  user = await user.save()

  ctx.redirect('/')
}

// 登录判断
exports.signin = async (ctx, next) => {
  const {
    email,
    password
  } = ctx.request.body.user
  const user = await User.findOne({
    email
  })

  if (!user) return ctx.redirect('/user/signup')

  const isMatch = await user.comparePassword(password, user.password)

  if (isMatch) {
    ctx.session.user = {
      role: user.role,
      _id: user._id,
      nickname: user.nickname
    }

    ctx.redirect('/')
  } else {
    ctx.redirect('/user/signin')
  }
}

exports.logout = async (ctx, next) => {
  ctx.session.user = {}

  ctx.redirect('/')
}

exports.list = async (ctx, next) => {
  const users = await User.find({}).sort('meta.updatedAt')

  await ctx.render('pages/userlist', {
    title: '用户列表页面',
    users
  })
}

exports.signinRequired = async (ctx, next) => {
  const user = ctx.session.user

  if (!user || !user._id) {
    return ctx.redirect('/user/signin')
  }

  await next()
}

exports.adminRequired = async (ctx, next) => {
  const user = ctx.session.user

  if (user.role !== 'admin') {
    return ctx.redirect('/user/signin')
  }

  await next()
}

exports.del = async (ctx, next) => {
  const id = ctx.query.id
  let movie

  if (id) {
    movie = await User.findOne({
      _id: id
    })
  }

  if (!movie) {
    return (ctx.body = {
      success: false
    })
  }

  try {
    await User.remove({
      _id: id
    })
    ctx.body = {
      success: true
    }
  } catch (error) {
    ctx.body = {
      success: false
    }
  }
}
