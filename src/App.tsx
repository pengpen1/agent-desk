import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Layout from './components/Layout'
import ServerManager from './pages/ServerManager'
import ServiceList from './pages/ServiceList'
import ServiceInvoker from './pages/ServiceInvoker'
import Settings from './pages/Settings'
import { useAppDispatch } from './store/hooks'
import { initTheme } from './store/slices/themeSlice'
import { initServerConfigs } from './store/slices/serverSlice'

const { ipcRenderer } = window.require('electron')

function App() {
  const { i18n } = useTranslation()
  const dispatch = useAppDispatch()

  useEffect(() => {
    // 初始化主题
    const initApp = async () => {
      const theme = await ipcRenderer.invoke('get-theme')
      dispatch(initTheme(theme))

      const configs = await ipcRenderer.invoke('get-server-configs')
      dispatch(initServerConfigs(configs))
    }

    initApp()
  }, [dispatch])

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<ServerManager />} />
          <Route path="/services" element={<ServiceList />} />
          <Route path="/invoke/:serviceId" element={<ServiceInvoker />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
