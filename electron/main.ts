import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import Store from 'electron-store';

// Define a type for server config
interface ServerConfig {
  id: string;
  name: string;
  type: string;
  config: {
    baseUrl?: string;
    command?: string;
    packageManager?: string;
    packageName?: string;
    [key: string]: string | undefined;
  };
}

// Initialize Store
const store = new Store();

// 保存所有通过命令行或包管理器启动的服务器进程
const serverProcesses: Map<string, ChildProcess> = new Map();

// 创建主窗口
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // 移除默认窗口边框
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden', // macOS使用hiddenInset
    trafficLightPosition: { x: 10, y: 10 }, // macOS窗口控制按钮位置
    transparent: false,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 在开发模式下加载本地服务器
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
      details.requestHeaders['Origin'] = 'http://localhost:5173';
      callback({ requestHeaders: details.requestHeaders });
    });
    mainWindow.loadURL('http://localhost:5173/');
    mainWindow.webContents.openDevTools();
  } else {
    // 在生产模式下加载打包后的 index.html
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 打开外部链接在默认浏览器中
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 服务器配置存储
  ipcMain.handle('get-server-configs', () => {
    return (store.get('serverConfigs') as ServerConfig[]) || [];
  });

  ipcMain.handle('save-server-config', (event, config: ServerConfig) => {
    const configs: ServerConfig[] = (store.get('serverConfigs') as ServerConfig[]) || [];
    configs.push(config);
    store.set('serverConfigs', configs);
    return configs;
  });

  // 主题设置
  ipcMain.handle('get-theme', () => {
    return store.get('theme') || 'light';
  });

  ipcMain.handle('set-theme', (event, theme) => {
    store.set('theme', theme);
    return theme;
  });

  return mainWindow;
}

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
  const window = createWindow();

  // 添加窗口控制事件监听器
  ipcMain.handle('window-minimize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });

  ipcMain.handle('window-close', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.close();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 当所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  
  // 清理所有启动的服务器进程
  for (const serverProcess of serverProcesses.values()) {
    serverProcess.kill();
  }
});

// 启动命令行服务器
ipcMain.handle('start-cmd-server', async (_, command: string, args: string[]) => {
  try {
    const id = uuidv4();
    const serverProcess = spawn(command, args, {
      shell: true,
      env: process.env,
    });

    serverProcesses.set(id, serverProcess);

    // 收集输出
    let output = '';
    
    serverProcess.stdout?.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      // 将输出发送给渲染进程
      BrowserWindow.getAllWindows()[0]?.webContents.send('server-output', {
        id,
        data: chunk,
        type: 'stdout'
      });
    });

    serverProcess.stderr?.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      // 将错误输出发送给渲染进程
      BrowserWindow.getAllWindows()[0]?.webContents.send('server-output', {
        id,
        data: chunk,
        type: 'stderr'
      });
    });

    serverProcess.on('exit', (code) => {
      BrowserWindow.getAllWindows()[0]?.webContents.send('server-exit', {
        id,
        code
      });
      serverProcesses.delete(id);
    });

    // 等待服务器启动（可以通过输出中的特定字符串判断）
    await new Promise(resolve => setTimeout(resolve, 1000));

    return { id, output };
  } catch (error) {
    console.error('启动服务器失败:', error);
    throw error;
  }
});

// 停止命令行服务器
ipcMain.handle('stop-cmd-server', async (_, id: string) => {
  const serverProcess = serverProcesses.get(id);
  if (serverProcess) {
    serverProcess.kill();
    serverProcesses.delete(id);
    return { success: true };
  }
  return { success: false, error: '服务器未找到' };
});

// 启动包管理器服务器（特殊处理 npx, bun, uvx 等）
ipcMain.handle('start-pkg-server', async (_, packageManager: string, packageName: string, args: string[]) => {
  try {
    const id = uuidv4();
    const serverProcess = spawn(packageManager, [packageName, ...args], {
      shell: true,
      env: process.env,
    });

    serverProcesses.set(id, serverProcess);

    // 收集输出
    let output = '';
    
    serverProcess.stdout?.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      // 将输出发送给渲染进程
      BrowserWindow.getAllWindows()[0]?.webContents.send('server-output', {
        id,
        data: chunk,
        type: 'stdout'
      });
    });

    serverProcess.stderr?.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      // 将错误输出发送给渲染进程
      BrowserWindow.getAllWindows()[0]?.webContents.send('server-output', {
        id,
        data: chunk,
        type: 'stderr'
      });
    });

    serverProcess.on('exit', (code) => {
      BrowserWindow.getAllWindows()[0]?.webContents.send('server-exit', {
        id,
        code
      });
      serverProcesses.delete(id);
    });

    // 等待服务器启动（可以通过输出中的特定字符串判断）
    await new Promise(resolve => setTimeout(resolve, 1000));

    return { id, output };
  } catch (error) {
    console.error('启动包管理器服务器失败:', error);
    throw error;
  }
});

// 停止包管理器服务器
ipcMain.handle('stop-pkg-server', async (_, id: string) => {
  const serverProcess = serverProcesses.get(id);
  if (serverProcess) {
    serverProcess.kill();
    serverProcesses.delete(id);
    return { success: true };
  }
  return { success: false, error: '服务器未找到' };
});