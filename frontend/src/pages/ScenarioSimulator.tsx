// ScenarioSimulator.tsx — Side-by-Side Business Strategy Simulator
import { useState, useEffect } from 'react'
import {
  FlaskConical, Loader2, Trophy, ArrowRight, TrendingUp,
  Sparkles, Layers, DollarSign, CheckCircle2, AlertCircle,
  HelpCircle, RefreshCw, BarChart2
} from 'lucide-react'
import { compareScenarios } from '../api'
import { useStore } from '../store'
import type { OptimizeRequest, ScenarioCompareResponse } from '../types'
import RecommendationBadge from '../components/RecommendationBadge'
import { formatCurrency } from '../utils/currency'

export default function ScenarioSimulator() {
  const { products, capacity, s, currency, setActivePage, loadDemoData } = useStore()

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScenarioCompareResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const numS = typeof s === 'number' ? s : 0.003
  const numCap = typeof capacity === 'number' ? capacity : 100

  // Scenario A (Baseline)
  const [sA, setSA] = useState(numS)
  const [capA, setCapA] = useState(numCap)

  // Scenario B (Expansion)
  const [sB, setSB] = useState(Math.max(0.0005, Number((numS * 0.7).toFixed(4))))
  const [capB, setCapB] = useState(Math.round(numCap * 1.25) || 150)

  // Sync state if store baseline changes and user hasn't modified
  useEffect(() => {
    const freshS = typeof s === 'number' ? s : 0.003
    const freshCap = typeof capacity === 'number' ? capacity : 100
    setSA(freshS)
    setCapA(freshCap)
    setSB(Math.max(0.0005, Number((freshS * 0.7).toFixed(4))))
    setCapB(Math.round(freshCap * 1.25) || 150)
  }, [s, capacity])

  const handleRunComparison = async () => {
    if (products.length === 0) {
      setError('Please add at least one product before running scenario simulation.')
      return
    }

    setError(null)
    setLoading(true)
    try {
      const a: OptimizeRequest = {
        s: Number(sA),
        capacity: Number(capA),
        products: products.map(p => ({
          name: p.name,
          m_i: Number(p.m_i),
          a_i: Number(p.a_i),
          planned_qty: Number(p.planned_qty),
          max_demand: Number(p.max_demand),
        })),
      }
      const b: OptimizeRequest = {
        s: Number(sB),
        capacity: Number(capB),
        products: products.map(p => ({
          name: p.name,
          m_i: Number(p.m_i),
          a_i: Number(p.a_i),
          planned_qty: Number(p.planned_qty),
          max_demand: Number(p.max_demand),
        })),
      }
      const response = await compareScenarios(a, b, 'Scenario A (Baseline)', 'Scenario B (Expansion)')
      setResult(response)

      setTimeout(() => {
        const el = document.getElementById('scenario-results-section')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Scenario simulation failed. Verify both scenario parameters are valid.')
    } finally {
      setLoading(false)
    }
  }

  // Empty state if no products are configured
  if (products.length === 0) {
    return (
      <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto animate-fade-in text-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Scenario Simulator
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Comparative Analysis
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Evaluate what-if business assumptions: compare scaling capacity versus bottleneck strain side-by-side.
            </p>
          </div>
        </div>

        <div className="glass-card p-10 md:p-14 text-center space-y-5 border-dashed border-white/[0.12] bg-charcoal-750/30">
          <div className="w-16 h-16 rounded-2xl bg-charcoal-700/80 border border-white/[0.08] flex items-center justify-center mx-auto text-slate-400 shadow-card">
            <FlaskConical size={30} className="text-emerald-400" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-bold text-white">No Business Products Configured</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Scenario simulation runs what-if models directly on your active business products. Enter your products in the Profit Optimizer, or load sample business data to explore comparative simulations.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActivePage('optimizer')}
              className="btn-primary shadow-lg shadow-emerald-500/20 px-5 py-2.5 text-xs font-semibold"
            >
              Configure in Profit Optimizer <ArrowRight size={14} />
            </button>
            <button
              onClick={() => loadDemoData()}
              className="btn-ghost px-4 py-2.5 text-xs font-medium border border-white/[0.12] hover:border-emerald-500/40"
            >
              <Sparkles size={14} className="text-emerald-400" />
              Load Demo Business Data
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto animate-fade-in text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Scenario Simulator
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Comparative Analysis
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Simulating {products.length} product{products.length > 1 ? 's' : ''} from your business profile under different operational constraints.
          </p>
        </div>

        <button
          onClick={handleRunComparison}
          disabled={loading}
          className="btn-primary text-xs py-2.5 px-5 shadow-lg shadow-emerald-500/20"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Comparing Models...
            </>
          ) : (
            <>
              <FlaskConical size={14} />
              Run Simulation
            </>
          )}
        </button>
      </div>

      {/* Two Scenario Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scenario A: Baseline */}
        <div className="glass-card p-6 space-y-5 border-slate-700/60 bg-charcoal-800">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Option A</span>
              <h2 className="text-base font-semibold text-white">Baseline Operating Model</h2>
              <p className="text-xs text-slate-400 mt-0.5">Your current capacity & bottleneck overhead</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <FlaskConical size={16} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Available Weekly Capacity
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  value={capA}
                  onChange={e => setCapA(Number(e.target.value))}
                  className="input-field pr-12"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                  units
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Base production / service delivery ceiling</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Shared Resource Penalty (s)
              </label>
              <input
                type="number"
                min={0}
                step={0.0005}
                value={sA}
                onChange={e => setSA(Number(e.target.value))}
                className="input-field"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Baseline bottleneck & coordination drag ({sA})
              </p>
            </div>
          </div>
        </div>

        {/* Scenario B: Expansion */}
        <div className="glass-card p-6 space-y-5 border-emerald-500/25 bg-emerald-500/[0.02]">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Option B</span>
              <h2 className="text-base font-semibold text-white">Expansion Strategy</h2>
              <p className="text-xs text-slate-400 mt-0.5">Scaled capacity with optimized operational workflow</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <TrendingUp size={16} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Available Weekly Capacity
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  value={capB}
                  onChange={e => setCapB(Number(e.target.value))}
                  className="input-field pr-12"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                  units
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {Number(capB) > Number(capA) ? `+${Math.round(((Number(capB) - Number(capA)) / (Number(capA) || 1)) * 100)}% capacity expansion` : 'Adjusted capacity ceiling'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Shared Resource Penalty (s)
              </label>
              <input
                type="number"
                min={0}
                step={0.0005}
                value={sB}
                onChange={e => setSB(Number(e.target.value))}
                className="input-field"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Streamlined process reduces penalty to {sB}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm animate-fade-in">
          <AlertCircle size={18} className="shrink-0 text-red-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Comparison View */}
      {result && (
        <div id="scenario-results-section" className="space-y-6 pt-2 animate-slide-up">
          {/* Winner Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600/20 via-emerald-500/10 to-charcoal-800 border border-emerald-500/30 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow-emerald shrink-0">
                <Trophy size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  Superior Strategy
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {result.better_scenario} delivers higher net profit
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Generates an additional <strong>{formatCurrency(result.profit_difference_between_scenarios, currency)}</strong> in net weekly returns.
                </p>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-white/[0.08] sm:pl-6">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Profit Variance</span>
              <span className="text-xl font-bold text-emerald-400">
                +{formatCurrency(result.profit_difference_between_scenarios, currency)}
              </span>
            </div>
          </div>

          {/* Head-to-Head Comparison Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: result.label_a, r: result.result_a, isWinner: result.better_scenario === result.label_a },
              { label: result.label_b, r: result.result_b, isWinner: result.better_scenario === result.label_b },
            ].map(({ label, r, isWinner }) => (
              <div
                key={label}
                className={`glass-card p-6 space-y-5 transition-all ${
                  isWinner ? 'border-emerald-500/35 bg-emerald-500/[0.02] shadow-glow-emerald' : 'bg-charcoal-800'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div>
                    <h3 className="font-semibold text-white text-base">{label}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Cap: {Math.round(r.capacity)} units/wk
                    </p>
                  </div>
                  {isWinner ? (
                    <span className="tag-increase">
                      <Trophy size={11} /> Top Performer
                    </span>
                  ) : (
                    <span className="tag-maintain">Alternative</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-charcoal-750/70 border border-white/[0.05]">
                    <span className="section-title">Optimal Profit</span>
                    <p className={`text-lg font-bold mt-0.5 ${isWinner ? 'text-emerald-400' : 'text-white'}`}>
                      {formatCurrency(r.optimal_profit, currency)}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-charcoal-750/70 border border-white/[0.05]">
                    <span className="section-title">Net Uplift</span>
                    <p className="text-lg font-bold text-emerald-400 mt-0.5">
                      +{r.profit_improvement_pct.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Product Breakdown List */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Product Distribution
                  </span>
                  <div className="divide-y divide-white/[0.04]">
                    {r.products.map(p => (
                      <div key={p.name} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-300 font-medium truncate">{p.name}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-semibold text-white">
                            {Math.round(p.optimal_qty)} units
                          </span>
                          <RecommendationBadge rec={p.recommendation} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
