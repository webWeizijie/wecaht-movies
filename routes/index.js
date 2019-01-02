const router = require('koa-router')()
const Wechat = require('../controllers/wechat')
const User = require('../controllers/user')
const Index = require('../controllers/index')
const Category = require('../controllers/category')
const Movie = require('../controllers/movie')
const Comment = require('../controllers/comment')

const koaBody = require('koa-body')
// 微信消息中间件
router.get('/', Index.homePage)
router.get('/wx-hear', Wechat.hear)
router.post('/wx-hear', Wechat.hear)

// 跳转授权服务中心
router.get('/wx-oauth', Wechat.oauth)
router.get('/userinfo', Wechat.userInfo)

// 微信js_SDK
router.get('/sdk', Wechat.sdk)

// 微信js_SDK
router.post('/wechat/signature', Wechat.getSDKSignature)

// 用户注册
router.get('/user/signup', User.showSignup)
router.get('/user/signin', User.showSignin)
router.post('/user/signup', User.signup)
router.post('/user/signin', User.signin)
router.get('/logout', User.logout)

// 管理
router.get('/admin/user/list', User.signinRequired, User.adminRequired, User.list)
router.delete('/admin/user', User.signinRequired, User.adminRequired, User.del)

// 管理分类
router.get('/admin/category', User.signinRequired, User.adminRequired, Category.page)
router.post('/admin/category', User.signinRequired, User.adminRequired, Category.include)
router.get('/admin/category/list', User.signinRequired, User.adminRequired, Category.list)
router.get('/admin/category/update/:_id', User.signinRequired, User.adminRequired, Category.page)
router.delete('/admin/category', User.signinRequired, User.adminRequired, Category.del)

// 管理电影后台
router.get('/admin/movie', User.signinRequired, User.adminRequired, Movie.page)
router.post('/admin/movie', User.signinRequired, User.adminRequired, koaBody({
  multipart: true
}), Movie.savePoster, Movie.include)
router.get('/admin/movie/list', User.signinRequired, User.adminRequired, Movie.list)
router.get('/admin/movie/update/:_id', User.signinRequired, User.adminRequired, Movie.page)
router.delete('/admin/movie', User.signinRequired, User.adminRequired, Movie.del)

// 显示电影详情页
router.get('/movie/:_id', Movie.detail)

// 搜索
router.get('/results', Movie.search)

// 评论
router.post('/comment', User.signinRequired, Comment.save)

module.exports = router
