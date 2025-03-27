import { ReactNode, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { toggleTheme } from '../store/slices/themeSlice'
import { XMarkIcon, MinusIcon, ArrowsPointingOutIcon, ServerIcon, CogIcon, CommandLineIcon } from '@heroicons/react/24/outline'

interface LayoutProps {
  children: ReactNode
}

// 获取Electron窗口对象
const ipcRenderer = window.require ? window.require('electron').ipcRenderer : null;

const NAV_ITEMS = [
  { path: '/', label: 'servers', icon: ServerIcon },
  { path: '/services', label: 'services', icon: CommandLineIcon },
  { path: '/settings', label: 'settings', icon: CogIcon },
]

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const theme = useAppSelector((state) => state.theme.mode)
  const [isMaximized, setIsMaximized] = useState(false)

  // Apply dark mode class to html element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // 窗口控制函数
  const handleMinimize = () => {
    if (ipcRenderer) ipcRenderer.invoke('window-minimize');
  }
  
  const handleMaximize = () => {
    if (ipcRenderer) {
      ipcRenderer.invoke('window-maximize');
      setIsMaximized(!isMaximized);
    }
  }
  
  const handleClose = () => {
    if (ipcRenderer) ipcRenderer.invoke('window-close');
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* 自定义标题栏 - 美化版 */}
      <div className="drag-region flex items-center justify-between h-8 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md">
        <div className="flex items-center h-full">
          <span className="px-3 font-semibold tracking-wide">MCP Client</span>
        </div>
        <div className="flex no-drag">
          <button 
            onClick={handleMinimize}
            className="h-8 w-10 flex items-center justify-center hover:bg-blue-700 transition-colors duration-150"
            title={t('minimize')}
          >
            <MinusIcon className="h-4 w-4" />
          </button>
          <button 
            onClick={handleMaximize}
            className="h-8 w-10 flex items-center justify-center hover:bg-blue-700 transition-colors duration-150"
            title={isMaximized ? t('restore') : t('maximize')}
          >
            <ArrowsPointingOutIcon className="h-4 w-4" />
          </button>
          <button 
            onClick={handleClose}
            className="h-8 w-10 flex items-center justify-center hover:bg-red-600 transition-colors duration-150"
            title={t('close')}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 应用主体部分 */}
      <div className="flex flex-1 h-[calc(100%-2rem)] overflow-hidden">
        {/* 侧边栏 - 改进设计 */}
        <div className="w-48 h-full bg-gray-100 dark:bg-gray-800 shadow-inner">
          <div className="py-4 px-3">
            <div className="mb-4 px-2">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('navigation')}
              </div>
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mr-2 ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                    {t(item.label)}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* 头部导航 */}
          <header className="flex items-center justify-between h-12 border-b border-gray-200 dark:border-gray-700 px-4 bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                {NAV_ITEMS.find((item) => item.path === location.pathname)?.label &&
                  t(NAV_ITEMS.find((item) => item.path === location.pathname)?.label || '')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => dispatch(toggleTheme())}
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                title={theme === 'light' ? t('dark_mode') : t('light_mode')}
              >
                <span className="text-lg">{theme === 'light' ? '🌙' : '☀️'}</span>
              </button>
            </div>
          </header>

          {/* 内容区 - 添加内边距和卡片式设计 */}
          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-4">
            <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
