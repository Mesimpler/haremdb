import { useClosure, moveCardToDB, moveModToGame } from '../utils'
import path from 'path'
import _ from 'lodash'
import fse from 'fs-extra'

// =======================================
// lokijs
//
// 文档：http://techfort.github.io/LokiJS/index.html
// 沙盒：https://rawgit.com/techfort/LokiJS/master/examples/sandbox/LokiSandbox.htm
//
// 注意事项：
//
// 尽量使用 findAndRemove 和 findAndUpdate 方法来代替 remove 或 update 方法
// 无论是 findAndRemove, findAndUpdate, 还是 remove, update 都不会返回被操作的对象或数组
// 它们通常返回 [], {}, undefined 根据传入参数不同返回值也会不同, 这是难以一一处理的
//
// 绝大多数情况下是可以避免在循环内操作数据库的, 这类操作都能被数据库批量操作或条件查询替代
//
// findAndRemove：
// 支持删除匹配到的全部数据, 如果你只想删除一个请确保你的匹配值唯一
// 请勿对其传递空对象或直接调用, 会导致数据库清空
// =======================================

export default function registerTagHandlers(ipcMain, mainWindow, db) {
  const tagsCol = useClosure(() => db.getCollection('tags'))
  const groupsCol = useClosure(() => db.getCollection('groups'))
  const imagesCol = useClosure(() => db.getCollection('images'))
  const groupTagsCol = useClosure(() => db.getCollection('group_tags'))
  const imageTagsCol = useClosure(() => db.getCollection('image_tags'))

  // ========================================================
  //  分组 CRUD
  // ========================================================

  // 获取分组列表
  ipcMain.handle(
    'db:get-groups',
    async (event, { currentPage, pageSize, sortBy, search, joinTag = false }) => {
      try {
        // 构建查询条件
        let query = {}
        if (search && search.trim() !== '') {
          query.name = { $regex: new RegExp(search, 'i') } // 添加模糊搜索
        }

        // 获取总数
        let chain = groupsCol().chain().find(query)
        const total = chain.count()

        // 构建排序条件
        let sort = [['index', false]] // 默认按用户排序降序
        if (sortBy) {
          if (Array.isArray(sortBy) && sortBy.length > 0) {
            sort = sortBy.map((item) => [item.prop, item.order === 'descending'])
          } else if (typeof sortBy === 'object' && sortBy !== null && !Array.isArray(sortBy)) {
            sort = [[sortBy.prop, sortBy.order === 'descending']]
          }
        }

        // 分页处理
        const offset = (currentPage - 1) * pageSize
        let groups = chain.compoundsort(sort).offset(offset).limit(pageSize).data()

        // join 标签
        if (joinTag) {
          groups = groups.map((group) => {
            const tags = getTagsByGroupId(group.$loki)
            return { ...group, tags }
          })
        }

        return {
          isSuccess: true,
          msg: '获取标签列表成功',
          data: {
            list: groups,
            total
          }
        }
      } catch (error) {
        console.error(error)
        return {
          isSuccess: false,
          msg: '获取标签列表失败',
          data: error
        }
      }
    }
  )

  // 新增分组
  ipcMain.handle('db:add-group', async (event, addGroup) => {
    try {
      groupsCol().insert({ name: addGroup.name })

      return {
        isSuccess: true,
        msg: '添加分组成功',
        data: null
      }
    } catch (error) {
      let readableErrorMsg = '添加分组失败'
      if (error.toString().includes('Duplicate key')) {
        readableErrorMsg = '分组名称已存在：' + addGroup.name
      }
      console.error(error)
      return {
        isSuccess: false,
        msg: readableErrorMsg,
        data: error
      }
    }
  })

  // 更新分组
  ipcMain.handle('db:update-group', async (event, updateGroup) => {
    try {
      groupsCol().findAndUpdate({ $loki: updateGroup.$loki }, (group) => {
        group.name = updateGroup.name
        return group
      })
      return {
        isSuccess: true,
        msg: '修改分组成功',
        data: null
      }
    } catch (error) {
      let readableErrorMsg = '修改分组失败'
      if (error.toString().includes('Duplicate key')) {
        readableErrorMsg = '分组名称已存在：' + updateGroup.name
      }
      console.error(error)
      return {
        isSuccess: false,
        msg: readableErrorMsg,
        data: error
      }
    }
  })

  // 批量更新分组排序
  ipcMain.handle('db:update-groups-index', async (event, updateGroups) => {
    try {
      groupsCol()
        .chain()
        .find()
        .update((group) => {
          const update = updateGroups.find((g) => g.$loki === group.$loki)
          if (group) {
            group.index = update.index
          }
          return group
        })

      return {
        isSuccess: true,
        msg: '批量更新分组成功',
        data: null
      }
    } catch (error) {
      console.log(error)
      return {
        isSuccess: false,
        msg: '批量更新分组失败',
        data: error
      }
    }
  })

  // 删除分组
  ipcMain.handle('db:delete-group', async (event, { groupId, isCascadeDeleteTags = false }) => {
    try {
      groupsCol().findAndRemove({ $loki: groupId })

      // 需要先通过关联表查询关联的标签 再清理关联表中的该分组
      if (isCascadeDeleteTags) {
        const deleteTagIds = getTagsByGroupId(groupId).map((tag) => tag.$loki)
        deleteTags(deleteTagIds)
      }
      groupTagsCol().findAndRemove({ group_id: groupId })

      return {
        isSuccess: true,
        msg: '删除分组成功',
        data: null
      }
    } catch (error) {
      return {
        isSuccess: false,
        msg: '删除分组失败',
        data: error
      }
    }
  })

  // ========================================================
  //  标签 CRUD
  // ========================================================

  // 获取标签列表
  ipcMain.handle(
    'db:get-tags',
    async (event, { currentPage, pageSize, sortBy, search, joinGroup = false }) => {
      try {
        // 构建查询条件
        let query = {}
        if (search && search.trim() !== '') {
          query.name = { $regex: new RegExp(search, 'i') } // 添加模糊搜索
        }

        // 获取总数
        let chain = tagsCol().chain().find(query)
        const total = chain.count()

        // 构建排序条件
        let sort = [['$loki', false]] // 默认按ID降序
        if (sortBy) {
          if (Array.isArray(sortBy) && sortBy.length > 0) {
            sort = sortBy.map((item) => [item.prop, item.order === 'descending'])
          } else if (typeof sortBy === 'object' && sortBy !== null && !Array.isArray(sortBy)) {
            sort = [[sortBy.prop, sortBy.order === 'descending']]
          }
        }

        // 分页处理
        const offset = (currentPage - 1) * pageSize
        let tags = chain.compoundsort(sort).offset(offset).limit(pageSize).data()

        //   join 分组
        if (joinGroup) {
          tags = tags.map((tag) => {
            tag.groups = getGroupsByTagId(tag.$loki)
            return tag
          })
        }

        return {
          isSuccess: true,
          msg: '查询标签列表成功',
          data: {
            list: tags,
            total
          }
        }
      } catch (error) {
        console.error(error)
        return {
          isSuccess: false,
          msg: '查询标签列表失败',
          data: error
        }
      }
    }
  )

  // 新增标签
  ipcMain.handle('db:add-tag', async (event, addTag) => {
    try {
      const addedTag = tagsCol().insert({ name: addTag.name })

      // 如果传入了 groupIds , 建立关联
      if (!_.isEmpty(addTag.groups)) {
        const updateGroupTags = addTag.groups.map((group) => {
          return { group_id: group.$loki, tag_id: addedTag.$loki }
        })
        groupTagsCol().insert(updateGroupTags)
      }

      return {
        isSuccess: true,
        msg: '添加标签成功',
        data: addedTag
      }
    } catch (error) {
      let readableErrorMsg = '添加标签失败'
      if (error.toString().includes('Duplicate key')) {
        readableErrorMsg = '分组名称已存在：' + addTag.name
      }
      console.log(error)
      return {
        isSuccess: false,
        msg: readableErrorMsg,
        data: error
      }
    }
  })

  // 更新标签
  ipcMain.handle('db:update-tag', async (event, updateTag) => {
    try {
      // 不论字段是否真的更新，都进行 update 操作
      tagsCol().findAndUpdate({ $loki: updateTag.$loki }, (tag) => {
        tag.name = updateTag.name
        return tag
      })

      // 更新关联所属分组
      groupTagsCol().findAndRemove({ tag_id: updateTag.$loki })

      const updateGroupTags = updateTag.groups.map((group) => {
        return { group_id: group.$loki, tag_id: updateTag.$loki }
      })
      groupTagsCol().insert(updateGroupTags)

      return {
        isSuccess: true,
        msg: '修改标签成功',
        data: null
      }
    } catch (error) {
      let readableErrorMsg = '修改标签失败'
      if (error.toString().includes('Duplicate key')) {
        readableErrorMsg = '标签名称已存在：' + updateTag.name
      }
      console.log(error)
      return {
        isSuccess: false,
        msg: readableErrorMsg,
        data: error
      }
    }
  })

  // 删除标签
  ipcMain.handle('db:delete-tag', async (event, tagId) => {
    try {
      tagsCol().findAndRemove({ $loki: tagId })
      groupTagsCol().findAndRemove({ tag_id: tagId })

      return {
        isSuccess: true,
        msg: '删除标签成功',
        data: null
      }
    } catch (error) {
      console.error(error)
      return {
        isSuccess: false,
        msg: '删除标签失败',
        data: error
      }
    }
  })

  // 获取未分组标签
  ipcMain.handle('db:get-unc-tags', async () => {
    try {
      const tags = tagsCol().find()

      const tagGroups = tags.map((tag) => {
        tag.groups = getGroupsByTagId(tag.$loki)
        return tag
      })

      const uncTags = _.filter(tagGroups, (t) => _.isEmpty(t.groups))

      return {
        isSuccess: true,
        msg: '获取未分组标签成功',
        data: uncTags
      }
    } catch (error) {
      console.error(error)
      return {
        isSuccess: false,
        msg: '获取未分组标签失败',
        data: error
      }
    }
  })

  // ========================================================
  //  图像 CRUD
  // ========================================================

  // 新增图像
  ipcMain.handle('db:add-image', async (event, addImage, settings) => {
    try {
      const filePath = await moveCardToDB(addImage.path, settings.isCopyFile)

      let savedMods = []
      if (!_.isEmpty(addImage.mods) && !_.isEmpty(settings.gameRoot)) {
        savedMods = moveModToGame(addImage.mods, settings)
      }

      const addedImage = imagesCol().insert({
        name: addImage.name,
        path: filePath,
        size: addImage.size,
        remark: addImage.remark,
        mods: savedMods
      })

      // 如果传入 tags
      if (!_.isEmpty(addImage.tags)) {
        let existedTags = []
        let insertTags = []

        addImage.tags.forEach((tag) => {
          if (_.isObject(tag)) {
            existedTags.push(tag)
          } else {
            const queryTag = tagsCol().findOne({ name: tag })
            if (queryTag !== null) {
              existedTags.push(queryTag)
            } else {
              insertTags.push({ name: tag })
            }
          }
        })

        const insertedTags = tagsCol().insert(insertTags)
        existedTags = _.concat(existedTags, insertedTags)

        if (!_.isEmpty(existedTags)) {
          const insertImageTags = existedTags.map((tag) => {
            return { image_id: addedImage.$loki, tag_id: tag.$loki }
          })
          imageTagsCol().insert(insertImageTags)
        }
      }

      return {
        isSuccess: true,
        msg: '新增图片成功',
        data: null
      }
    } catch (error) {
      return {
        isSuccess: false,
        msg: '新增图片失败',
        data: error
      }
    }
  })

  // 获取图像列表
  ipcMain.handle(
    'db:get-images',
    async (event, { currentPage, pageSize, sortBy, searchName, searchTags, joinTag = false }) => {
      try {
        // 1. 首先处理标签名称过滤条件
        let imageIdsFromTags = []
        if (searchTags && searchTags.length > 0) {
          // 1.1 根据标签名称查找对应的标签ID
          const matchedTags = tagsCol().find({
            name: { $in: searchTags } // 查找名称匹配的标签
          })

          // 1.2 如果没有找到任何匹配的标签，直接返回空结果
          if (matchedTags.length === 0) {
            return {
              isSuccess: true,
              msg: '操作成功',
              data: {
                list: [],
                total: 0
              }
            }
          }

          // 1.3 获取包含这些标签的所有图片关联关系
          const tagIds = matchedTags.map((tag) => tag.$loki)
          const tagRelations = imageTagsCol().find({
            tag_id: { $in: tagIds }
          })

          // 1.4 统计每个图片匹配的标签数量
          const tagCounts = {}
          tagRelations.forEach((rel) => {
            tagCounts[rel.image_id] = (tagCounts[rel.image_id] || 0) + 1
          })

          // 1.5 只选择匹配所有搜索标签的图片ID
          imageIdsFromTags = Object.keys(tagCounts)
            .filter((imageId) => tagCounts[imageId] === searchTags.length)
            .map(Number)

          // 1.6 如果没有图片匹配所有标签，直接返回空结果
          if (imageIdsFromTags.length === 0) {
            return {
              isSuccess: true,
              msg: '操作成功',
              data: {
                list: [],
                total: 0
              }
            }
          }
        }

        // 2. 构建基础查询条件
        let query = {}
        if (searchName && searchName.trim() !== '') {
          query.name = { $regex: new RegExp(searchName, 'i') } // 图片名称模糊搜索
        }

        // 3. 合并标签过滤条件
        if (imageIdsFromTags.length > 0) {
          query.$loki = { $in: imageIdsFromTags }
        }

        // 4. 获取总数
        let chain = imagesCol().chain().find(query)
        const total = chain.count()

        // 5. 构建排序条件
        let sort = [['$loki', false]] // 默认按ID降序
        if (sortBy) {
          if (Array.isArray(sortBy) && sortBy.length > 0) {
            sort = sortBy.map((item) => [item.prop, item.order === 'descending'])
          } else if (typeof sortBy === 'object' && sortBy !== null && !Array.isArray(sortBy)) {
            sort = [[sortBy.prop, sortBy.order === 'descending']]
          }
        }

        // 6. 分页处理
        const offset = (currentPage - 1) * pageSize
        let images = chain.compoundsort(sort).offset(offset).limit(pageSize).data()

        // 7. 如果需要关联标签信息
        if (joinTag) {
          images = images.map((image) => {
            const tags = getTagsByImageId(image.$loki)
            return { ...image, tags }
          })
        }

        return {
          isSuccess: true,
          msg: '获取图像列表成功',
          data: {
            list: images,
            total
          }
        }
      } catch (error) {
        return {
          isSuccess: false,
          msg: '获取图像列表失败',
          data: error
        }
      }
    }
  )

  // 通过图像ID获取图像信息
  ipcMain.handle('db:get-image-byId', async (event, { imageId, joinTag = false }) => {
    try {
      const image = imagesCol().findOne({ $loki: imageId })

      if (joinTag) {
        image.tags = getTagsByImageId(image.$loki)
      }

      return {
        isSuccess: true,
        msg: '通过图像ID获取图像成功',
        data: image
      }
    } catch (error) {
      return {
        isSuccess: false,
        msg: '通过图像ID获取图像失败',
        data: error
      }
    }
  })

  // 更新图像
  ipcMain.handle('db:update-image', async (event, updateImage, settings) => {
    try {
      const srcImage = imagesCol().findOne({ $loki: updateImage.$loki })
      const newMods = _.filter(updateImage.mods, (m) => !_.includes(srcImage.mods, m.path))

      let savedMods = []
      if (!_.isEmpty(newMods.mods) && !_.isEmpty(settings.gameRoot)) {
        savedMods = moveModToGame(newMods, settings)
      }

      // 不论字段是否真的更新，都进行 update 操作
      imagesCol().findAndUpdate({ $loki: updateImage.$loki }, (img) => {
        img.name = updateImage.name
        img.remark = updateImage.remark
        img.mods = savedMods
        return img
      })

      // 删除所有关联标签 重新建立
      imageTagsCol().findAndRemove({ image_id: updateImage.$loki })
      if (!_.isEmpty(updateImage.tags)) {
        let existedTags = []
        let insertTags = []

        updateImage.tags.forEach((tag) => {
          if (_.isObject(tag)) {
            existedTags.push(tag)
          } else {
            const queryTag = tagsCol().findOne({ name: tag })
            if (queryTag !== null) {
              existedTags.push(queryTag)
            } else {
              insertTags.push({ name: tag })
            }
          }
        })

        const insertedTags = tagsCol().insert(insertTags)
        existedTags = _.concat(existedTags, insertedTags)

        if (!_.isEmpty(existedTags)) {
          const insertImageTags = existedTags.map((tag) => {
            return { image_id: updateImage.$loki, tag_id: tag.$loki }
          })
          imageTagsCol().insert(insertImageTags)
        }
      }

      return {
        isSuccess: true,
        msg: '更新图像成功',
        data: null
      }
    } catch (error) {
      console.log(error)
      return {
        isSuccess: false,
        msg: '更新图像失败',
        data: error
      }
    }
  })

  // 自增图像使用次数
  ipcMain.handle('db:add-image-usecount', async (event, imageId) => {
    try {
      let newUseCount = 0
      imagesCol().findAndUpdate({ $loki: imageId }, (img) => {
        img.useCount = img.useCount === undefined ? 1 : ++img.useCount
        newUseCount = img.useCount
        return img
      })

      return {
        isSuccess: true,
        msg: '更新图像使用次数成功',
        data: newUseCount
      }
    } catch (error) {
      console.log(error)
      return {
        isSuccess: false,
        msg: '更新图像使用次数失败',
        data: error
      }
    }
  })

  // 删除图像
  ipcMain.handle('db:delete-image', async (event, { $loki: imageId, path: imagePath }) => {
    try {
      imagesCol().findAndRemove({ $loki: imageId })
      imageTagsCol().findAndRemove({ image_id: imageId })
      fse.remove(imagePath)

      return {
        isSuccess: true,
        msg: '删除图像成功',
        data: null
      }
    } catch (error) {
      console.error(error)
      return {
        isSuccess: false,
        msg: '删除图像失败',
        data: error
      }
    }
  })

  // 更新图像路径
  ipcMain.handle('db:update-image-path', async () => {
    try {
      const cards = imagesCol().find({})

      cards.forEach((card) => {
        card.path = path.join('repo', path.basename(card.path))
      })

      imagesCol().update(cards)

      return {
        isSuccess: true,
        msg: '更新图像路径成功',
        data: null
      }
    } catch (error) {
      console.error(error)
      return {
        isSuccess: false,
        msg: '更新图像路径失败',
        data: error
      }
    }
  })

  // ========================================================
  //  分组展开面板的标签操作
  // ========================================================

  // 分组内添加标签
  ipcMain.handle('db:add-tag-in-group', async (event, { name, groupId }) => {
    try {
      // 存在检查
      const repeatTags = tagsCol().find({ name })
      const groupTags = getTagsByGroupId(groupId)

      // 分组包含该标签
      if (_.findIndex(groupTags, { name }) !== -1) {
        throw new Error('此分组下已包含该标签：' + name)
      }

      // 标签已存在, 建立关联表
      if (repeatTags.length > 0) {
        const existedTag = repeatTags[0]
        groupTagsCol().insert({
          group_id: groupId,
          tag_id: existedTag.$loki
        })
      } else {
        // 否则新建标签，再关联
        const addedTag = tagsCol().insert({ name })
        groupTagsCol().insert({
          group_id: groupId,
          tag_id: addedTag.$loki
        })
      }

      return {
        isSuccess: true,
        msg: '操作成功',
        data: null
      }
    } catch (error) {
      return {
        isSuccess: false,
        msg: '操作失败',
        data: error
      }
    }
  })
  // 分组内删除标签
  ipcMain.handle('db:remove-tag-in-group', async (event, { tagId, groupId }) => {
    try {
      groupTagsCol().findAndRemove({ tag_id: tagId, group_id: groupId })

      return {
        isSuccess: true,
        msg: '操作成功',
        data: null
      }
    } catch (error) {
      return {
        isSuccess: false,
        msg: '操作失败',
        data: error
      }
    }
  })
  // 查询分组内的标签
  ipcMain.handle('db:get-tags-by-groupId', async (event, groupId) => {
    try {
      const tags = getTagsByGroupId(groupId)
      return {
        isSuccess: true,
        msg: '操作成功',
        data: tags
      }
    } catch (error) {
      return {
        isSuccess: true,
        msg: '操作失败',
        data: error
      }
    }
  })

  // ========================================================
  //  级联操作函数 以一查多
  // ========================================================

  // 查询 Group 下的 Tags
  function getTagsByGroupId(groupId) {
    const groupTags = groupTagsCol().find({ group_id: groupId })
    const tagIds = groupTags.map((rel) => rel.tag_id)
    return tagsCol().find({ $loki: { $in: tagIds } })
  }
  // 查询 Tag 所属的 Groups
  function getGroupsByTagId(tagId) {
    const groupTags = groupTagsCol().find({ tag_id: tagId })
    const groupIds = groupTags.map((rel) => rel.group_id)
    return groupsCol().find({ $loki: { $in: groupIds } })
  }
  // 查询 Image 的 Tags
  function getTagsByImageId(imageId) {
    const imageTags = imageTagsCol().find({ image_id: imageId })
    const tagIds = imageTags.map((rel) => rel.tag_id)
    return tagsCol().find({ $loki: { $in: tagIds } })
  }

  // 批量删除标签并清理关联关系
  function deleteTags(tagIds) {
    // 1. 删除所有关联关系
    groupTagsCol().findAndRemove({ tag_id: { $in: tagIds } })
    // 2. 删除标签本身
    tagsCol().findAndRemove({ $loki: { $in: tagIds } })

    return
  }
}
