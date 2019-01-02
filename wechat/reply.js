const {
  resolve
} = require('path')
const commonMenu = require('./menu')
const help = '欢迎关注，时光的预热'
const config = require('../util/config')
const api = require('../api/index')

const reply = async (ctx, next) => {
  const message = ctx.weixin
  console.log(message, 'message')
  const mp = require('../wechat/index')
  let client = mp.getWechat()

  if (message.MsgType === 'voice') {
    let content = message.Recognition
    let reply = ''
    let movies = await api.movie.searchByKeyword(content)
    reply = []

    if (!movies || movies.length === 0) {
      let catData = await api.movie.findMovieByCat(content)

      if (catData) {
        movies = catData.movies
      }
    }

    if (!movies || movies.length === 0) {
      movies = await api.movie.searchByDouban(content)
    }

    if (!movies || movies.length) {
      movies = movies.slice(0, 4)

      movies.forEach(movie => {
        reply.push({
          title: movie.title,
          description: movie.summary,
          picUrl: movie.poster.indexOf('http') > -1 ? movie.poster : (config.baseUrl + '/upload/' + movie.poster),
          url: config.baseUrl + 'movie/' + movie._id
        })
      })
    } else {
      reply = '没有查询到与 ' + content + ' 相关的电影，要不要换一个名字试试看哦！'
    }

    ctx.body = reply
  }
  if (message.MsgType === 'image') {

  } else if (message.MsgType === 'event') {
    let reply
    if (message.Event === 'subscribe') {
      reply = '欢迎订阅' + '!扫码参数' + message.EventKey + '_' + message.ticket
    } else if (message.Event === 'SCAN') {
      reply = '关注后扫码二维码' + '!扫码参数' + message.EventKey + '_' + message.ticket
    } else if (message.Event === 'LOCATION') {
      reply = `维度${message.Latitude}-经度${message.Longitude}-精度${message.Precision}`
    } else if (message.Event === 'CLICK') {
      reply = `你点击了菜单的:${message.EventKey}`
      if (message.EventKet === 'help') {
        reply = help
      } else if (message.EventKey === 'movie_hot') {
        let movies = await api.movie.findHotMovies(-1, 4)
        reply = []
        movies.forEach((movie) => {
          reply.push({
            title: movie.title,
            description: movie.summary,
            picUrl: movie.poster,
            url: config.baseUrl + 'movie/' + movie._id
          })
        })
      } else if (message.EventKey === 'movie_code') {
        let movies = await api.movie.findHotMovies(1, 4)
        reply = []
        movies.forEach((movie) => {
          reply.push({
            title: movie.title,
            description: movie.summary,
            picUrl: movie.poster,
            url: config.baseUrl + 'movie/' + movie._id
          })
        })
      } else if (message.EventKey === 'movie_fci') {
        let catData = await api.movie.findMovieByCat('恐怖')
        reply = []
        catData.movies.forEach((movie) => {
          reply.push({
            title: movie.title,
            description: movie.summary,
            picUrl: movie.poster,
            url: config.baseUrl + 'movie/' + movie._id
          })
        })
      }
    } else if (message.Event === 'VIEW') {
      reply = `你点击了菜单链接:${message.EventKey}`
    } else if (message.Event === 'scancode_push') {
      reply = `你扫码了:${message.ScanCodeInfo.ScanType} ${message.ScanCodeInfo.ScanResult}`
    } else if (message.Event === 'scancode_waitmsg') {
      reply = `你扫码了:${message.ScanCodeInfo.ScanType} ${message.ScanCodeInfo.ScanResult}`
    } else if (message.Event === 'pic_sysphoto') {
      reply = `系统拍照:${message.SendPicsInfo.count} ${JSON.stringify(message.SendPicsInfo.PicList)}`
    } else if (message.Event === 'pic_photo_or_album') {
      reply = `系统拍照:${message.SendPicsInfo.count} ${JSON.stringify(message.SendPicsInfo.PicList)}`
    } else if (message.Event === 'pic_weixin') {
      reply = `系统拍照:${message.SendPicsInfo.count} ${JSON.stringify(message.SendPicsInfo.PicList)}`
    } else if (message.Event === 'location_select') {
      reply = `地理位置`
    }

    ctx.body = reply
  } else if (message.MsgType === 'text') {
    let content = message.Content
    let reply = 'Oh 你说的' + content + '太复杂了，无法解析'

    if (content === '1') {
      reply = '你说的是一'
    } else if (content === '2') {
      reply = '你说的是二'
    } else if (content === '4') {
      let data = await client.handle('uploadMaterial', 'image', resolve(__dirname, '../2.jpg'))

      reply = {
        type: 'image',
        mediaId: data.media_id
      }
    } else if (content === '5') {
      let data = await client.handle('uploadMaterial', 'video', resolve(__dirname, '../1.mp4'))

      reply = {
        type: 'video',
        title: '视频标题',
        description: '小视频',
        mediaId: data.media_id
      }
    } else if (content === '6') {
      let data = await client.handle('uploadMaterial', 'video', resolve(__dirname, '../1.mp4'), {
        type: 'video',
        description: '{"title":"这个地方很好","introduction":"good"}'
      })

      reply = {
        type: 'video',
        title: '视频标题2',
        description: '小视频',
        mediaId: data.media_id
      }
    } else if (content === '7') {
      let data = await client.handle('uploadMaterial', 'image', resolve(__dirname, '../2.jpg'), {
        type: 'image'
      })

      reply = {
        type: 'image',
        mediaId: data.media_id
      }
    } else if (content === '8') {
      let data = await client.handle('uploadMaterial', 'image', resolve(__dirname, '../2.jpg'), {
        type: 'image'
      })
      let data2 = await client.handle('uploadMaterial', 'pic', resolve(__dirname, '../2.jpg'), {
        type: 'image'
      })

      let media = {
        'articles': [{
          title: '这是服务端上传的图文',
          thumb_media_id: data.media_id,
          author: 'Wei',
          digest: '没有摘要',
          show_cover_pic: 1,
          content: '点击去往百度',
          content_source_url: 'http://www.baidu.com'
        }, {
          title: '这是服务端上传的图文2',
          thumb_media_id: data.media_id,
          author: 'Wei',
          digest: '没有摘要',
          show_cover_pic: 1,
          content: '点击去往github',
          content_source_url: 'http://www.github.com'
        }]
      }

      let uploadData = await client.handle('uploadMaterial', 'news', media, {})
      let newMedia = {
        media_id: uploadData.media_id,
        index: 0,
        articles: {
          title: '修改后的图文',
          thumb_media_id: data.media_id,
          author: 'Wei',
          digest: '没有摘要',
          show_cover_pic: 1,
          content: '点击去往百度',
          content_source_url: 'http://www.baidu.com'
        }
      }
      await client.handle('updateMaterial', uploadData.media_id, newMedia)
      let newData = await client.handle('fetchMaterial', uploadData.media_id, 'news', true)
      let items = newData.news_item
      let news = []
      items.forEach(ele => {
        news.push({
          title: ele.title,
          description: ele.description,
          picUrl: data2.url,
          url: ele.url
        })
      })

      reply = news
    } else if (content === '9') {
      await client.handle('countMaterial')

      let res = await Promise.all([
        client.handle('batchMaterial', {
          type: 'image',
          offset: 0,
          count: 10
        }),
        client.handle('batchMaterial', {
          type: 'video',
          offset: 0,
          count: 10
        }),
        client.handle('batchMaterial', {
          type: 'voice',
          offset: 0,
          count: 10
        }),
        client.handle('batchMaterial', {
          type: 'news',
          offset: 0,
          count: 10
        })
      ])

      reply = `image:${res[0].total_count}
            video:${res[1].total_count}
            voice:${res[2].total_count}
            news:${res[3].total_count}`
    } else if (content === '10') {
      // let newTag = await client.handle('createTag', 'fans')
      // let delData = await client.handle('delTag', 100)
      // let upData = await client.handle('updateTag', 101, 'love')
      // let add = await client.handle('batchTag', [message.FromUserName], 101, true)
      // let userList = await client.handle('fetchTagUsers', 101)
      // let userTags = await client.handle('getUserTags', message.FromUserName)

      let tagsdata = await client.handle('fetchTags')

      reply = tagsdata.tags.length
    } else if (content === '11') {
      let userList = await client.handle('fetchUserList')

      reply = userList.total
    } else if (content === '12') {
      await client.handle('fetchUserInfo', message.FromUserName)

      reply = 'j'
    } else if (content === '13') {
      await client.handle('fetchUserInfoList', [{
        openid: message.FromUserName,
        'lang': 'zh_CN'
      }])

      reply = 'j'
    } else if (content === '15') {
      let data = await client.handle('createQrcode', {
        'action_name': 'QR_LIMIT_SCENE',
        'action_info': {
          'scene': {
            'scene_id': 99
          }
        }
      })

      let code = client.showQrcode(data.ticket)
      let data2 = await client.handle('shortUrl', code)

      reply = data2.short_url
    } else if (content === '16') {
      let data = {
        'query': '查一下明天从北京到上海的南航机票',
        'city': '北京',
        'category': 'flight,hotel',
        'appid': 'wxaaaaaaaaaaaaaaaa',
        'uid': '123456'
      }
      let searchData = await client.handle('semantic', data)

      reply = searchData
    } else if (content === '17') {
      let body = '编程语言难学吗'
      let data = await client.handle('aiTranslate', body)

      reply = data.to_content
    } else if (content === '18') {
      let body = {
        'button': [{
          'type': 'click',
          'name': '今日歌曲',
          'key': 'V1001_TODAY_MUSIC'
        },
        {
          'name': '菜单',
          'sub_button': [{
            'type': 'scancode_push',
            'name': '扫一扫',
            'key': 'rselfmenu_0_0'
          },
          {
            'type': 'scancode_waitmsg',
            'name': '扫一扫等待',
            'key': 'rselfmenu_0_1'
          },
          {
            'type': 'pic_sysphoto',
            'name': '拍照',
            'key': 'rselfmenu_0_2'
          },
          {
            'type': 'pic_photo_or_album',
            'name': '拍照+相册',
            'key': 'rselfmenu_0_3'
          }
          ]
        },
        {
          'name': '测试',
          'sub_button': [{
            'type': 'pic_weixin',
            'name': '相册',
            'key': 'rselfmenu_0_4'
          },
          {
            'type': 'location_select',
            'name': '地理',
            'key': 'rselfmenu_0_5'
          }
          ]
        }
        ]
      }
      await client.handle('createMenu', body)
      reply = '菜单创建成功'
    } else if (content === '19') {
      await client.handle('deleteMenu')

      reply = '菜单删除成功'
    } else if (content === '更新菜单') {
      try {
        await client.handle('deleteMenu')
        await client.handle('createMenu', commonMenu)
      } catch (error) {
        console.log(error)
      }

      reply = '菜单创建成功，五分钟后更新'
    } else {
      let movies = await api.movie.searchByKeyword(content)
      reply = []

      if (!movies || movies.length === 0) {
        let catData = await api.movie.findMovieByCat(content)
        if (catData) {
          movies = catData.movies
        }
      }

      if (!movies || movies.length === 0) {
        movies = await api.movie.searchByDouban(content)
      }

      if (movies.length) {
        movies = movies.slice(0, 2)

        movies.forEach((movie) => {
          reply.push({
            title: movie.title,
            description: movie.summary,
            picUrl: movie.poster,
            url: config.baseUrl + 'movie/' + movie._id
          })
        })
      } else {
        reply = '没有查询到与' + content + '相关的电影'
      }
    }

    console.log(reply)
    ctx.body = reply
  }

  await next()
}
module.exports = reply
