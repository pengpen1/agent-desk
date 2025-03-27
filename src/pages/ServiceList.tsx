import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '../store/hooks'
import { getServices } from '../services/McpClientService'

interface Service {
  id: string
  name: string
  description: string
  version: string
}

export default function ServiceList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const activeConfigId = useAppSelector((state) => state.server.activeConfigId)
  const serverConfigs = useAppSelector((state) => state.server.configs)
  const connectionStatus = useAppSelector((state) => state.server.connectionStatus)
  
  const activeServer = serverConfigs.find(config => config.id === activeConfigId)

  useEffect(() => {
    if (connectionStatus !== 'connected' || !activeServer) {
      setServices([])
      return
    }

    const fetchServices = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // 使用 MCP SDK 获取服务列表
        const servicesList = await getServices()
        setServices(servicesList)
      } catch (err) {
        console.error('Failed to fetch services:', err)
        setError(t('failedToFetchServices'))
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [activeServer, connectionStatus, t])

  const handleServiceClick = (serviceId: string) => {
    navigate(`/invoke/${serviceId}`)
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('services')}</h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t('connectedTo')}: <span className="font-semibold">{activeServer.name}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      ) : services.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-8 rounded text-center">
          <p>{t('noServicesFound')}</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.id}
              onClick={() => handleServiceClick(service.id)}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:shadow-md cursor-pointer transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{service.name}</h3>
              {service.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{service.description}</p>
              )}
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>ID: {service.id}</span>
                {service.version && <span>v{service.version}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 