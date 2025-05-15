import { dialog } from 'electron'
import path from 'path'
import fs from 'fs/promises'

export default function registerDialogHandlers(ipcMain, win) {
  ipcMain.handle('showOpenDialog', async (event, options) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, options)
    if (!canceled) {
      const files = await Promise.all(
        filePaths.map(async (fpath) => {
          const stats = await fs.stat(fpath)
          return {
            path: fpath,
            name: path.basename(fpath),
            size: stats.size
          }
        })
      )
      return files
    } else {
      return []
    }
  })
}
