// store.ts — Centralized Zustand state with robust localStorage persistence
import { create } from 'zustand'
import type { OptimizeRequest, OptimizeResponse, ProductRequest, Page } from './types'

export const STORAGE_KEY_INPUTS = 'optibiz_business_inputs'
export const STORAGE_KEY_RESULTS = 'optibiz_optimization_results'

export interface SavedBusinessInputs {
  businessName: string
  industry: string
  currency: string
  capacity: number | ''
  s: number | ''
  products: ProductRequest[]
  savedAt: number
}

export interface SavedOptimizationData {
  optimizeResult: OptimizeResponse | null
  lastRequest: OptimizeRequest | null
  isOutdated: boolean
}

// ---------------------------------------------------------------------------
// Storage Helpers
// ---------------------------------------------------------------------------

export function loadSavedInputsFromStorage(): SavedBusinessInputs | null {
  try {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(STORAGE_KEY_INPUTS)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      businessName: typeof parsed.businessName === 'string' ? parsed.businessName : '',
      industry: typeof parsed.industry === 'string' ? parsed.industry : '',
      currency: typeof parsed.currency === 'string' ? parsed.currency : 'USD',
      capacity: parsed.capacity !== undefined && parsed.capacity !== null ? parsed.capacity : '',
      s: parsed.s !== undefined && parsed.s !== null ? parsed.s : 0.003,
      products: Array.isArray(parsed.products) ? parsed.products : [],
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
    }
  } catch (err) {
    console.error('Error loading saved inputs from localStorage:', err)
    return null
  }
}

export function saveInputsToStorage(inputs: Omit<SavedBusinessInputs, 'savedAt'>): void {
  try {
    if (typeof window === 'undefined') return
    const payload: SavedBusinessInputs = {
      ...inputs,
      savedAt: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY_INPUTS, JSON.stringify(payload))
  } catch (err) {
    console.error('Error saving inputs to localStorage:', err)
  }
}

export function loadSavedResultsFromStorage(): SavedOptimizationData | null {
  try {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(STORAGE_KEY_RESULTS)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      optimizeResult: parsed.optimizeResult || null,
      lastRequest: parsed.lastRequest || null,
      isOutdated: Boolean(parsed.isOutdated),
    }
  } catch (err) {
    console.error('Error loading saved results from localStorage:', err)
    return null
  }
}

export function saveResultsToStorage(data: SavedOptimizationData): void {
  try {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(data))
  } catch (err) {
    console.error('Error saving results to localStorage:', err)
  }
}

export function clearAllStorageData(): void {
  try {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY_INPUTS)
    localStorage.removeItem(STORAGE_KEY_RESULTS)
  } catch (err) {
    console.error('Error clearing localStorage:', err)
  }
}

// ---------------------------------------------------------------------------
// Store Definition
// ---------------------------------------------------------------------------

export const DEMO_BUSINESS_INPUTS: Omit<SavedBusinessInputs, 'savedAt'> = {
  businessName: 'Apex Digital Growth Agency',
  industry: 'Professional Services & Consulting',
  currency: 'USD',
  capacity: 130,
  s: 0.003,
  products: [
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
  ],
}

const initialSavedInputs = loadSavedInputsFromStorage()
const initialSavedResults = loadSavedResultsFromStorage()

interface AppState {
  activePage: Page
  setActivePage: (page: Page) => void

  backendOnline: boolean
  setBackendOnline: (v: boolean) => void

  // Persistence status
  saveStatus: 'saved' | 'saving' | 'idle'
  setSaveStatus: (status: 'saved' | 'saving' | 'idle') => void

  // User configured business inputs
  businessName: string
  setBusinessName: (name: string) => void
  industry: string
  setIndustry: (ind: string) => void
  currency: string
  setCurrency: (c: string) => void

  products: ProductRequest[]
  setProducts: (products: ProductRequest[]) => void
  capacity: number | ''
  setCapacity: (cap: number | '') => void
  s: number | ''
  setS: (s: number | '') => void

  // Optimization results (strictly separated from inputs)
  optimizeResult: OptimizeResponse | null
  lastRequest: OptimizeRequest | null
  isOutdated: boolean
  optimizationError: string | null

  // State actions
  updateBusinessInputs: (partial: Partial<Omit<SavedBusinessInputs, 'savedAt'>>) => void
  markInputsChanged: () => void
  setOptimizationSuccess: (req: OptimizeRequest, res: OptimizeResponse) => void
  setOptimizationFailure: (errorMsg: string) => void
  clearBusinessData: () => void
  loadDemoData: (demoInputs?: Omit<SavedBusinessInputs, 'savedAt'>) => void
}

