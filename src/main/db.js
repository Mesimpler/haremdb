import loki from 'lokijs'
import { app } from 'electron'
import path from 'path'
import { is } from '@electron-toolkit/utils'

export function initDatabase() {
  const dbName = 'harem.db'
  const dbPath = is.dev
    ? path.join(app.getAppPath(), dbName)
    : path.join(path.dirname(app.getPath('exe')), dbName)

  const fsAdapter = new loki.LokiFsAdapter()
  const db = new loki(dbPath, {
    adapter: fsAdapter,
    autoload: true,
    autoloadCallback: () => {
      console.log(`Database loaded success : ${db.filename}`)
      let groups = db.getCollection('groups')
      if (!groups) {
        groups = db.addCollection('groups', {
          unique: ['name']
        })
        // some test data
        // groups.insert([
        //   {
        //     name: '原神'
        //   },
        //   {
        //     name: '英雄联盟'
        //   },
        //   {
        //     name: '星穹铁道'
        //   },
        //   {
        //     name: '火影忍者'
        //   },
        //   {
        //     name: '王者荣耀'
        //   },
        //   {
        //     name: '鬼灭之刃'
        //   },
        //   {
        //     name: '崩坏3'
        //   },
        //   {
        //     name: '赛博朋克2077'
        //   },
        //   {
        //     name: '哈利波特'
        //   },
        //   {
        //     name: '动物森友会'
        //   }
        // ])
      }
      let tags = db.getCollection('tags')
      if (!tags) {
        tags = db.addCollection('tags', {
          unique: ['name']
        })
        // some test data
        // tags.insert([
        //   {
        //     name: '琴'
        //   },
        //   {
        //     name: '雷电将军'
        //   },
        //   {
        //     name: '瓦尔特'
        //   },
        //   {
        //     name: '钟离'
        //   },
        //   {
        //     name: '纳西妲'
        //   },
        //   {
        //     name: '姬子'
        //   },
        //   {
        //     name: '丹恒'
        //   },
        //   {
        //     name: '三月七'
        //   },
        //   {
        //     name: '荧'
        //   },
        //   {
        //     name: '空'
        //   },
        //   {
        //     name: '布洛妮娅'
        //   },
        //   {
        //     name: '希儿'
        //   },
        //   {
        //     name: '景元'
        //   },
        //   {
        //     name: '符玄'
        //   },
        //   {
        //     name: '胡桃'
        //   },
        //   {
        //     name: '甘雨'
        //   },
        //   {
        //     name: '神里绫华'
        //   },
        //   {
        //     name: '八重神子'
        //   },
        //   {
        //     name: '银狼'
        //   },
        //   {
        //     name: '卡芙卡'
        //   },
        //   {
        //     name: '刃'
        //   },
        //   {
        //     name: '彦卿'
        //   },
        //   {
        //     name: '素裳'
        //   },
        //   {
        //     name: '宵宫'
        //   },
        //   {
        //     name: '达达利亚'
        //   },
        //   {
        //     name: '可莉'
        //   },
        //   {
        //     name: '阿贝多'
        //   },
        //   {
        //     name: '白露'
        //   },
        //   {
        //     name: '克拉拉'
        //   }
        // ])
      }
      let group_tags = db.getCollection('group_tags')
      if (!group_tags) {
        group_tags = db.addCollection('group_tags')
        // group_tags.insert([
        //   {
        //     tag_id: 1,
        //     group_id: 1
        //   },
        //   {
        //     tag_id: 2,
        //     group_id: 2
        //   },
        //   {
        //     tag_id: 3,
        //     group_id: 3
        //   }
        // ])
      }
      let images = db.getCollection('images')
      if (!images) {
        images = db.addCollection('images')
      }
      let image_tags = db.getCollection('image_tags')
      if (!image_tags) {
        image_tags = db.addCollection('image_tags')
      }
    },
    autosave: true,
    autosaveInterval: 5000
  })

  return db
}
