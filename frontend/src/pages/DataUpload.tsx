// DataUpload.tsx — Modern CSV & Excel Data Importer
import { useState, useRef } from 'react'
import {
  Upload, FileText, CheckCircle2, AlertCircle, FileSpreadsheet,
  ArrowRight, Sparkles, Check, HelpCircle, Table, RefreshCw
} from 'lucide-react'
import { uploadPreview } from '../api'
import { useStore } from '../store'

interface PreviewData {
  filename: string
  total_rows: number
  columns: string[]
  sample_rows: Record<string, unknown>[]
  suggested_mapping: Record<string, string>
  label: string
}

const PARAMETER_DESCRIPTIONS: Record<string, string> = {
  name: 'Product / Service Name',
  m_i: 'Profit earned per unit ($)',
  a_i: 'Workload penalty coefficient',
  planned_qty: 'Current planned weekly quantity',
  max_demand: 'Maximum weekly demand',
}

export default function DataUpload() {
  const { setActivePage } = useStore()
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    setError(null)
    setPreview(null)
    setLoading(true)
    try {
      const data = await uploadPreview(file)
      setPreview(data)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'File upload failed. Ensure your file is a valid .CSV or .XLSX document.')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleCreateMockSample = () => {
    const csvContent =
      'Product Name,Profit Per Unit,Overload Penalty,Planned Qty,Max Demand\n' +
      'Growth Retainer,180,0.35,25,60\n' +
      'Web Engineering,240,0.70,15,35\n' +
      'SEO Audit,95,0.15,40,80\n' +
      'Brand Identity,310,1.10,10,25\n'

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const file = new File([blob], 'optibiz_sample_products.csv', { type: 'text/csv' })
    processFile(file)
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto animate-fade-in text-slate-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Data Import & Mapping
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              CSV / Excel
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Import existing product catalogs, historical sales records, or cost sheets into OptiBiz.
          </p>
        </div>

        <button
          onClick={handleCreateMockSample}
          className="btn-ghost flex items-center gap-2 self-start sm:self-auto text-xs py-2 px-3 border border-white/[0.12] hover:border-emerald-500/40"
        >
          <Sparkles size={14} className="text-emerald-400" />
          Load Sample Business CSV
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={e => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`glass-card p-10 md:p-14 flex flex-col items-center justify-center gap-4 cursor-pointer text-center transition-all duration-200 group border-2 border-dashed
          ${dragging
            ? 'border-emerald-500 bg-emerald-500/10 shadow-glow-emerald'
            : 'border-white/[0.12] hover:border-emerald-500/50 hover:bg-charcoal-750/50'
          }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-charcoal-700/80 border border-white/[0.08] flex items-center justify-center text-slate-300 group-hover:text-emerald-400 group-hover:scale-105 transition-all shadow-card">
          {loading ? (
            <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload size={28} />
          )}
        </div>

        <div className="space-y-1.5 max-w-sm">
          <p className="text-base font-semibold text-white">
            {loading ? 'Analyzing columns and formatting...' : 'Drop your spreadsheet here'}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Drag & drop your file or click to browse. We support standard <strong className="text-slate-300">.CSV</strong>, <strong className="text-slate-300">.XLSX</strong>, and <strong className="text-slate-300">.XLS</strong> spreadsheets.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-charcoal-700/60 border border-white/[0.06] text-slate-400">
            Comma-separated values
          </span>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-charcoal-700/60 border border-white/[0.06] text-slate-400">
            Excel Workbooks
          </span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={onInput}
          className="hidden"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm animate-fade-in">
          <AlertCircle size={18} className="shrink-0 text-red-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Preview & Column Mapping Results */}
      {preview && (
        <div className="space-y-6 animate-slide-up">
          {/* File summary bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>
                Successfully parsed <strong>{preview.filename}</strong> — {preview.total_rows} rows, {preview.columns.length} columns detected.
              </span>
            </div>
            <button
              onClick={() => setActivePage('optimizer')}
              className="btn-primary text-xs py-2 px-4 shadow-sm"
            >
              Open in Optimizer <ArrowRight size={13} />
            </button>
          </div>

          {/* Suggested Parameter Mapping */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Intelligent Column Mapping</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  OptiBiz automatically matched your spreadsheet columns to model inputs.
                </p>
              </div>
              <span className="text-xs text-slate-500">Auto-detected</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {['name', 'm_i', 'a_i', 'planned_qty', 'max_demand'].map(param => {
                const matchedCol = preview.suggested_mapping[param]
                return (
                  <div
                    key={param}
                    className="p-4 rounded-xl bg-charcoal-750/70 border border-white/[0.08] space-y-2 hover:border-white/[0.15] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {PARAMETER_DESCRIPTIONS[param] || param}
                      </span>
                      {matchedCol ? (
                        <Check size={13} className="text-emerald-400" />
                      ) : (
                        <span className="text-[10px] text-amber-400">Manual</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <FileSpreadsheet size={14} className="text-emerald-400 shrink-0" />
                      <span className="text-sm font-semibold text-white truncate">
                        {matchedCol ? `"${matchedCol}"` : 'Not detected in file'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Data Preview Table */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white text-sm">Data Sample Preview</h3>
                <p className="text-xs text-slate-400 mt-0.5">First 5 records extracted from file</p>
              </div>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                Verified Encoding
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-slate-400 bg-charcoal-750/50">
                    <th className="py-3 px-5 font-semibold">#</th>
                    {preview.columns.map(c => (
                      <th key={c} className="py-3 px-5 font-semibold whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {preview.sample_rows.map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-5 text-slate-500 font-medium">{i + 1}</td>
                      {preview.columns.map(c => (
                        <td key={c} className="py-3 px-5 text-slate-200 whitespace-nowrap">
                          {String(row[c] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
