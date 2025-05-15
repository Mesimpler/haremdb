import { nativeImage } from 'electron'
import path from 'path'
import fg from 'fast-glob'
import fs from 'fs'
import _ from 'lodash'

export default function registerDragHandlers(ipcMain) {
  ipcMain.on('ondragstart', (event, filePath) => {
    try {
      const image = nativeImage.createFromPath(filePath)
      const resizedImage = image.resize({ width: 126 })

      event.sender.startDrag({
        icon: resizedImage,
        file: filePath
      })
    } catch (error) {
      console.error(error)
      event.sender.startDrag({
        icon: filePath,
        file: filePath
      })
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
}
