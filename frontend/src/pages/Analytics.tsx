// Analytics.tsx — Truly Data-Driven Business Intelligence & Profit Diagnostics
import { useStore } from '../store'
import { useState } from 'react'
import type { ProductResult, ProductRequest } from '../types'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  BarChart3, PieChart as PieIcon, Activity, TrendingUp,
  DollarSign, Layers, Sparkles, AlertCircle, ArrowUpRight,
  ShieldCheck, HelpCircle, ArrowRight, AlertTriangle, FileSpreadsheet,
  PackageCheck, Calculator, RefreshCw
} from 'lucide-react'
import RecommendationBadge from '../components/RecommendationBadge'
import { formatCurrency, getCurrencySymbol } from '../utils/currency'

const DONUT_COLORS = ['#10b981', '#38bdf8', '#818cf8', '#f59e0b', '#ec4899', '#a855f7', '#14b8a6']

export default function Analytics() {
  const {
    products,
    capacity,
    s,
    currency,
    optimizeResult,
    lastRequest,
    isOutdated,
    optimizationError,
    setActivePage
  } = useStore()

  const sym = getCurrencySymbol(currency)

  const fmtMoney = (n: number) =>
    formatCurrency(n, currency)

  const fmtDec = (n: number) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n)

  // -------------------------------------------------------------------------
  // SCENARIO 1: Optimization Failed
  // -------------------------------------------------------------------------
  if (optimizationError) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in text-slate-200">
        <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Business Analytics</h1>
            <p className="text-slate-400 text-sm mt-1">Diagnostic intelligence based strictly on real calculation runs.</p>
          </div>
        </div>

        <div className="glass-card p-8 md:p-10 border-red-500/30 bg-red-500/[0.03] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
            <AlertCircle size={28} />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-bold text-white">Optimization Failed to Solve</h2>
            <p className="text-sm text-red-300 leading-relaxed">{optimizationError}</p>
            <p className="text-xs text-slate-400">
              No results or financial projections can be calculated with the current configuration. Please review capacity limits or product demands.
            </p>
          </div>
          <button
            onClick={() => setActivePage('optimizer')}
            className="btn-primary mx-auto text-xs py-2.5 px-5"
          >
            Adjust Constraints in Optimizer
          </button>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // SCENARIO 2: Clean Empty State (No business data configured yet)
  // -------------------------------------------------------------------------
  const hasProducts = products && products.length > 0
  const hasCapacity = capacity !== '' && Number(capacity) > 0

  if (!hasProducts || !hasCapacity) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in text-slate-200">
        <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Business Analytics</h1>
            <p className="text-slate-400 text-sm mt-1">Performance breakdown and economic sensitivity diagnostics.</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-white/[0.08]">
            Awaiting Business Data
          </span>
        </div>

        <div className="glass-card p-10 md:p-14 text-center space-y-5 border-dashed border-white/[0.12] bg-charcoal-750/30">
          <div className="w-16 h-16 rounded-2xl bg-charcoal-700/80 border border-white/[0.08] flex items-center justify-center mx-auto text-slate-400 shadow-card">
            <BarChart3 size={30} />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-bold text-white">Business Data Required for Analytics</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              OptiBiz never displays placeholder or fabricated business numbers. To unlock analytics, add your products or services, set your profit per unit, and specify your weekly capacity in the Profit Optimizer.
            </p>
          </div>

          <button
            onClick={() => setActivePage('optimizer')}
            className="btn-primary mx-auto text-xs py-2.5 px-6 shadow-lg shadow-emerald-500/20"
          >
            Configure Products in Profit Optimizer <ArrowRight size={14} />
          </button>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // SCENARIO 3: Inputs Configured, But Optimization Not Run Yet OR Outdated
  // (Show available inputs only. No optimized profit or recommendations)
  // -------------------------------------------------------------------------
  if (!optimizeResult || isOutdated) {
    const totalPlannedQty = products.reduce((acc, p) => acc + (Number(p.planned_qty) || 0), 0)
    const capNum = Number(capacity) || 1
    const plannedUtilization = (totalPlannedQty / capNum) * 100

    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in text-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Business Analytics</h1>
            <p className="text-slate-400 text-sm mt-1">Reviewing your current configured operational inputs.</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 self-start sm:self-auto">
            {isOutdated ? 'Inputs Modified — Optimization Needed' : 'Baseline Inputs Only'}
          </span>
        </div>

        {/* Informational Guidance Banner */}
        <div className="p-5 rounded-2xl bg-charcoal-800 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-card">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-white">
                {isOutdated
                  ? 'Your business inputs were changed since the last optimization run.'
                  : 'Optimization has not been executed on your configured products yet.'}
              </p>
              <p className="text-slate-400">
                To prevent misrepresenting financial figures, optimized profit, recommendations, and portfolio charts are generated only after running the mathematical solver.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActivePage('optimizer')}
            className="btn-primary text-xs py-2.5 px-5 shrink-0 shadow-md"
          >
            Run Optimization Now <ArrowRight size={14} />
          </button>
        </div>

        {/* Input Information Summary Cards (Inputs Only) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="metric-card">
            <span className="section-title">Configured Products</span>
            <span className="text-2xl font-bold text-white mt-1">{products.length} offerings</span>
            <span className="text-xs text-slate-400 mt-1">Ready for optimization</span>
          </div>

          <div className="metric-card">
            <span className="section-title">Weekly Capacity Ceiling</span>
            <span className="text-2xl font-bold text-white mt-1">{Math.round(capNum)} units/wk</span>
            <span className="text-xs text-slate-400 mt-1">Aggregate company limit</span>
          </div>

          <div className="metric-card">
            <span className="section-title">Current Planned Output</span>
            <span className="text-2xl font-bold text-slate-200 mt-1">{Math.round(totalPlannedQty)} units/wk</span>
            <span className="text-xs text-slate-400 mt-1">Sum of current planned quantities</span>
          </div>

          <div className="metric-card">
            <span className="section-title">Planned Capacity Load</span>
            <span className="text-2xl font-bold text-slate-200 mt-1">{plannedUtilization.toFixed(0)}%</span>
            <span className="text-xs text-slate-400 mt-1">
              {plannedUtilization > 100 ? 'Exceeds capacity!' : 'Within operating ceiling'}
            </span>
          </div>
        </div>

        {/* Input Products Table (Inputs Only) */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white text-sm">Configured Business Inputs</h3>
              <p className="text-xs text-slate-400 mt-0.5">Parameters awaiting optimization calculation</p>
            </div>
            <span className="text-xs text-slate-500">{products.length} products loaded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-400 bg-charcoal-750/50">
                  <th className="py-3 px-6 font-semibold">Product / Service</th>
                  <th className="py-3 px-4 font-semibold text-right">Profit / Unit</th>
                  <th className="py-3 px-4 font-semibold text-right">Workload Penalty</th>
                  <th className="py-3 px-4 font-semibold text-right">Planned Qty</th>
                  <th className="py-3 px-4 font-semibold text-right">Max Demand Cap</th>
                  <th className="py-3 px-6 font-semibold text-right">Baseline Unit Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {products.map((p, idx) => {
                  const grossPlanned = Number(p.m_i || 0) * Number(p.planned_qty || 0)
                  return (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-6 font-medium text-white text-sm">{p.name || `Product #${idx + 1}`}</td>
                      <td className="py-3.5 px-4 text-right text-slate-300 font-semibold">{fmtMoney(Number(p.m_i) || 0)}</td>
                      <td className="py-3.5 px-4 text-right text-slate-400">{Number(p.a_i).toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right text-slate-300 font-medium">{Math.round(Number(p.planned_qty) || 0)} units</td>
                      <td className="py-3.5 px-4 text-right text-slate-400">{Math.round(Number(p.max_demand) || 0)} units</td>
                      <td className="py-3.5 px-6 text-right font-medium text-slate-300">{fmtMoney(grossPlanned)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // SCENARIO 4: Valid Up-to-Date Optimization Results Exist
  // Full Dynamic Analytics Generated from Real Optimization Response
  // -------------------------------------------------------------------------
  const data = optimizeResult

  // Dynamic Chart 1: Actual Planned vs Optimal Quantities
  const barData = data.products.map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 13) + '…' : p.name,
    'Planned Units': Math.round(p.planned_qty),
    'Optimal Units': Math.round(p.optimal_qty),
  }))

  // Dynamic Chart 2: Actual Production Mix (Donut)
  const pieData = data.products.map(p => ({
    name: p.name,
    value: Math.round(p.optimal_qty),
  }))

  // Dynamic Chart 3: Actual Marginal Profit Calculations (Radar)
  const radarData = data.products.map(p => ({
    subject: p.name.length > 12 ? p.name.substring(0, 10) + '…' : p.name,
    'Marginal Profit': Math.max(0, Number(p.marginal_profit_at_optimal.toFixed(2))),
  }))

  // Dynamic Breakdown: Actual Mathematical Decomposition (Requirement 10)
  // Profit P = Sum(m_i * q_i) - Sum(a_i * q_i^2) - s * (Sum(q_i))^2
  const inputProducts = lastRequest?.products || products

  let totalUnitContribution = 0
  let totalOverloadPenalty = 0

  data.products.forEach(p => {
    const matchingReq = inputProducts.find(reqP => reqP.name === p.name)
    const m_i = matchingReq ? matchingReq.m_i : 0
    const a_i = matchingReq ? matchingReq.a_i : 0
    totalUnitContribution += m_i * p.optimal_qty
    totalOverloadPenalty += a_i * Math.pow(p.optimal_qty, 2)
  })

  const sharedPenaltyOpt = Math.round(data.shared_resource_penalty_optimal)
  const sharedPenaltyPlan = Math.round(data.shared_resource_penalty_planned)

  // Verify Solver Status (Requirement 11 - no fake statuses)
  const isSolverSuccess = data.status === 'success'

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in text-slate-200">
      {/* Page Header with Real Solver Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Business Analytics</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Optimization Model
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Calculated dynamically from your actual business inputs using SciPy constrained optimization.
          </p>
        </div>

        {/* Real Solver Status (Requirement 11) */}
        <div className="flex items-center gap-2 text-xs bg-charcoal-800 border border-white/[0.08] px-3.5 py-2 rounded-xl">
          <span className={`w-2 h-2 rounded-full ${isSolverSuccess ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="text-slate-300">
            Solver: <strong className="text-white capitalize">{data.status}</strong>
            {data.solver_iterations > 0 && ` (${data.solver_iterations} iterations)`}
          </span>
        </div>
      </div>

      {/* 4 Core Dynamic KPI Cards (Requirement 6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="metric-card glass-card-interactive">
          <div className="flex items-center justify-between">
            <span className="section-title">Current Planned Profit</span>
            <span className="w-8 h-8 rounded-lg bg-charcoal-700/80 border border-white/[0.08] flex items-center justify-center text-slate-300 font-bold text-sm">
              {sym}
            </span>
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {fmtMoney(data.current_profit)}
          </div>
          <p className="text-xs text-slate-400 mt-1">From user planned quantities</p>
        </div>

        <div className="metric-card glass-card-interactive border-emerald-500/25 bg-emerald-500/[0.02]">
          <div className="flex items-center justify-between">
            <span className="section-title text-emerald-400">Optimized Projected Profit</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {fmtMoney(data.optimal_profit)}
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-500 mt-1">
            <ArrowUpRight size={13} />
            <span>+{data.profit_improvement_pct.toFixed(1)}% improvement</span>
          </div>
        </div>

        <div className="metric-card glass-card-interactive">
          <div className="flex items-center justify-between">
            <span className="section-title">Shared Bottleneck Cost</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <Layers size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {fmtMoney(sharedPenaltyOpt)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Planned penalty was {fmtMoney(sharedPenaltyPlan)}
          </p>
        </div>

        <div className="metric-card glass-card-interactive">
          <div className="flex items-center justify-between">
            <span className="section-title">Optimal Capacity Load</span>
            <div className="w-8 h-8 rounded-lg bg-charcoal-700/80 border border-white/[0.08] flex items-center justify-center text-slate-300">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {(data.capacity_utilization_optimal * 100).toFixed(0)}%
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {Math.round(data.total_optimal_qty)} of {Math.round(data.capacity)} weekly units
          </p>
        </div>
      </div>

      {/* 2x2 Grid of Truly Dynamic Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Planned vs Optimal (Requirement 7) */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Planned vs. Optimal Quantities</h2>
              <p className="text-xs text-slate-400 mt-0.5">Calculated shift from planned to optimal units</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-charcoal-700/80 flex items-center justify-center text-slate-400">
              <BarChart3 size={16} />
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barCategoryGap="25%" barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#ffffff15' }} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#ffffff15' }} />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: '#131b28',
                    borderColor: '#ffffff15',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Planned Units" fill="#334661" radius={[5, 5, 0, 0]} />
                <Bar dataKey="Optimal Units" fill="#10b981" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Production Mix (Requirement 8) */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Optimal Production Mix</h2>
              <p className="text-xs text-slate-400 mt-0.5">Share of weekly operational capacity by product</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-charcoal-700/80 flex items-center justify-center text-slate-400">
              <PieIcon size={16} />
            </div>
          </div>

          <div className="h-64 w-full pt-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  stroke="#131b28"
                  strokeWidth={2}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: '#131b28',
                    borderColor: '#ffffff15',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} units`, 'Optimal Allocation']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Marginal Return Profile (Requirement 9) */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Marginal Profit Profile</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Incremental profit per unit (dP/dq_i) at optimal equilibrium
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-charcoal-700/80 flex items-center justify-center text-slate-400">
              <Activity size={16} />
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#ffffff0a" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Radar
                  name={`Marginal Profit (${sym}/unit)`}
                  dataKey="Marginal Profit"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.25}
                />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: '#131b28',
                    borderColor: '#ffffff15',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Full Patent Mathematical Decomposition (Requirement 10) */}
        <div className="glass-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h2 className="text-base font-semibold text-white">Profit & Penalty Decomposition</h2>
                <p className="text-xs text-slate-400 mt-0.5">Exact quadratic mathematical components</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-charcoal-700/80 flex items-center justify-center text-slate-400">
                <Calculator size={16} />
              </div>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-charcoal-750/70 border border-white/[0.05]">
                <div>
                  <p className="font-semibold text-white">Gross Unit Contributions</p>
                  <p className="text-[11px] text-slate-400">Sum of (m_i × q*_i) across all products</p>
                </div>
                <span className="text-sm font-bold text-emerald-400">
                  +{fmtMoney(totalUnitContribution)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-charcoal-750/70 border border-white/[0.05]">
                <div>
                  <p className="font-semibold text-white">Individual Overload Penalties</p>
                  <p className="text-[11px] text-slate-400">Sum of (a_i × (q*_i)²) single-product strain</p>
                </div>
                <span className="text-sm font-bold text-rose-400">
                  -{fmtMoney(totalOverloadPenalty)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-charcoal-750/70 border border-white/[0.05]">
                <div>
                  <p className="font-semibold text-white">Shared Resource Penalty</p>
                  <p className="text-[11px] text-slate-400">s × (Total Qty)² aggregate bottleneck cost</p>
                </div>
                <span className="text-sm font-bold text-amber-400">
                  -{fmtMoney(sharedPenaltyOpt)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div>
                  <p className="font-semibold text-emerald-300">Net Optimized Weekly Profit</p>
                  <p className="text-[11px] text-emerald-400/80">Gross Contribution − Overload − Shared Penalty</p>
                </div>
                <span className="text-sm font-bold text-emerald-400">
                  ={fmtMoney(data.optimal_profit)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-charcoal-750/60 border border-white/[0.05] text-[11px] text-slate-300 flex items-center justify-between">
            <span>Baseline Planned: {fmtMoney(data.current_profit)}</span>
            <span className="font-semibold text-emerald-400">
              Net Surplus: +{fmtMoney(data.profit_difference)} (+{data.profit_improvement_pct.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Product-Wise Analytical Audit Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-sm">Product-Wise Optimization Audit</h3>
            <p className="text-xs text-slate-400 mt-0.5">Individual product shift, marginal yields and recommendations</p>
          </div>
          <span className="text-xs text-slate-400">{data.products.length} products audited</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-slate-400 bg-charcoal-750/50">
                <th className="py-3.5 px-6 font-semibold">Product / Service</th>
                <th className="py-3.5 px-4 font-semibold text-right">Planned Qty</th>
                <th className="py-3.5 px-4 font-semibold text-right">Optimal Qty</th>
                <th className="py-3.5 px-4 font-semibold text-right">Variance</th>
                <th className="py-3.5 px-4 font-semibold text-right">Marginal Profit / Unit</th>
                <th className="py-3.5 px-6 font-semibold text-center">Status Directive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {data.products.map((p, idx) => {
                const isIncrease = p.qty_change > 0.5
                const isDecrease = p.qty_change < -0.5
                return (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 font-medium text-white text-sm">{p.name}</td>
                    <td className="py-4 px-4 text-right text-slate-300 font-medium">{Math.round(p.planned_qty)} units</td>
                    <td className="py-4 px-4 text-right text-emerald-400 font-bold text-sm">{Math.round(p.optimal_qty)} units</td>
                    <td className="py-4 px-4 text-right font-medium">
                      <span className={isIncrease ? 'text-emerald-400' : isDecrease ? 'text-rose-400' : 'text-slate-400'}>
                        {isIncrease ? '+' : ''}{Math.round(p.qty_change)} ({p.qty_change_pct.toFixed(0)}%)
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-slate-300 font-semibold">{fmtMoney(p.marginal_profit_at_optimal)}</td>
                    <td className="py-4 px-6 text-center">
                      <RecommendationBadge rec={p.recommendation} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
