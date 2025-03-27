import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { toggleTheme } from '../store/slices/themeSlice'
import { SunIcon, MoonIcon, LanguageIcon, InformationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

// 获取Electron窗口对象
const ipcRenderer = window.require ? window.require('electron').ipcRenderer : null;

export default function Settings() {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const theme = useAppSelector((state) => state.theme.mode)
  
  const [language, setLanguage] = useState(i18n.language)
  const [showRestartMessage, setShowRestartMessage] = useState(false)

  // 同步主题设置到 Electron
  useEffect(() => {
    const syncTheme = async () => {
      if (ipcRenderer) {
        await ipcRenderer.invoke('set-theme', theme)
      }
    }
    
    syncTheme()
  }, [theme])

  const handleThemeChange = () => {
    dispatch(toggleTheme())
  }

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value
    setLanguage(newLanguage)
    i18n.changeLanguage(newLanguage)
    setShowRestartMessage(true)
  }

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <InformationCircleIcon className="h-7 w-7 mr-2 text-blue-500" />
        {t('settings')}
      </h2>
      
      {showRestartMessage && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-lg shadow-sm mb-4 flex items-center">
          <ArrowPathIcon className="h-5 w-5 mr-2 flex-shrink-0" />
          <p>{t('restartToApplyChanges')}</p>
        </div>
      )}
      
      {/* 主题设置 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg">
        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white flex items-center">
          {theme === 'light' ? 
            <SunIcon className="h-5 w-5 mr-2 text-amber-500" /> : 
            <MoonIcon className="h-5 w-5 mr-2 text-blue-400" />}
          {t('theme')}
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-700 dark:text-gray-300">{t('currentTheme')}: {t(theme)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('themeDescription')}</p>
          </div>
          <button
            onClick={handleThemeChange}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-all duration-200 hover:translate-y-[-1px] active:translate-y-[1px] flex items-center"
          >
            {theme === 'light' ? 
              <><MoonIcon className="h-4 w-4 mr-1" /> {t('switchToDark')}</> : 
              <><SunIcon className="h-4 w-4 mr-1" /> {t('switchToLight')}</>}
          </button>
        </div>
      </div>
      
      {/* 语言设置 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg">
        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white flex items-center">
          <LanguageIcon className="h-5 w-5 mr-2 text-green-500" />
          {t('language')}
        </h3>
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('selectLanguage')}
          </label>
          <div className="relative">
            <select
              value={language}
              onChange={handleLanguageChange}
              className="block w-full max-w-xs p-2.5 pr-10 rounded-lg border border-gray-300 text-gray-700 bg-white shadow-sm 
              focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 
              dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400
              appearance-none transition-all duration-200 cursor-pointer"
            >
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('languageDescription')}</p>
        </div>
      </div>
      
      {/* 关于应用 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg">
        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white flex items-center">
          <InformationCircleIcon className="h-5 w-5 mr-2 text-purple-500" />
          {t('about')}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center py-1 border-b border-gray-100 dark:border-gray-700">
            <span className="font-medium text-gray-600 dark:text-gray-400 w-32">{t('appName')}:</span> 
            <span className="text-gray-800 dark:text-gray-200">MCP Client</span>
          </div>
          <div className="flex items-center py-1 border-b border-gray-100 dark:border-gray-700">
            <span className="font-medium text-gray-600 dark:text-gray-400 w-32">{t('version')}:</span> 
            <span className="text-gray-800 dark:text-gray-200">1.0.0</span>
          </div>
          <div className="flex items-center py-1">
            <span className="font-medium text-gray-600 dark:text-gray-400 w-32">{t('description')}:</span> 
            <span className="text-gray-800 dark:text-gray-200">{t('appDescription')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}