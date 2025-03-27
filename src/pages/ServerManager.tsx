import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addServerConfig, removeServerConfig, setActiveConfig, setConnectionStatus, type ServerConfig } from '../store/slices/serverSlice'
import { connectToServer, disconnectFromServer } from '../services/McpClientService'

const { ipcRenderer } = window.require('electron')

export default function ServerManager() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const servers = useAppSelector((state) => state.server.configs)
  const activeConfigId = useAppSelector((state) => state.server.activeConfigId)
  const connectionStatus = useAppSelector((state) => state.server.connectionStatus)

  const [isAddingServer, setIsAddingServer] = useState(false)
  const [newServer, setNewServer] = useState<Omit<ServerConfig, 'id'>>({
    name: '',
    type: 'http',
    config: {},
  })
  const [connectError, setConnectError] = useState<string | null>(null)

  const handleAddServer = async () => {
    const serverConfig: ServerConfig = {
      id: uuidv4(),
      ...newServer,
    }

    dispatch(addServerConfig(serverConfig))
    await ipcRenderer.invoke('save-server-config', serverConfig)
    setIsAddingServer(false)
    setNewServer({ name: '', type: 'http', config: {} })
  }

  const handleConnect = async (serverId: string) => {
    setConnectError(null)
    dispatch(setConnectionStatus('connecting'))
    
    const serverConfig = servers.find((config: { id: string }) => config.id === serverId)
    if (!serverConfig) {
      setConnectError(t('serverNotFound'))
      dispatch(setConnectionStatus('disconnected'))
      return
    }

    try {
      // 使用MCP SDK连接到服务器
      await connectToServer(serverConfig)
      dispatch(setActiveConfig(serverId))
      dispatch(setConnectionStatus('connected'))
    } catch (error) {
      console.error('Failed to connect:', error)
      setConnectError(error instanceof Error ? error.message : String(error))
      dispatch(setConnectionStatus('disconnected'))
    }
  }

  const handleDisconnect = async () => {
    try {
      // 使用MCP SDK断开连接
      await disconnectFromServer()
      dispatch(setConnectionStatus('disconnected'))
      // @ts-expect-error - setActiveConfig expects a string but we need to pass null
      dispatch(setActiveConfig(null))
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('servers')}</h2>
        <button
          onClick={() => setIsAddingServer(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {t('addServer')}
        </button>
      </div>

      {connectError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{t('connectionError')}: {connectError}</p>
        </div>
      )}

      {/* 服务器列表 */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {servers.map((server: ServerConfig) => (
          <div
            key={server.id}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{server.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t(server.type)}</p>
              </div>
              <button
                onClick={() => dispatch(removeServerConfig(server.id))}
                className="text-red-600 hover:text-red-700"
              >
                {t('delete')}
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              {server.config.baseUrl && <div>URL: {server.config.baseUrl}</div>}
              {server.config.command && <div>{t('command')}: {server.config.command}</div>}
              {server.config.packageManager && (
                <div>
                  {t('packageManager')}: {server.config.packageManager} {server.config.packageName}
                </div>
              )}
            </div>
            <div className="mt-4">
              {activeConfigId === server.id ? (
                <button
                  onClick={handleDisconnect}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  {t('disconnect')}
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(server.id)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  disabled={connectionStatus === 'connecting'}
                >
                  {t('connect')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 添加服务器表单 */}
      {isAddingServer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t('addServer')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('serverName')}
                </label>
                <input
                  type="text"
                  value={newServer.name}
                  onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('serverType')}
                </label>
                <select
                  value={newServer.type}
                  onChange={(e) => setNewServer({ ...newServer, type: e.target.value as ServerConfig['type'] })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="http">{t('http')}</option>
                  <option value="command">{t('command')}</option>
                  <option value="package">{t('package')}</option>
                </select>
              </div>

              {/* 根据服务器类型显示不同的配置选项 */}
              {newServer.type === 'http' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('baseUrl')}
                  </label>
                  <input
                    type="text"
                    value={newServer.config.baseUrl || ''}
                    onChange={(e) =>
                      setNewServer({
                        ...newServer,
                        config: { ...newServer.config, baseUrl: e.target.value },
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              )}

              {newServer.type === 'command' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('command')}
                  </label>
                  <input
                    type="text"
                    value={newServer.config.command || ''}
                    onChange={(e) =>
                      setNewServer({
                        ...newServer,
                        config: { ...newServer.config, command: e.target.value },
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              )}

              {newServer.type === 'package' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('packageManager')}
                    </label>
                    <select
                      value={newServer.config.packageManager || 'npx'}
                      onChange={(e) =>
                        setNewServer({
                          ...newServer,
                          config: { ...newServer.config, packageManager: e.target.value as 'npx' | 'bun' | 'uvx' },
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="npx">npx</option>
                      <option value="bun">bun</option>
                      <option value="uvx">uvx</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('packageName')}
                    </label>
                    <input
                      type="text"
                      value={newServer.config.packageName || ''}
                      onChange={(e) =>
                        setNewServer({
                          ...newServer,
                          config: { ...newServer.config, packageName: e.target.value },
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsAddingServer(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleAddServer}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={!newServer.name}
                >
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 