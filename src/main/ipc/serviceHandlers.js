import { app, nativeImage } from 'electron'
import { is } from '@electron-toolkit/utils'
import path from 'path'
import fg from 'fast-glob'
import fs from 'fs'
import _ from 'lodash'

export default function registerServiceHandlers(ipcMain) {
  ipcMain.on('ondragstart', (event, filePath) => {
    try {
      const appRoot = is.dev
        ? path.join(app.getAppPath())
        : path.join(path.dirname(app.getPath('exe')))

      const absoluteFilePath = path.isAbsolute(filePath) ? filePath : path.join(appRoot, filePath)

      const image = nativeImage.createFromPath(absoluteFilePath)
      const resizedImage = image.resize({ width: 126 })

      event.sender.startDrag({
        icon: resizedImage,
        file: absoluteFilePath
      })
    } catch (error) {
      console.error(error)
    }
  })

  ipcMain.handle('autoTaggingCards', async (event, files) => {
    const results = []

    const folders = _.filter(files, (file) => {
      const stats = fs.statSync(file.path)
      return stats.isDirectory()
    })

    folders.forEach((folder) => {
      const pattern = path.join(folder.path, '**', '*.png').replace(/\\/g, '/')
      const pngFiles = fg.globSync(pattern, { absolute: true })

      pngFiles.forEach((file) => {
        const stats = fs.statSync(file)

        results.push({
          path: file,
          folderPath: folder.path,
          name: path.basename(file, '.png'),
          size: stats.size,
          tags: path.relative(path.join(folder.path, '../'), path.join(file, '../')).split(path.sep)
        })
      })
    })

    return results
  })

  ipcMain.handle('getAppRoot', async () => {
    const appRoot = is.dev
      ? path.join(app.getAppPath())
      : path.join(path.dirname(app.getPath('exe')))

    return appRoot
  })
}
