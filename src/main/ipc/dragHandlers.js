import { nativeImage } from 'electron'

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
}
