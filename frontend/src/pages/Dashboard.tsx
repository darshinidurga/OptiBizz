// Dashboard.tsx — Executive Business Overview Grounded in Actual Optimization
import { useState } from 'react'
import {
  TrendingUp, TrendingDown, Activity, ArrowRight,
  DollarSign, Sparkles, Layers, ShieldCheck, ArrowUpRight,
  Compass, PieChart as PieIcon, Lightbulb, BarChart3, AlertCircle, AlertTriangle
} from 'lucide-react'
import { useStore } from '../store'
import type { OptimizeResponse } from '../types'
import { formatCurrency, getCurrencySymbol } from '../utils/currency'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip as ChartTooltip, CartesianGrid, Legend
} from 'recharts'

export default function Dashboard() {
  const { setActivePage, optimizeResult, isOutdated, products, capacity, currency } = useStore()

  const data = optimizeResult

  const chartData =
    data && !isOutdated
      ? data.products.map(p => ({
          name: p.name.length > 14 ? p.name.substring(0, 12) + '…' : p.name,
          'Planned Workload': Math.round(p.planned_qty),
          'Optimal Workload': Math.round(p.optimal_qty),
        }))
      : []

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in text-slate-200">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-charcoal-800 via-charcoal-750 to-charcoal-800 border border-white/[0.08] p-6 md:p-8 shadow-card">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <Sparkles size={13} />
              <span>Business Performance Intelligence</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Executive Profit Dashboard
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Real-time modeling overview comparing your planned production capacity against mathematically optimal profit frontiers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActivePage('optimizer')}
              className="btn-primary shadow-lg shadow-emerald-500/20 px-5 py-3 text-sm font-semibold"
            >
              Open Profit Optimizer <ArrowRight size={15} />
            </button>
            <button
              onClick={() => setActivePage('analytics')}
              className="btn-ghost px-4 py-3 text-sm font-medium"
            >
              Detailed Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Outdated warning if inputs changed */}
      {isOutdated && data && (
        <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-amber-400 shrink-0" />
            <span>
              <strong>Inputs modified:</strong> Your business parameters have changed. Run the optimizer to update dashboard metrics.
            </span>
          </div>
          <button
            onClick={() => setActivePage('optimizer')}
            className="btn-primary text-xs py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-charcoal-900 font-bold shrink-0 shadow-none"
          >
            Update Analysis
          </button>
        </div>
      )}

      {/* When no optimization has been run yet */}
      {!data || isOutdated ? (
        <div className="glass-card p-10 md:p-14 text-center space-y-4 border-dashed border-white/[0.12] bg-charcoal-750/30">
          <div className="w-16 h-16 rounded-2xl bg-charcoal-700/80 border border-white/[0.08] flex items-center justify-center mx-auto text-slate-400 shadow-card">
            <BarChart3 size={30} />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-bold text-white">
              {products.length > 0 ? 'Optimization Calculation Pending' : 'No Business Optimization Active'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {products.length > 0
                ? 'Your products and capacity limits are configured. Run optimization in the Profit Optimizer to calculate optimal workload allocations and view executive KPIs.'
                : 'Enter your business products, unit margins, and capacity in the Profit Optimizer to calculate your optimal profit and populate the dashboard.'}
            </p>
          </div>
          <button
            onClick={() => setActivePage('optimizer')}
            className="btn-primary mx-auto text-xs py-2.5 px-6 shadow-lg shadow-emerald-500/20"
          >
            {products.length > 0 ? 'Run Optimization in Optimizer' : 'Configure Products in Profit Optimizer'}{' '}
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <>
          {/* 4 Core Summary Metric Cards (Actual Results) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Current Profit */}
            <div className="metric-card glass-card-interactive">
              <div className="flex items-center justify-between">
                <span className="section-title">Current Weekly Profit</span>
                <span className="w-8 h-8 rounded-lg bg-charcoal-700/80 border border-white/[0.08] flex items-center justify-center text-slate-300 font-bold text-sm">
                  {getCurrencySymbol(currency)}
                </span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white tracking-tight mt-1">
                {formatCurrency(data.current_profit, currency)}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                <span>Baseline from planned units</span>
              </div>
            </div>

            {/* Card 2: Optimal Projected Profit */}
            <div className="metric-card glass-card-interactive border-emerald-500/25 bg-emerald-500/[0.02]">
              <div className="flex items-center justify-between">
                <span className="section-title text-emerald-400">Optimized Weekly Profit</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-emerald-400 tracking-tight mt-1">
                {formatCurrency(data.optimal_profit, currency)}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-500 mt-1">
                <Sparkles size={12} />
                <span>Projected peak profitability</span>
              </div>
            </div>

            {/* Card 3: Potential Uplift */}
            <div className="metric-card glass-card-interactive">
              <div className="flex items-center justify-between">
                <span className="section-title">Potential Profit Uplift</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <ArrowUpRight size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl md:text-3xl font-bold text-emerald-400 tracking-tight">
                  +{formatCurrency(data.profit_difference, currency)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400/90 mt-1">
                <span className="font-semibold">+{data.profit_improvement_pct.toFixed(1)}%</span>
                <span className="text-slate-400">above current schedule</span>
              </div>
            </div>

            {/* Card 4: Capacity Utilized */}
            <div className="metric-card glass-card-interactive">
              <div className="flex items-center justify-between">
                <span className="section-title">Capacity Utilization</span>
                <div className="w-8 h-8 rounded-lg bg-charcoal-700/80 border border-white/[0.08] flex items-center justify-center text-slate-300">
                  <Layers size={16} />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white tracking-tight mt-1">
                {(data.capacity_utilization_optimal * 100).toFixed(0)}%
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                <span>{Math.round(data.total_optimal_qty)} units optimal</span>
                <span className="text-slate-500">Cap: {Math.round(data.capacity)}</span>
              </div>
            </div>
          </div>

          {/* Main Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card p-6 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white">Workload Allocation Comparison</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Planned weekly units vs. recommended optimal allocation</p>
                </div>
                <button
                  onClick={() => setActivePage('analytics')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
                >
                  Deep Analytics <ArrowRight size={13} />
                </button>
              </div>

              <div className="h-72 w-full pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="28%" barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#ffffff15' }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#ffffff15' }}
                    />
                    <ChartTooltip
                      contentStyle={{
                        backgroundColor: '#131b28',
                        borderColor: '#ffffff15',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar
                      dataKey="Planned Workload"
                      fill="#334661"
                      radius={[6, 6, 0, 0]}
                      name="Current Planned Units"
                    />
                    <Bar
                      dataKey="Optimal Workload"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      name="Recommended Optimal Units"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div>
                    <h2 className="text-base font-semibold text-white">Actionable Directives</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Model adjustment recommendations</p>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Compass size={15} />
                  </div>
                </div>

                <div className="divide-y divide-white/[0.04] mt-2">
                  {data.products.map(p => (
                    <div key={p.name} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{p.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {Math.round(p.planned_qty)} → <span className="text-slate-200 font-semibold">{Math.round(p.optimal_qty)} units</span>
                        </p>
                      </div>

                      <div>
                        {p.recommendation === 'increase' ? (
                          <span className="tag-increase">
                            <TrendingUp size={11} /> Increase
                          </span>
                        ) : p.recommendation === 'decrease' ? (
                          <span className="tag-decrease">
                            <TrendingDown size={11} /> Trim
                          </span>
                        ) : (
                          <span className="tag-maintain">
                            <Activity size={11} /> Maintain
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-charcoal-750/70 border border-white/[0.06] flex items-start gap-3">
                <Lightbulb size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="font-semibold text-white">Quick Insight:</span> Reallocating units away from saturated lines toward high-margin items unlocks higher net profit without expanding your workforce.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
