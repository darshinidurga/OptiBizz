// App.tsx — Root application with sidebar navigation and page routing
import { useEffect } from 'react'
import { checkHealth } from './api'
import { useStore } from './store'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import ProfitOptimizer from './pages/ProfitOptimizer'
import Analytics from './pages/Analytics'
import DataUpload from './pages/DataUpload'
import ScenarioSimulator from './pages/ScenarioSimulator'
import AIAdvisor from './pages/AIAdvisor'

export default function App() {
  const { activePage, setBackendOnline } = useStore()

  useEffect(() => {
    const check = async () => {
      try { await checkHealth(); setBackendOnline(true) }
      catch { setBackendOnline(false) }
    }
    check()
    const id = setInterval(check, 15000)
    return () => clearInterval(id)
  }, [setBackendOnline])

  const pages: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    optimizer: <ProfitOptimizer />,
    analytics: <Analytics />,
    upload: <DataUpload />,
    scenario: <ScenarioSimulator />,
    advisor: <AIAdvisor />,
  }

  return (
    <div className="flex min-h-screen bg-charcoal-900">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        {pages[activePage] ?? <Dashboard />}
      </main>
    </div>
  )
}

