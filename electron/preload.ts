import { contextBridge, ipcRenderer } from 'electron';

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  startCmdServer: (command: string, args: string[]) => 
    ipcRenderer.invoke('start-cmd-server', command, args),
  stopCmdServer: (id: string) => 
    ipcRenderer.invoke('stop-cmd-server', id),
  startPkgServer: (packageManager: string, packageName: string, args: string[]) => 
    ipcRenderer.invoke('start-pkg-server', packageManager, packageName, args),
  onServerOutput: (callback: (event: any, data: any) => void) => 
    ipcRenderer.on('server-output', callback),
  onServerExit: (callback: (event: any, data: any) => void) => 
    ipcRenderer.on('server-exit', callback),
  removeServerOutputListener: () => 
    ipcRenderer.removeAllListeners('server-output'),
  removeServerExitListener: () => 
    ipcRenderer.removeAllListeners('server-exit'),
});