import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '../store/hooks'
import MonacoEditor from 'react-monaco-editor'
import { getServiceDetails, invokeService } from '../services/McpClientService'

interface Service {
  id: string
  name: string
  description: string
  version: string
  schema?: any // 服务参数的JSON Schema定义
}

interface InvocationResult {
  data: any
  status: number
  headers: Record<string, string>
  time: number
}

export default function ServiceInvoker() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const [service, setService] = useState<Service | null>(null)
  const [parameters, setParameters] = useState('{}')
  const [result, setResult] = useState<InvocationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchingService, setFetchingService] = useState(false)
  
  const activeConfigId = useAppSelector((state) => state.server.activeConfigId)
  const serverConfigs = useAppSelector((state) => state.server.configs)
  const activeServer = serverConfigs.find(config => config.id === activeConfigId)

  // 获取服务详情
  useEffect(() => {
    if (!serviceId || !activeServer) return
    
    const fetchServiceDetails = async () => {
      try {
        setFetchingService(true)
        setError(null)
        
        // 使用 MCP SDK 获取服务详情
        const serviceInfo = await getServiceDetails(serviceId)
        setService(serviceInfo)
      } catch (err) {
        console.error('Failed to fetch service details:', err)
        setError(t('failedToFetchServiceDetails'))
      } finally {
        setFetchingService(false)
      }
    }

    fetchServiceDetails()
  }, [serviceId, activeServer, t])

  const handleParameterChange = (value: string) => {
    setParameters(value)
  }

  const handleInvoke = async () => {
    if (!service || !activeServer || !serviceId) return
    
    try {
      setLoading(true)
      setError(null)
      
      // 解析参数JSON
      let parsedParams = {}
      try {
        parsedParams = JSON.parse(parameters)
      } catch (err) {
        setError(t('invalidParametersJson'))
        setLoading(false)
        return
      }
      
      // 使用 MCP SDK 调用服务
      const startTime = Date.now()
      const response = await invokeService(serviceId, parsedParams)
      const endTime = Date.now()
      
      // 为结果添加耗时数据
      response.time = endTime - startTime
      
      setResult(response)
    } catch (err: any) {
      console.error('Service invocation failed:', err)
      setError(
        err.response 
          ? `${t('invocationFailed')}: ${err.response.status} ${err.response.statusText}`
          : t('invocationFailed')
      )
      
      if (err.response) {
        setResult({
          data: err.response.data,
          status: err.response.status,
          headers: err.response.headers as Record<string, string>,
          time: 0
        })
      }
    } finally {
      setLoading(false)
    }
  }

  if (!activeServer) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-lg text-gray-600 dark:text-gray-400">{t('noServerConnected')}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {t('connectServer')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {fetchingService ? t('loading') : service ? service.name : t('serviceNotFound')}
        </h2>
        <button
          onClick={() => navigate('/services')}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {t('backToServices')}
        </button>
      </div>
      
      {fetchingService ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error && !service ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      ) : service ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 左侧：参数编辑器 */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">{t('parameters')}</h3>
              <div className="border border-gray-300 dark:border-gray-700 rounded">
                <MonacoEditor
                  language="json"
                  theme={useAppSelector((state) => state.theme.mode) === 'dark' ? 'vs-dark' : 'vs'}
                  value={parameters}
                  onChange={handleParameterChange}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    lineNumbers: 'on',
                    tabSize: 2,
                    fontSize: 14,
                    height: 300,
                  }}
                  height="300px"
                />
              </div>
              {error && (
                <div className="mt-2 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="mt-4">
                <button
                  onClick={handleInvoke}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {loading ? t('invoking') : t('invoke')}
                </button>
              </div>
            </div>

            {/* 服务信息 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">{t('serviceInfo')}</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{t('serviceId')}:</span>{' '}
                  <span className="text-gray-600 dark:text-gray-400">{service.id}</span>
                </p>
                {service.version && (
                  <p>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{t('version')}:</span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">{service.version}</span>
                  </p>
                )}
                {service.description && (
                  <p>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{t('description')}:</span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">{service.description}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：结果显示 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">{t('result')}</h3>
            {result ? (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('status')}: <span className={`font-medium ${result.status >= 400 ? 'text-red-600' : 'text-green-600'}`}>{result.status}</span>
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('time')}: <span className="font-medium">{result.time}ms</span>
                  </span>
                </div>
                <div className="border border-gray-300 dark:border-gray-700 rounded overflow-hidden">
                  <MonacoEditor
                    language="json"
                    theme={useAppSelector((state) => state.theme.mode) === 'dark' ? 'vs-dark' : 'vs'}
                    value={JSON.stringify(result.data, null, 2)}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      lineNumbers: 'on',
                      fontSize: 14,
                    }}
                    height="400px"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <p>{t('noResultYet')}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-8 rounded text-center">
          <p>{t('serviceNotFound')}</p>
        </div>
      )}
    </div>
  )
} 