const mongoose = require('mongoose')
const Category = mongoose.model('Category')
const Movie = mongoose.model('Movie')
const api = require('../api/index')

const page = async (ctx, next) => {
  const {
    _id
  } = ctx.params
  let category = {}

  if (_id) {
    category = await api.movie.findCategoryById(_id)
  }
  await ctx.render('pages/category_admin', {
    title: '后台分类录入页面',
    category
  })
}

const include = async (ctx, next) => {
  const {
    name,
    _id
  } = ctx.request.body.category
  let category

  if (_id) {
    category = await api.movie.findCategoryById(_id)
  }
  if (category) {
    category.name = name
  } else {
    category = new Category({
      name
    })
  }

  await category.save()

  ctx.redirect('/admin/category/list')
}

const list = async (ctx, next) => {
  const categories = await api.movie.findCategoryies()

  await ctx.render('pages/category_list', {
    title: '分类的列表页面',
    categories
  })
}

const del = async (ctx, next) => {
  const id = ctx.query.id

  try {
    await Category.remove({
      _id: id
    })
    await Movie.remove({
      category: id
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

module.exports = {
  del,
  list,
  page,
  include
}
