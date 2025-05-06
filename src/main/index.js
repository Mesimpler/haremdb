import { app, BrowserWindow, ipcMain, protocol, net } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from './mw'
import { initDatabase } from './db'
import { convertPath } from './utils'

const db = initDatabase()

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local-resource',
    privileges: {
      secure: true,
      supportFetchAPI: true, // impotant
      standard: true,
      bypassCSP: true, // impotant
      stream: true
    }
  }
])

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const mainWindow = createMainWindow()

  // IPC load
  const ipcModules = import.meta.glob('./ipc/*.js', { eager: true })
  Object.values(ipcModules).forEach((module) => {
    if (module.default && typeof module.default === 'function') {
      module.default(ipcMain, mainWindow, db)
    }
  })

  // 主题切换支持
  ipcMain.on('changeWinbar', async (event, options) => {
    mainWindow.setTitleBarOverlay(options)
  })

  // 等待首屏加载延迟
  setTimeout(() => {
    mainWindow.show()
  }, 3000)

  // protocol
  protocol.handle('local-resource', async (request) => {
    const decodedUrl = decodeURIComponent(
      request.url.replace(new RegExp(`^local-resource://`, 'i'), '/')
    )
    const fullPath = process.platform === 'win32' ? convertPath(decodedUrl) : decodedUrl
    return net.fetch(`file://${fullPath}`)
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
