const mongoose = require('mongoose')
const Category = mongoose.model('Category')
const Movie = mongoose.model('Movie')
const rp = require('request-promise')
const _ = require('lodash')

const updateMovies = async (movie) => {
  const options = {
    url: `https://api.douban.com/v2/movie/subject/${movie.doubanId}`,
    json: true
  }

  const data = await rp(options)
  _.extend(movie, {
    country: data.countries[0],
    language: data.language,
    summary: data.summary
  })

  const genres = movie.genres

  if (genres && genres.length) {
    let catArray = []

    genres.forEach(genre => {
      catArray.push((async () => {
        let cat = await Category.findOne({
          name: genre
        })

        if (cat) {
          cat.movies.push(movie._id)

          await cat.save()
        } else {
          cat = new Category({
            name: genre,
            movies: [movie._id]
          })

          cat = await cat.save()

          movie.category = cat._id
          await movie.save()
        }
      })())
    })

    Promise.all(catArray)
  } else {
    movie.save()
  }
}

exports.searchByCategroy = async (catId) => {
  const data = await Category.find({
    _id: catId
  }).populate({
    path: 'movies',
    select: '_id title poster',
    options: {
      limit: 8
    }
  })

  return data
}

exports.searchByKeyword = async (q) => {
  const data = await Movie.find({
    title: new RegExp(q + '.*', 'i')
  })

  return data
}

exports.findMovieById = async (id) => {
  const data = await Movie.findOne({
    _id: id
  })

  return data
}

exports.findCategoryById = async (id) => {
  const data = await Category.findOne({
    _id: id
  })

  return data
}

exports.findCategoryies = async (id) => {
  const data = await Category.find({})

  return data
}

exports.findMoviesAndCategory = async (fields) => {
  const data = await Movie.find({}).populate('category', fields)

  return data
}

exports.findHotMovies = async (hot, count) => {
  const data = await Movie.find({}).sort({
    pv: hot
  }).limit(count)

  return data
}

exports.findMovieByCat = async (cat) => {
  const data = await Category.findOne({
    name: cat
  }).populate({
    path: 'movies',
    select: '_id title poster'
  })

  return data
}

exports.searchByDouban = async (q) => {
  const options = {
    url: `https://api.douban.com/v2/movie/search?q=${encodeURIComponent(q)}`,
    json: true
  }

  const data = await rp(options)
  let subjects = []
  let movies = []

  if (data && data.subjects) {
    subjects = data.subjects
  }

  if (subjects.length > 0) {
    let queryArray = []

    subjects.forEach(item => {
      queryArray.push((async () => {
        let movie = await Movie.findOne({
          doubanId: item.id
        })

        if (movie) {
          movies.push(movie)
        } else {
          const directors = item.directors || []
          const director = directors[0] ? directors[0].name : ''
          movie = new Movie({
            title: item.title,
            director: director,
            doubanId: item.id,
            year: item.year,
            poster: item.images.large
          })

          await movie.save()
          movies.push(movie)
        }
      })())
    })

    await Promise.all(queryArray)

    movies.forEach(movie => {
      updateMovies(movie)
    })
  }
  return movies
}
