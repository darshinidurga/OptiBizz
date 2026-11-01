/**
 * ProfitOptimizer.tsx — Commercial Profit Optimization Engine
 *
 * Implements:
 * 1. Automatic persistent storage to localStorage on every change.
 * 2. Save status indicator ('Saved to browser' / 'Saving...').
 * 3. Clear Business Data control with confirmation modal.
 * 4. Explicit Load Demo Data action.
 * 5. Strict separation between business inputs and optimization results.
 * 6. Preserves existing user inputs and prevents overwriting with defaults.
 */

import { useState, useRef, useEffect } from 'react'
import {
  Plus, Trash2, Play, Loader2, AlertCircle, Info,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown,
  Activity, BarChart3, CheckCircle2, Lightbulb,
  Building2, PackagePlus, Settings2, Sparkles,
  DollarSign, ArrowUpRight, HelpCircle, RefreshCw, AlertTriangle,
  Save, Check, RotateCcw
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip as ChartTooltip, CartesianGrid, Legend
} from 'recharts'
import { runOptimize } from '../api'
import { useStore, saveInputsToStorage } from '../store'
import type { ProductRequest, OptimizeResponse } from '../types'
import RecommendationBadge from '../components/RecommendationBadge'

// ---------------------------------------------------------------------------
// Type for form items (supports empty strings for blank placeholder display)
// ---------------------------------------------------------------------------

interface ProductFormItem {
  name: string
  m_i: number | ''
  a_i: number | ''
  planned_qty: number | ''
  max_demand: number | ''
}

interface CurrencyOption {
  code: string
  symbol: string
  label: string
}

const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', label: 'USD ($) — US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) — Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) — British Pound' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD (CA$) — Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$) — Australian Dollar' },
  { code: 'INR', symbol: '₹', label: 'INR (₹) — Indian Rupee' },
]

const INDUSTRIES = [
  'Select your industry',
  'Retail & E-commerce',
  'Professional Services & Consulting',
  'Creative Agency & Design',
  'Software & Technology (SaaS)',
  'Food, Beverage & Hospitality',
  'Healthcare & Wellness',
  'Manufacturing & Production',
  'Construction & Trades',
  'Education & Training',
  'Other Services',
]

// ---------------------------------------------------------------------------
// Interactive Information Tooltip Popover
// ---------------------------------------------------------------------------

interface InfoTooltipProps {
  title: string
  whatMeans: string
  whyNeeded: string
  howToDetermine: string
  extraNote?: string
}

