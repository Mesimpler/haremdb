import { shell, app } from 'electron'
import fse from 'fs-extra'

export default function registerShellHandlers(ipcMain) {
  ipcMain.handle('showFileInExploer', async (event, filePath) => {
    if (await fse.pathExists(filePath)) {
      shell.showItemInFolder(filePath)
      return true
    } else {
      return false
    }
  })

  ipcMain.handle('openExternalLink', async (event, url) => {
    shell
      .openExternal(url)
      .then(() => console.log('成功打开浏览器'))
      .catch((err) => console.error('打开失败:', err))
  })

  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })
}
