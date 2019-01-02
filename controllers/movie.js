const mongoose = require('mongoose')
const _ = require('lodash')
const Movie = mongoose.model('Movie')
const Category = mongoose.model('Category')
const Comment = mongoose.model('Comment')
const {
  readFile,
  writeFile
} = require('fs')
const {
  resolve
} = require('path')
const util = require('util')
const readFileAsync = util.promisify(readFile)
const writeFileAsync = util.promisify(writeFile)
const api = require('../api/index')

const page = async (ctx, next) => {
  const {
    _id
  } = ctx.params
  let movie = {}

  if (_id) {
    movie = api.movie.findMovieById(_id)
  }

  let categories = await api.movie.findCategoryies()

  await ctx.render('pages/movie_admin', {
    title: '后台分类录入页面',
    movie,
    categories
  })
}

const include = async (ctx, next) => {
  const movieData = ctx.request.body.fields || {}
  const categoryId = movieData.categoryId
  const categoryName = movieData.categoryName
  let movie, category

  if (movieData._id) {
    movie = await api.movie.findMovieById(movieData._id)
  }

  if (ctx.poster) {
    movieData.poster = ctx.poster
  }

  if (categoryId) {
    category = await api.movie.findCategoryById(categoryId)
  } else if (categoryName) {
    category = new Category({
      name: categoryName
    })
    await category.save()
  }

  if (movie) {
    movie = _.extend(movie, movieData)
    movie.category = category._id
  } else {
    delete movieData._id

    movieData.category = category._id
    movie = new Movie(movieData)
  }

  category = await api.movie.findCategoryById(category._id)

  if (category) {
    category.movies = category.movies || []
    category.movies.push(movie._id)

    await category.save()
  }

  await movie.save()

  ctx.redirect('/admin/movie/list')
}

const list = async (ctx, next) => {
  const movies = await api.movie.findMoviesAndCategory('name')

  await ctx.render('pages/movie_list', {
    title: '分类的列表页面',
    movies
  })
}

const del = async (ctx, next) => {
  const id = ctx.query.id
  const cat = await Category.findOne({
    movies: {
      $in: [id]
    }
  })

  if (cat && cat.movies.length) {
    const index = cat.movies.indexOf(id)

    cat.movies.splice(index, 1)
    await cat.save()
  }

  try {
    await Movie.remove({
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

const savePoster = async (ctx, next) => {
  const posterData = ctx.request.body.files.uploadPoster
  console.log(posterData, 'posterData')
  const filePath = posterData.path
  const fileName = posterData.name

  if (fileName) {
    const data = await readFileAsync(filePath)
    const timestamp = Date.now()
    const type = posterData.type.split('/')[1]
    const poster = timestamp + '.' + type
    const newPath = resolve(__dirname, '../', 'public/upload/' + poster)

    await writeFileAsync(newPath, data)

    ctx.poster = poster
  }

  await next()
}

const detail = async (ctx, next) => {
  const _id = ctx.params._id
  const movie = await Movie.findOne({
    _id
  })

  await Movie.update({
    _id
  }, {
    $inc: {
      pv: 1
    }
  })

  const comments = await Comment.find({
    movie: _id
  })
    .populate('from', '_id nickname')
    .populate('replies.from replies.to', '_id nickname')

  await ctx.render('pages/detail', {
    title: '电影详情页面',
    movie,
    comments
  })
}

const search = async (ctx, next) => {
  const {
    cat,
    q,
    p
  } = ctx.query
  const page = parseInt(p, 10) || 0
  const count = 2
  const index = page * count

  if (cat) {
    const categories = await api.movie.searchByCategroy(cat)
    const category = categories[0]
    let movies = category.movies || []
    let results = movies.slice(index, index + count)

    await ctx.render('pages/results', {
      title: '分类搜索结果页面',
      keyword: category.name,
      currentPage: (page + 1),
      query: 'cat=' + cat,
      totalPage: Math.ceil(movies.length / count),
      movies: results
    })
  } else {
    let movies = await api.movie.searchByKeyword(q)
    let results = movies.slice(index, index + count)

    await ctx.render('pages/results', {
      title: '关键词搜索结果页面',
      keyword: q,
      currentPage: (page + 1),
      query: 'q=' + q,
      totalPage: Math.ceil(movies.length / count),
      movies: results
    })
  }
}

module.exports = {
  search,
  detail,
  savePoster,
  del,
  list,
  page,
  include
}