function ParameterInfo({ title, whatMeans, whyNeeded, howToDetermine, extraNote }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative inline-flex items-center ml-1.5" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-slate-400 hover:text-emerald-400 focus:outline-none transition-colors"
        aria-label={`Learn more about ${title}`}
      >
        <Info size={14} />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 top-6 w-80 sm:w-96 bg-charcoal-800 border border-emerald-500/30 rounded-2xl p-4 shadow-2xl text-xs space-y-2.5 animate-fade-in backdrop-blur-md">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <span className="font-semibold text-white text-sm flex items-center gap-1.5">
              <HelpCircle size={14} className="text-emerald-400" />
              {title}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>

          <div>
            <span className="font-semibold text-emerald-400 block mb-0.5">What it means:</span>
            <p className="text-slate-300 leading-relaxed">{whatMeans}</p>
          </div>

          <div>
            <span className="font-semibold text-emerald-400 block mb-0.5">Why it is needed:</span>
            <p className="text-slate-300 leading-relaxed">{whyNeeded}</p>
          </div>

          <div>
            <span className="font-semibold text-emerald-400 block mb-0.5">How to determine it:</span>
            <p className="text-slate-300 leading-relaxed">{howToDetermine}</p>
          </div>

          {extraNote && (
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-[11px] leading-tight">
              {extraNote}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function generateBusinessAdvice(result: OptimizeResponse, symbol: string): string {
  const diff = result.profit_difference
  const pct = result.profit_improvement_pct
  const increases = result.products.filter(p => p.recommendation === 'increase')
  const decreases = result.products.filter(p => p.recommendation === 'decrease')

  if (diff <= 5 && pct < 0.5) {
    return `Your current production workload is already well-calibrated. The model estimates that your planned distribution is within 1% of the theoretical profit peak. You can safely maintain your current weekly plan.`
  }

  const advice: string[] = []

  advice.push(
    `By realigning your weekly workload distribution, your business could generate an estimated ${symbol}${Math.round(diff).toLocaleString()} more profit per week (+${pct.toFixed(1)}% improvement).`
  )

  if (increases.length > 0) {
    const incNames = increases.map(p => `"${p.name}" (+${Math.round(p.qty_change)} units)`).join(', ')
    advice.push(
      `Focus on scaling up: ${incNames}. These items generate superior marginal contribution before diminishing returns set in.`
    )
  }

  if (decreases.length > 0) {
    const decNames = decreases.map(p => `"${p.name}" (${Math.round(p.qty_change)} units)`).join(', ')
    advice.push(
      `Consider tapering production on: ${decNames}. Over-producing these items creates operational bottlenecks that erode net profitability.`
    )
  }

  advice.push(
    `Total recommended weekly output is ${Math.round(result.total_optimal_qty)} units (utilizing ${(result.capacity_utilization_optimal * 100).toFixed(0)}% of your available capacity).`
  )

  return advice.join(' ')
}

export default function ProfitOptimizer() {
  const {
    businessName, setBusinessName,
    industry, setIndustry,
    currency, setCurrency,
    capacity, setCapacity,
    s, setS,
    products: storeProducts, setProducts: setStoreProducts,
    optimizeResult, isOutdated,
    saveStatus, setSaveStatus,
    setOptimizationSuccess, setOptimizationFailure,
    clearBusinessData, loadDemoData
  } = useStore()

  // Local form state for empty-string placeholder support
  const [localProducts, setLocalProducts] = useState<ProductFormItem[]>(() => {
    if (storeProducts && storeProducts.length > 0) {
      return storeProducts.map(p => ({
        name: p.name,
        m_i: p.m_i,
        a_i: p.a_i,
        planned_qty: p.planned_qty,
        max_demand: p.max_demand,
      }))
    }
    return []
  })

  // Sync if storeProducts was restored from localStorage
  useEffect(() => {
    if (storeProducts && storeProducts.length > 0 && localProducts.length === 0) {
      setLocalProducts(
        storeProducts.map(p => ({
          name: p.name,
          m_i: p.m_i,
          a_i: p.a_i,
          planned_qty: p.planned_qty,
          max_demand: p.max_demand,
        }))
      )
    }
  }, [storeProducts])

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [demoLoadedNotification, setDemoLoadedNotification] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const activeCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0]
  const sym = activeCurrency.symbol

  const fmtMoney = (amount: number) => {
    return `${sym}${Math.round(amount).toLocaleString('en-US')}`
  }

  // --- Auto-save Debouncer ---
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerSave = (updatedProducts: ProductFormItem[]) => {
    setSaveStatus('saving')
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

    saveTimeoutRef.current = setTimeout(() => {
      const validStoreProducts: ProductRequest[] = updatedProducts.map(p => ({
        name: p.name,
        m_i: Number(p.m_i) || 0,
        a_i: Number(p.a_i) || 0,
        planned_qty: Number(p.planned_qty) || 0,
        max_demand: Number(p.max_demand) || 0,
      }))

      setStoreProducts(validStoreProducts)
      setSaveStatus('saved')
    }, 200)
  }

  // --- Product List Handlers ---
  const handleAddProduct = () => {
    const updated = [
      ...localProducts,
      {
        name: '',
        m_i: '' as const,
        a_i: '' as const,
        planned_qty: '' as const,
        max_demand: '' as const,
      },
    ]
    setLocalProducts(updated)
    triggerSave(updated)
    setValidationError(null)
  }

  const handleUpdateProduct = (index: number, field: keyof ProductFormItem, value: any) => {
    const updated = [...localProducts]
    updated[index] = { ...updated[index], [field]: value }
    setLocalProducts(updated)
    triggerSave(updated)
    setValidationError(null)
  }

  const handleRemoveProduct = (index: number) => {
    const updated = localProducts.filter((_, i) => i !== index)
    setLocalProducts(updated)
    triggerSave(updated)
    setValidationError(null)
  }

  // --- Load Demo Data (Explicit user action only) ---
  const handleLoadDemoData = () => {
    const demoProds = [
      {
        name: 'Growth Marketing Retainer',
        m_i: 180,
        a_i: 0.35,
        planned_qty: 25,
        max_demand: 60,
      },
      {
        name: 'Custom Web Engineering',
        m_i: 240,
        a_i: 0.70,
        planned_qty: 15,
        max_demand: 35,
      },
      {
        name: 'SEO & Performance Audit',
        m_i: 95,
        a_i: 0.15,
        planned_qty: 40,
        max_demand: 80,
      },
      {
        name: 'Brand Identity System',
        m_i: 310,
        a_i: 1.10,
        planned_qty: 10,
        max_demand: 25,
      },
    ]

    const demoInputs = {
      businessName: 'Apex Digital Growth Agency',
      industry: 'Professional Services & Consulting',
      currency: 'USD',
      capacity: 130,
      s: 0.003,
      products: demoProds,
    }

    setLocalProducts(demoProds)
    loadDemoData(demoInputs)
    setValidationError(null)
    setDemoLoadedNotification(true)
    setTimeout(() => setDemoLoadedNotification(false), 5000)
  }

  // --- Clear Business Data (with confirmation) ---
  const handleConfirmClear = () => {
    clearBusinessData()
    setLocalProducts([])
    setShowClearConfirm(false)
    setValidationError(null)
  }

  // --- Validation ---
  const validateForm = (): string | null => {
    if (!capacity || Number(capacity) <= 0) {
      return 'Please enter your Available Weekly Production Capacity in Business Information.'
    }
    if (localProducts.length === 0) {
      return 'Please add at least one product or service to analyze.'
    }
    for (let i = 0; i < localProducts.length; i++) {
      const p = localProducts[i]
      const name = p.name.trim() || `Product #${i + 1}`
      if (!p.name.trim()) {
        return `Please provide a name for ${name}.`
      }
      if (p.m_i === '' || Number(p.m_i) <= 0) {
        return `"${name}": Profit earned per unit must be greater than ${sym}0.`
      }
      if (p.a_i === '' || Number(p.a_i) < 0) {
        return `"${name}": Workload penalty coefficient cannot be negative.`
      }
      if (p.planned_qty === '' || Number(p.planned_qty) < 0) {
        return `"${name}": Current planned weekly quantity cannot be negative.`
      }
      if (p.max_demand === '' || Number(p.max_demand) <= 0) {
        return `"${name}": Maximum weekly demand must be greater than 0.`
      }
      if (Number(p.planned_qty) > Number(p.max_demand)) {
        return `"${name}": Current planned quantity (${p.planned_qty}) cannot exceed maximum weekly demand (${p.max_demand}).`
      }
    }
    if (s === '' || Number(s) < 0) {
      return 'The shared resource penalty coefficient in Advanced Settings cannot be negative.'
    }
    return null
  }

  // --- Execute Optimization ---
  const handleRunAnalysis = async () => {
    const error = validateForm()
    if (error) {
      setValidationError(error)
      return
    }

    setValidationError(null)
    setIsOptimizing(true)

    try {
      const formattedProducts: ProductRequest[] = localProducts.map(p => ({
        name: p.name.trim(),
        m_i: Number(p.m_i),
        a_i: Number(p.a_i),
        planned_qty: Number(p.planned_qty),
        max_demand: Number(p.max_demand),
      }))

      const payload = {
        products: formattedProducts,
        s: Number(s),
        capacity: Number(capacity),
      }

      setStoreProducts(formattedProducts)
      const response = await runOptimize(payload)
      setOptimizationSuccess(payload, response)

      // Smooth scroll down to results section
      setTimeout(() => {
        const el = document.getElementById('optimization-results-section')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 150)
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      const msg =
        typeof detail === 'object'
          ? detail?.message || JSON.stringify(detail)
          : detail || 'Optimization calculation failed. Please check your inputs.'
      setOptimizationFailure(msg)
      setValidationError(msg)
    } finally {
      setIsOptimizing(false)
    }
  }

  const chartData =
    optimizeResult && !isOutdated
      ? optimizeResult.products.map(p => ({
          name: p.name.length > 16 ? p.name.substring(0, 14) + '...' : p.name,
          'Current Workload': Math.round(p.planned_qty),
          'Optimal Workload': Math.round(p.optimal_qty),
        }))
      : []

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto animate-fade-in text-slate-200">
      {/* Confirmation Modal for Clear Business Data */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-md w-full p-6 space-y-4 border-white/[0.15] bg-charcoal-800 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Clear All Business Data?</h3>
                <p className="text-xs text-slate-400">This action will reset your form</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will remove your business name, industry, capacity, all configured products, and any calculated results from this browser. This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn-ghost text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="btn-primary text-xs py-2 px-4 bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
              >
                Yes, Clear Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header with Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Profit Optimizer
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Commercial Edition
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Determine the most profitable weekly workload allocation for your products and services.
          </p>
        </div>

        {/* Data Management Controls (Requirement 4) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Save Status Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-charcoal-800 border border-white/[0.08] text-xs">
            {saveStatus === 'saving' ? (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-amber-300 text-[11px] font-medium">Saving...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span className="text-slate-300 text-[11px] font-medium">Saved to browser</span>
              </>
            ) : (
              <span className="text-slate-500 text-[11px]">Ready</span>
            )}
          </div>

          {/* Load Demo Data Button */}
          <button
            onClick={handleLoadDemoData}
            className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3 border border-white/[0.12] hover:border-emerald-500/40"
          >
            <Sparkles size={13} className="text-emerald-400" />
            Load Demo Data
          </button>

          {/* Clear Business Data Button */}
          {(localProducts.length > 0 || capacity !== '' || businessName !== '') && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3 text-slate-400 hover:text-rose-400 border border-white/[0.08] hover:border-rose-500/30"
              title="Clear all entered business information"
            >
              <RotateCcw size={12} />
              Clear Data
            </button>
          )}
        </div>
      </div>

      {demoLoadedNotification && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-sm animate-fade-in">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
          <span>
            <strong>Demo business data loaded!</strong> Review the sample figures below or click <strong>Run Profit Analysis</strong> to evaluate.
          </span>
        </div>
      )}

      {/* Outdated Warning Banner when user changes inputs after running */}
      {isOutdated && optimizeResult && (
        <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-amber-400 shrink-0" />
            <span>
              <strong>Inputs modified:</strong> Your business inputs have changed since the last optimization. Click <strong>Run Profit Analysis</strong> to recalculate optimal results.
            </span>
          </div>
          <button
            onClick={handleRunAnalysis}
            disabled={isOptimizing}
            className="btn-primary text-xs py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-charcoal-900 font-bold shrink-0 shadow-none"
          >
            Update Analysis
          </button>
        </div>
      )}

      {/* SECTION A: BUSINESS INFORMATION */}
      <section className="glass-card p-6 md:p-7 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">A. Business Information</h2>
              <p className="text-xs text-slate-400">Set your organization profile, operational limits and currency.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="e.g. Acme Studio LLC"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Industry Type
            </label>
            <select
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              className="input-field"
            >
              {INDUSTRIES.map(item => (
                <option key={item} value={item === 'Select your industry' ? '' : item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <label className="text-xs font-semibold text-slate-300">Currency</label>
              <ParameterInfo
                title="Business Currency"
                whatMeans="The monetary unit used for all pricing, revenue calculations and projected profits."
                whyNeeded="Ensures consistency across reports, margins and forecasts."
                howToDetermine="Select the primary currency your business charges customers in. Defaults to USD ($)."
              />
            </div>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="input-field"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <label className="text-xs font-semibold text-slate-300">
                Available Weekly Production Capacity
              </label>
              <ParameterInfo
                title="Available Weekly Production Capacity"
                whatMeans="The maximum total units of all products and services combined your business can produce or deliver in a single standard week."
                whyNeeded="Acts as a firm operational ceiling. Prevents the optimizer from recommending workloads your team or facilities cannot physically support."
                howToDetermine="Add up the total billable hours, worker shifts, or machine hours available in a week, divided by the average units produced per hour."
                extraNote="Example: A boutique firm of 4 consultants offering 30 hours each has an aggregate capacity of 120 billable hours per week."
              />
            </div>
            <div className="relative">
              <input
                type="number"
                min={1}
                step={1}
                value={capacity}
                onChange={e => setCapacity(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 150"
                className="input-field pr-12"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                units/wk
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B: PRODUCTS AND SERVICES */}
      <section className="glass-card p-6 md:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <PackagePlus size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">B. Products and Services</h2>
              <p className="text-xs text-slate-400">
                Specify unit profits, workload sensitivities and current planned quantities for each offering.
              </p>
            </div>
          </div>

          <button
            onClick={handleAddProduct}
            className="btn-primary self-start sm:self-auto text-xs py-2 px-4 shadow-lg shadow-emerald-500/10"
          >
            <Plus size={15} /> Add Product / Service
          </button>
        </div>

        {localProducts.length === 0 ? (
          <div className="border border-dashed border-white/[0.12] rounded-2xl p-10 text-center space-y-4 bg-charcoal-750/30">
            <div className="w-12 h-12 rounded-2xl bg-charcoal-700/80 border border-white/[0.08] flex items-center justify-center mx-auto text-slate-400">
              <PackagePlus size={22} />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-sm font-semibold text-white">No products or services added</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Start by adding your first product or service, or click <strong>Load Demo Data</strong> above to explore with a pre-configured scenario.
              </p>
            </div>
            <button
              onClick={handleAddProduct}
              className="btn-primary mx-auto text-xs py-2 px-5"
            >
              <Plus size={14} /> Add Product / Service
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {localProducts.map((product, idx) => (
              <div
                key={idx}
                className="bg-charcoal-750/60 border border-white/[0.08] rounded-2xl p-5 space-y-4 hover:border-white/[0.15] transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 flex-1 max-w-md">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={product.name}
                      onChange={e => handleUpdateProduct(idx, 'name', e.target.value)}
                      placeholder={`e.g. Product or Service #${idx + 1}`}
                      className="input-field text-sm font-medium"
                    />
                  </div>

                  <button
                    onClick={() => handleRemoveProduct(idx)}
                    className="text-slate-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition-colors"
                    title="Remove product"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  <div>
                    <div className="flex items-center mb-1.5">
                      <label className="text-xs font-medium text-slate-300">
                        Profit earned per unit ({sym})
                      </label>
                      <ParameterInfo
                        title="Profit Earned Per Unit"
                        whatMeans="Your selling price minus the direct variable cost required to deliver one unit. This is NOT your gross revenue or total invoice price."
                        whyNeeded="The optimization model needs your true net contribution per unit to identify where production creates the highest cash return."
                        howToDetermine="Take the customer price and subtract direct materials, labor, fulfillment and sales commissions for that single unit."
                        extraNote="Example: A $200 consulting package requiring $60 in contractor costs yields a unit profit of $140."
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold pointer-events-none">
                        {sym}
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={product.m_i}
                        onChange={e =>
                          handleUpdateProduct(
                            idx,
                            'm_i',
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
                        }
                        placeholder="e.g. 120"
                        className="input-field pl-8"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center mb-1.5">
                      <label className="text-xs font-medium text-slate-300">
                        Workload penalty coefficient
                      </label>
                      <ParameterInfo
                        title="Workload Penalty Coefficient"
                        whatMeans="A sensitivity factor capturing the inefficiency, fatigue, rush charges, or defect rate increases that occur when you produce very high volumes of this specific product."
                        whyNeeded="Prevents unrealistic recommendations where 100% of capacity is assigned to a single product, ignoring product-specific bottlenecks."
                        howToDetermine="For automated/digital goods with minimal friction, use 0.1 to 0.2. For complex or hands-on manual services, use 0.4 to 0.8."
                        extraNote="Tip: 0.3 is a balanced default if you do not have historical overtime figures."
                      />
                    </div>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={product.a_i}
                      onChange={e =>
                        handleUpdateProduct(
                          idx,
                          'a_i',
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      placeholder="e.g. 0.30"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <div className="flex items-center mb-1.5">
                      <label className="text-xs font-medium text-slate-300">
                        Current planned weekly quantity
                      </label>
                      <ParameterInfo
                        title="Current Planned Weekly Quantity"
                        whatMeans="The number of units your business currently produces or expects to deliver per week."
                        whyNeeded="Establishes your operational baseline so the engine can calculate exactly how much extra profit optimization will generate."
                        howToDetermine="Review recent sales registers, order backlogs, or weekly manufacturing schedules."
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={product.planned_qty}
                        onChange={e =>
                          handleUpdateProduct(
                            idx,
                            'planned_qty',
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
                        }
                        placeholder="e.g. 40"
                        className="input-field pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                        units
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center mb-1.5">
                      <label className="text-xs font-medium text-slate-300">
                        Maximum weekly demand
                      </label>
                      <ParameterInfo
                        title="Maximum Weekly Demand"
                        whatMeans="The highest volume the market can realistically absorb from your business in one week, regardless of your production ability."
                        whyNeeded="Ensures the engine never suggests manufacturing products that will simply sit unsold in inventory."
                        howToDetermine="Estimate based on inbound inquiries, website traffic conversion rates, or regional market sales caps."
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={product.max_demand}
                        onChange={e =>
                          handleUpdateProduct(
                            idx,
                            'max_demand',
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
                        }
                        placeholder="e.g. 80"
                        className="input-field pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                        units
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddProduct}
              className="w-full py-3 border border-dashed border-white/[0.12] rounded-xl text-xs text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 flex items-center justify-center gap-2 transition-all hover:bg-emerald-500/5"
            >
              <Plus size={14} /> Add another product or service
            </button>
          </div>
        )}
      </section>

      {/* SECTION C: ADVANCED SETTINGS */}
      <section className="glass-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-charcoal-700 border border-white/[0.08] flex items-center justify-center text-slate-400">
              <Settings2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">C. Advanced Optimization Settings</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/[0.06]">
                  Optional
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Shared-resource constraints and system-wide penalties. Pre-configured with sensible defaults.
              </p>
            </div>
          </div>

          <div className="text-slate-400 p-1">
            {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {showAdvanced && (
          <div className="p-6 pt-0 border-t border-white/[0.06] mt-1 space-y-4 animate-fade-in">
            <div className="max-w-md pt-4">
              <div className="flex items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Shared resource penalty coefficient
                </label>
                <ParameterInfo
                  title="Shared Resource Penalty Coefficient"
                  whatMeans="Models cross-company bottlenecks that occur when all teams and products produce simultaneously (e.g. shared managers, packaging lines, server infrastructure, billing staff)."
                  whyNeeded="Prevents aggregate system congestion. Reflects that total workload scaling carries increasing friction across shared operations."
                  howToDetermine="Keep at default 0.003 for balanced operations. Increase to 0.008+ if departments frequently wait on shared internal resources."
                />
              </div>
              <input
                type="number"
                min={0}
                step={0.001}
                value={s}
                onChange={e => setS(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.003"
                className="input-field"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Default: 0.003. Higher values penalize large aggregate workloads more heavily.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* COLLAPSIBLE EDUCATIONAL SECTION */}
      <section className="glass-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <HelpCircle size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">How does the optimizer work?</h3>
              <p className="text-xs text-slate-400">Understand the mathematical logic behind your recommendations.</p>
            </div>
          </div>
          <div className="text-slate-400 p-1">
            {showHowItWorks ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {showHowItWorks && (
          <div className="p-6 pt-2 border-t border-white/[0.06] text-xs text-slate-300 space-y-3 leading-relaxed animate-fade-in">
            <p>
              OptiBiz employs a quadratic profit optimization formulation solved via <strong>SciPy Constrained Optimization (SLSQP)</strong>. The objective function balances unit profit contributions against single-product overload and shared-resource strain:
            </p>
            <div className="p-3 bg-charcoal-900 rounded-xl border border-white/[0.08] font-mono text-[11px] text-emerald-400 overflow-x-auto">
              Profit (P) = Σ [ Unit_Profit(i) × Quantity(i) ] − Σ [ Workload_Penalty(i) × Quantity(i)² ] − Shared_Penalty × [ Σ Quantity(i) ]²
            </div>
            <p className="text-slate-400">
              The engine automatically ensures three strict operational business constraints:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
              <li><strong>Non-negativity:</strong> Production quantities can never fall below 0.</li>
              <li><strong>Market Demand Cap:</strong> Output for each product will never exceed its maximum weekly demand.</li>
              <li><strong>Capacity Ceiling:</strong> The combined volume across all items will never exceed your available weekly production capacity.</li>
            </ol>
            <p className="text-[11px] text-slate-500 pt-1">
              * Note: Outputs represent model-based projections based on your stated parameters, not guaranteed real-world financial returns.
            </p>
          </div>
        )}
      </section>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm animate-fade-in">
          <AlertCircle size={18} className="shrink-0 text-red-400 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-white block mb-0.5">Validation Requirement</span>
            <span>{validationError}</span>
          </div>
        </div>
      )}

      {/* SECTION D: ANALYSIS ACTION */}
      <section className="glass-card p-6 md:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">D. Profit Analysis</h2>
            <p className="text-xs text-slate-400">
              Run the mathematical optimization engine to determine your profit-maximizing production schedule.
            </p>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={isOptimizing}
            className="btn-primary text-sm py-3 px-8 shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isOptimizing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Calculating Optimal Mix...
              </>
            ) : (
              <>
                <Play size={16} className="fill-current" />
                Run Profit Analysis
              </>
            )}
          </button>
        </div>

        {(!optimizeResult || isOutdated) && (
          <div className="p-4 bg-charcoal-750/40 rounded-xl border border-white/[0.05] text-center text-xs text-slate-400">
            {isOutdated
              ? 'Your inputs were modified. Click "Run Profit Analysis" to calculate updated optimal figures.'
              : 'Results will appear here after you configure your business information and products above, then click Run Profit Analysis.'}
          </div>
        )}
      </section>

      {/* SECTION E: RESULTS DISPLAY (Only displayed when up-to-date result exists) */}
      {optimizeResult && !isOutdated && (
        <div id="optimization-results-section" className="space-y-6 pt-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <CheckCircle2 size={18} />
              <span>Optimization Complete & Verified</span>
            </div>
            <span className="text-xs text-slate-500">
              Solver status: {optimizeResult.status} ({optimizeResult.solver_iterations} iterations)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="metric-card">
              <span className="section-title">Current Weekly Profit</span>
              <span className="text-2xl font-bold text-white mt-1">
                {fmtMoney(optimizeResult.current_profit)}
              </span>
              <span className="text-xs text-slate-400 mt-1">Based on current plan</span>
            </div>

            <div className="metric-card border-emerald-500/30 bg-emerald-500/[0.03]">
              <span className="section-title text-emerald-400">Optimized Projected Weekly Profit</span>
              <span className="text-2xl font-bold text-emerald-400 mt-1">
                {fmtMoney(optimizeResult.optimal_profit)}
              </span>
              <span className="text-xs text-emerald-500/80 mt-1">Model projection</span>
            </div>

            <div className="metric-card">
              <span className="section-title">Potential Improvement</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-emerald-400">
                  +{fmtMoney(optimizeResult.profit_difference)}
                </span>
                <span className="text-xs font-semibold text-emerald-400">
                  (+{optimizeResult.profit_improvement_pct.toFixed(1)}%)
                </span>
              </div>
              <span className="text-xs text-slate-400 mt-1">Weekly profit delta</span>
            </div>

            <div className="metric-card">
              <span className="section-title">Recommended Weekly Workload</span>
              <span className="text-2xl font-bold text-white mt-1">
                {Math.round(optimizeResult.total_optimal_qty)} units
              </span>
              <span className="text-xs text-slate-400 mt-1">
                {(optimizeResult.capacity_utilization_optimal * 100).toFixed(0)}% capacity utilized
              </span>
            </div>
          </div>

          <div className="glass-card p-6 border-l-4 border-l-emerald-500 bg-charcoal-800/90 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <Lightbulb size={17} />
              <span>Business Advisory Insight</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {generateBusinessAdvice(optimizeResult, sym)}
            </p>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white text-sm">Product-Wise Optimization Results</h3>
                <p className="text-xs text-slate-400">
                  Comparison between your planned volume and the mathematically optimal allocation.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-slate-400 bg-white/[0.01]">
                    <th className="py-3.5 px-6 font-semibold">Product / Service</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Current Planned</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Optimal Quantity</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Variance</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Marginal Profit / Unit</th>
                    <th className="py-3.5 px-6 font-semibold text-center">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {optimizeResult.products.map((p, idx) => {
                    const isIncrease = p.qty_change > 0.5
                    const isDecrease = p.qty_change < -0.5
                    return (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6 font-medium text-white text-sm">{p.name}</td>
                        <td className="py-4 px-4 text-right text-slate-300 font-medium">
                          {Math.round(p.planned_qty)} units
                        </td>
                        <td className="py-4 px-4 text-right text-emerald-400 font-bold text-sm">
                          {Math.round(p.optimal_qty)} units
                        </td>
                        <td className="py-4 px-4 text-right font-medium">
                          <span
                            className={
                              isIncrease
                                ? 'text-emerald-400'
                                : isDecrease
                                ? 'text-red-400'
                                : 'text-slate-400'
                            }
                          >
                            {isIncrease ? '+' : ''}
                            {Math.round(p.qty_change)} ({p.qty_change_pct.toFixed(0)}%)
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right text-slate-300 font-medium">
                          {fmtMoney(p.marginal_profit_at_optimal)}
                        </td>
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

          <div className="glass-card p-6 md:p-7 space-y-4">
            <div>
              <h3 className="font-semibold text-white text-sm">Current vs. Optimal Workload</h3>
              <p className="text-xs text-slate-400">
                Visualizing resource reallocation from baseline plan to optimal production levels.
              </p>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="25%" barGap={6}>
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
                      backgroundColor: '#111518',
                      borderColor: '#ffffff15',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  />
                  <Bar
                    dataKey="Current Workload"
                    fill="#334155"
                    radius={[6, 6, 0, 0]}
                    name="Current Planned Workload (units)"
                  />
                  <Bar
                    dataKey="Optimal Workload"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    name="Optimal Workload (units)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
