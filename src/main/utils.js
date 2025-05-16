import _ from 'lodash'
import fse from 'fs-extra'
import { app } from 'electron'
import path from 'path'
import { is } from '@electron-toolkit/utils'

/**
 * 创建一个惰性求值的闭包缓存
 * @param {Function} initializer 初始化函数
 * @returns {Function} 返回获取缓存值的函数
 */
export function useClosure(initializer) {
  let cache
  return () => (cache ??= initializer())
}

/**
 * 将Unix路径转换为Windows路径格式
 * @param {string} originalPath 原始路径
 * @returns {string} 转换后的路径
 */
export function convertPath(originalPath) {
  const match = originalPath.match(/^\/([a-zA-Z])\/(.*)$/)
  if (match) {
    return `${match[1]}:/${match[2]}`
  } else {
    return originalPath
  }
}

/**
 * 判断两个数组是否包含相同的元素（顺序无关，仅比较元素是否相同）
 * @param {Array} arr1 第一个数组
 * @param {Array} arr2 第二个数组
 * @returns {boolean} 如果两个数组包含相同元素（无论顺序），返回 `true`，否则返回 `false`
 */
export function areArraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false
  }

  const sortedArr1 = [...arr1].sort()
  const sortedArr2 = [...arr2].sort()

  return _.isEqual(sortedArr1, sortedArr2)
}

/**
 * 对某个对象收集指定键值对
 * @param {Object} obj 被收集的原始对象
 * @param {Array} keysToCollect 需要收集的键名数组
 * @returns {Object} 返回收集后的对象
 */
export function collectTheKey(obj, keysToCollect) {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => keysToCollect.includes(key)))
}

/**
 * 将card文件复制到DB中
 * @param {String} filePath 待复制文件
 *
 * fs-extra doc: https://github.com/jprichardson/node-fs-extra
 */
export async function moveCardToDB(filePath, reserveSourceFile = true) {
  const uniqueFileName = `hdb_${Date.now()}_${Math.floor(Math.random() * 1000)}${path.extname(filePath)}`
  const relativeFilePath = path.join('repo', uniqueFileName)

  let fileRepoPath = null
  const appRoot = is.dev ? app.getAppPath() : path.dirname(app.getPath('exe'))
  fileRepoPath = path.join(appRoot, relativeFilePath)

  if (reserveSourceFile) {
    await fse.copy(filePath, fileRepoPath)
  } else {
    await fse.move(filePath, fileRepoPath)
  }

  return relativeFilePath
}

/**
 * 将mod文件复制到游戏中
 *
 */
export function moveModToGame(mods, appSettings) {
  const savedMods = mods.map((mod) => {
    mod.srcPath = mod.path
    mod.path = path.join(appSettings.gameRoot, 'mods', 'haremdb', mod.name)
    return mod
  })
  savedMods.forEach((mod) => {
    if (fse.pathExistsSync(mod.path)) return

    if (appSettings.isCopyFile) {
      fse.copySync(mod.srcPath, mod.path)
    } else {
      fse.moveSync(mod.srcPath, mod.path)
    }
  })

  return savedMods
}