export const useStore = create<AppState>((set, get) => ({
  activePage: 'optimizer',
  setActivePage: (page) => set({ activePage: page }),

  backendOnline: false,
  setBackendOnline: (v) => set({ backendOnline: v }),

  saveStatus: initialSavedInputs ? 'saved' : 'idle',
  setSaveStatus: (saveStatus) => set({ saveStatus }),

  // Initialize from localStorage if present; otherwise genuinely empty
  businessName: initialSavedInputs?.businessName ?? '',
  setBusinessName: (businessName) => {
    get().updateBusinessInputs({ businessName })
  },

  industry: initialSavedInputs?.industry ?? '',
  setIndustry: (industry) => {
    get().updateBusinessInputs({ industry })
  },

  currency: initialSavedInputs?.currency ?? 'USD',
  setCurrency: (currency) => {
    get().updateBusinessInputs({ currency })
  },

  capacity: initialSavedInputs?.capacity ?? '',
  setCapacity: (capacity) => {
    get().updateBusinessInputs({ capacity })
  },

  s: initialSavedInputs?.s ?? 0.003,
  setS: (s) => {
    get().updateBusinessInputs({ s })
  },

  products: initialSavedInputs?.products ?? [],
  setProducts: (products) => {
    get().updateBusinessInputs({ products })
  },

  // Initialize results from localStorage if present
  optimizeResult: initialSavedResults?.optimizeResult ?? null,
  lastRequest: initialSavedResults?.lastRequest ?? null,
  isOutdated: initialSavedResults?.isOutdated ?? false,
  optimizationError: null,

  // Automatically persists any input change to localStorage & marks results outdated
  updateBusinessInputs: (partial) => {
    const current = get()
    const updated = {
      businessName: partial.businessName !== undefined ? partial.businessName : current.businessName,
      industry: partial.industry !== undefined ? partial.industry : current.industry,
      currency: partial.currency !== undefined ? partial.currency : current.currency,
      capacity: partial.capacity !== undefined ? partial.capacity : current.capacity,
      s: partial.s !== undefined ? partial.s : current.s,
      products: partial.products !== undefined ? partial.products : current.products,
    }

    // Save to localStorage immediately
    saveInputsToStorage(updated)

    // If an optimization result already existed, mark it as outdated
    const wasOutdated = current.optimizeResult !== null ? true : false
    if (wasOutdated) {
      saveResultsToStorage({
        optimizeResult: current.optimizeResult,
        lastRequest: current.lastRequest,
        isOutdated: true,
      })
    }

    set({
      ...updated,
      saveStatus: 'saved',
      isOutdated: wasOutdated,
      optimizationError: null,
    })
  },

  markInputsChanged: () => {
    const current = get()
    if (current.optimizeResult !== null) {
      saveResultsToStorage({
        optimizeResult: current.optimizeResult,
        lastRequest: current.lastRequest,
        isOutdated: true,
      })
      set({ isOutdated: true })
    }
  },

  setOptimizationSuccess: (req, res) => {
    saveResultsToStorage({
      optimizeResult: res,
      lastRequest: req,
      isOutdated: false,
    })
    set({
      optimizeResult: res,
      lastRequest: req,
      isOutdated: false,
      optimizationError: null,
    })
  },

  setOptimizationFailure: (errorMsg) => {
    saveResultsToStorage({
      optimizeResult: null,
      lastRequest: null,
      isOutdated: false,
    })
    set({
      optimizeResult: null,
      lastRequest: null,
      isOutdated: false,
      optimizationError: errorMsg,
    })
  },

  clearBusinessData: () => {
    clearAllStorageData()
    set({
      businessName: '',
      industry: '',
      currency: 'USD',
      capacity: '',
      s: 0.003,
      products: [],
      optimizeResult: null,
      lastRequest: null,
      isOutdated: false,
      optimizationError: null,
      saveStatus: 'idle',
    })
  },

  loadDemoData: (demoInputs) => {
    const data = demoInputs ?? DEMO_BUSINESS_INPUTS
    saveInputsToStorage(data)
    saveResultsToStorage({
      optimizeResult: null,
      lastRequest: null,
      isOutdated: false,
    })
    set({
      ...data,
      optimizeResult: null,
      lastRequest: null,
      isOutdated: false,
      optimizationError: null,
      saveStatus: 'saved',
    })
  },
}))
