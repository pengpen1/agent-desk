import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import Store from 'electron-store'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const store = new Store()

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // 移除默认窗口边框
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden', // macOS使用hiddenInset
    backgroundColor: '#FFFFFF', // 设置背景色，防止透明问题
    autoHideMenuBar: true, // 自动隐藏菜单栏
    useContentSize: true, // 使尺寸适应内容区域
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // 添加允许WebSecurity为false以允许跨域
      webSecurity: false,
      // 设置背景色透明
      backgroundThrottling: false,
    },
    // 添加窗口无阴影
    hasShadow: false,
  })

  // 在开发环境中加载本地服务器
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // 在生产环境中加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 移除窗口边框
  mainWindow.setMenuBarVisibility(false)

  // 服务器配置存储
  ipcMain.handle('get-server-configs', () => {
    return store.get('serverConfigs') || []
  })

  ipcMain.handle('save-server-config', (event, config) => {
    const configs = store.get('serverConfigs') || []
    configs.push(config)
    store.set('serverConfigs', configs)
    return configs
  })

  // 主题设置
  ipcMain.handle('get-theme', () => {
    return store.get('theme') || 'light'
  })

  ipcMain.handle('set-theme', (event, theme) => {
    store.set('theme', theme)
    return theme
  })
  
  return mainWindow
}

app.whenReady().then(() => {
  const window = createWindow()
  
  // 添加窗口控制事件监听器
  ipcMain.handle('window-minimize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.minimize()
  })

  ipcMain.handle('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
    }
  })

  ipcMain.handle('window-close', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.close()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})