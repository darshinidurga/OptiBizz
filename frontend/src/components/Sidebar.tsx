// Sidebar.tsx — Sleek modern sidebar navigation
import { useStore } from '../store'
import type { Page } from '../types'
import {
  LayoutDashboard, TrendingUp, BarChart3, Upload,
  FlaskConical, Bot, Wifi, WifiOff, Sparkles,
} from 'lucide-react'

const NAV: { id: Page; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: 'dashboard', label: 'Dashboard',         icon: <LayoutDashboard size={18} /> },
  { id: 'optimizer', label: 'Profit Optimizer',  icon: <TrendingUp size={18} />, badge: 'Core' },
  { id: 'analytics', label: 'Analytics',         icon: <BarChart3 size={18} /> },
  { id: 'upload',    label: 'Data Upload',        icon: <Upload size={18} /> },
  { id: 'scenario',  label: 'Scenario Simulator', icon: <FlaskConical size={18} /> },
  { id: 'advisor',   label: 'AI Advisor',         icon: <Bot size={18} /> },
]

export default function Sidebar() {
  const { activePage, setActivePage, backendOnline } = useStore()

  return (
    <aside className="w-64 shrink-0 flex flex-col bg-charcoal-850/95 border-r border-white/[0.08] min-h-screen select-none backdrop-blur-xl">
      {/* Brand Header */}
      <div className="px-6 py-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-tight text-lg">OptiBiz</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Profit Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-5 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Platform Menu
        </div>
        {NAV.map(item => {
          const isActive = activePage === item.id
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative
                ${isActive
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className={`transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider
                  ${isActive
                    ? 'bg-emerald-500/25 text-emerald-200'
                    : 'bg-white/[0.06] text-slate-400 group-hover:text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-400 rounded-r-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Backend Status / Footer */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="p-3 rounded-xl bg-charcoal-750/50 border border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              {backendOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${backendOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            </span>
            <div className="text-left">
              <p className="text-xs font-medium text-slate-200">
                {backendOnline ? 'Engine Online' : 'Engine Offline'}
              </p>
              <p className="text-[10px] text-slate-500">FastAPI Optimization</p>
            </div>
          </div>
          {backendOnline ? (
            <Wifi size={14} className="text-emerald-400" />
          ) : (
            <WifiOff size={14} className="text-rose-400" />
          )}
        </div>
      </div>
    </aside>
  )
}
