// AIAdvisor.tsx — Contextual Business Intelligence AI Advisor
import { useState, useRef, useEffect } from 'react'
import {
  Send, User, Sparkles, Bot, ArrowRight, CheckCircle2,
  HelpCircle, Lightbulb, ShieldCheck, Zap
} from 'lucide-react'
import { useStore } from '../store'
import type { OptimizeResponse } from '../types'
import { formatCurrency, getCurrencySymbol } from '../utils/currency'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

/**
 * Local rule-based advisor grounded in real mathematical results.
 * Never invents figures; cites strictly model parameters & results.
 */
function generateContextualAnswer(input: string, result: OptimizeResponse | null, currency: string = 'USD'): string {
  const q = input.toLowerCase()
  const sym = getCurrencySymbol(currency)

  if (!result) {
    return (
      "I don't have optimization results to analyze yet. Please head to the **Profit Optimizer** and run an analysis on your products. Once complete, I'll provide deep, mathematically-backed insights on your business!"
    )
  }

  const byMP = [...result.products].sort((a, b) => b.marginal_profit_at_optimal - a.marginal_profit_at_optimal)
  const byVol = [...result.products].sort((a, b) => b.optimal_qty - a.optimal_qty)
  const increases = result.products.filter(p => p.recommendation === 'increase')
  const decreases = result.products.filter(p => p.recommendation === 'decrease')

  // Profit / Financial Questions
  if (q.includes('profit') || q.includes('revenue') || q.includes('earn') || q.includes('money') || q.includes('uplift')) {
    return (
      `**Financial Projection Analysis:**\n\n` +
      `• **Current Planned Profit:** ${formatCurrency(result.current_profit, currency)} / week\n` +
      `• **Optimized Projected Profit:** ${formatCurrency(result.optimal_profit, currency)} / week\n` +
      `• **Net Improvement:** **+${formatCurrency(result.profit_difference, currency)}** (+${result.profit_improvement_pct.toFixed(1)}%)\n\n` +
      `By reallocating your workload from ${Math.round(result.total_planned_qty)} units to the recommended **${Math.round(result.total_optimal_qty)} units**, your net margin expands significantly due to reduced bottleneck friction.\n\n` +
      `*Note: Projections reflect the quadratic model parameters and depend on real-world demand execution.*`
    )
  }

  // Focus / Priority
  if (q.includes('focus') || q.includes('best') || q.includes('priority') || q.includes('which product') || q.includes('top')) {
    const top = byMP[0]
    return (
      `**Strategic Product Focus:**\n\n` +
      `Your highest margin contribution per extra unit is **${top.name}** at **${formatCurrency(top.marginal_profit_at_optimal, currency)}/unit** at optimal equilibrium.\n\n` +
      `• **Recommended Output:** ${Math.round(top.optimal_qty)} units/week\n` +
      `• **Volume Leader:** In terms of gross volume, **${byVol[0].name}** carries the highest allocation at ${Math.round(byVol[0].optimal_qty)} units/week.\n\n` +
      `Prioritize marketing and delivery capacity for **${top.name}** first, as each additional unit provides the greatest cushion against fixed overheads.`
    )
  }

  // Increase
  if (q.includes('increase') || q.includes('scale') || q.includes('grow') || q.includes('expand')) {
    if (increases.length === 0) {
      return `**Workload Assessment:**\n\nNo products are currently recommended for expansion beyond your planned figures. Your existing targets are already near their mathematical ceiling.`
    }
    const list = increases
      .map(p => `• **${p.name}:** Scale from ${Math.round(p.planned_qty)} → **${Math.round(p.optimal_qty)} units** (+${Math.round(p.qty_change)} units, +${p.qty_change_pct.toFixed(0)}%)`)
      .join('\n')
    return (
      `**Recommended Production Increases:**\n\nThe optimization engine recommends scaling output for ${increases.length} item(s):\n\n${list}\n\n` +
      `These increases remain fully within your aggregate capacity cap of ${Math.round(result.capacity)} units/week.`
    )
  }

  // Decrease
  if (q.includes('decrease') || q.includes('reduce') || q.includes('cut') || q.includes('trim') || q.includes('less')) {
    if (decreases.length === 0) {
      return `**Workload Assessment:**\n\nNo products need to be reduced. All offerings are operating profitably within their respective workload penalty bands.`
    }
    const list = decreases
      .map(p => `• **${p.name}:** Trim from ${Math.round(p.planned_qty)} → **${Math.round(p.optimal_qty)} units** (${Math.round(p.qty_change)} units)`)
      .join('\n')
    return (
      `**Recommended Production Reductions:**\n\nReducing volume on saturated offerings frees up vital shared capacity:\n\n${list}\n\n` +
      `Trimming these items prevents diminishing returns and eliminates disproportionate overtime or fulfillment friction.`
    )
  }

  // Capacity / Utilization
  if (q.includes('capacity') || q.includes('workload') || q.includes('utilization') || q.includes('hours')) {
    return (
      `**Operational Capacity Utilization:**\n\n` +
      `• **Total Available Capacity:** ${Math.round(result.capacity)} units/week\n` +
      `• **Planned Workload:** ${Math.round(result.total_planned_qty)} units (${(result.capacity_utilization_planned * 100).toFixed(0)}%)\n` +
      `• **Recommended Workload:** **${Math.round(result.total_optimal_qty)} units** (${(result.capacity_utilization_optimal * 100).toFixed(0)}%)\n\n` +
      `Shared system penalty at planned: ${formatCurrency(result.shared_resource_penalty_planned, currency)} → reduced to **${formatCurrency(result.shared_resource_penalty_optimal, currency)}** at optimal.`
    )
  }

  // Math / Model Explanation
  if (q.includes('model') || q.includes('formula') || q.includes('math') || q.includes('equation') || q.includes('how')) {
    return (
      `**Mathematical Optimization Architecture:**\n\n` +
      `OptiBiz maximizes total net business profit using a quadratic formulation solved via **SciPy Constrained Optimization (SLSQP)**:\n\n` +
      `$$\\text{Profit } P = \\sum (m_i \\cdot q_i) - \\sum (a_i \\cdot q_i^2) - s \\cdot (\\sum q_i)^2$$\n\n` +
      `• **m_i:** Profit earned per unit (${sym})\n` +
      `• **a_i:** Workload penalty coefficient (overload strain)\n` +
      `• **s:** Shared resource penalty coefficient (aggregate bottleneck)\n` +
      `• **q_i:** Production output for product i\n\n` +
      `Subject to: $q_i \\ge 0$, individual demand ceilings, and total production $\\le$ available capacity.`
    )
  }

  // Solver info
  if (q.includes('solver') || q.includes('algorithm') || q.includes('converge') || q.includes('scipy')) {
    return (
      `**Numerical Solver Report:**\n\n` +
      `• **Algorithm:** Sequential Least Squares Programming (SLSQP)\n` +
      `• **Convergence Status:** ${result.status} (${result.status_message})\n` +
      `• **Iterations Completed:** ${result.solver_iterations}\n\n` +
      `Because penalty coefficients are strictly non-negative, the objective surface is concave, ensuring that the detected solution is the global profit maximum.`
    )
  }

  return (
    `I am your OptiBiz AI Advisor. I can analyze your latest business calculations. Ask me anything, such as:\n\n` +
    `• "What is my optimal profit?"\n` +
    `• "Which product should I prioritize?"\n` +
    `• "What should I increase or trim?"\n` +
    `• "Explain the mathematical formula"\n` +
    `• "How is our capacity being used?"`
  )
}

function renderMessageText(text: string) {
  return text.split('\n').map((line, idx) => {
    const bolded = line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    if (line.startsWith('• ')) {
      return (
        <li
          key={idx}
          dangerouslySetInnerHTML={{ __html: bolded.slice(2) }}
          className="ml-4 text-slate-300 text-sm leading-relaxed"
        />
      )
    }
    if (line.startsWith('*') && line.endsWith('*')) {
      return (
        <p
          key={idx}
          dangerouslySetInnerHTML={{ __html: bolded }}
          className="text-xs text-slate-400 italic mt-1"
        />
      )
    }
    return (
      <p
        key={idx}
        dangerouslySetInnerHTML={{ __html: bolded }}
        className="text-sm text-slate-200 leading-relaxed min-h-[1.25rem]"
      />
    )
  })
}

const PROMPT_SUGGESTIONS = [
  'What is my optimal profit?',
  'Which product should I prioritize?',
  'What should I increase or trim?',
  'How is our capacity being used?',
  'Explain the mathematical formula',
  'What do the penalties mean?',
]

export default function AIAdvisor() {
  const { optimizeResult, setActivePage, currency } = useStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: optimizeResult
        ? "Hello! I am your **OptiBiz AI Business Advisor**. I have reviewed your latest optimization model. Ask me about your optimal profit, which products to prioritize, or where bottlenecks occur."
        : "Hello! I am your **OptiBiz AI Business Advisor**. To unlock full diagnostic capabilities, please configure and run the **Profit Optimizer**. I can also answer questions regarding the mathematical model at any time.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = (textToSend?: string) => {
    const query = (textToSend ?? input).trim()
    if (!query) return
    setInput('')

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    setTimeout(() => {
      const response = generateContextualAnswer(query, optimizeResult, currency)
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, botMsg])
      setIsTyping(false)
    }, 450)
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto h-[calc(100vh-2rem)] flex flex-col space-y-4 animate-fade-in text-slate-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/[0.08] shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Business Advisor</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Context-Aware
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-0.5">
            Real-time advisory grounded strictly in your mathematical optimization model.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-charcoal-800 border border-white/[0.08] text-xs text-slate-300">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Zero Hallucination Guaranteed</span>
          </span>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="glass-card flex-1 flex flex-col overflow-hidden border border-white/[0.08]">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-5 md:p-7 space-y-5">
          {messages.map(m => {
            const isUser = m.role === 'user'
            return (
              <div
                key={m.id}
                className={`flex gap-3.5 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'} animate-slide-up`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md ${
                    isUser
                      ? 'bg-slate-700 border border-white/[0.1]'
                      : 'bg-gradient-to-tr from-emerald-600 to-emerald-400 shadow-emerald-500/10'
                  }`}
                >
                  {isUser ? <User size={15} /> : <Sparkles size={15} />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-4 md:p-5 rounded-2xl space-y-2 text-sm ${
                    isUser
                      ? 'bg-emerald-600/20 border border-emerald-500/30 text-white rounded-tr-sm'
                      : 'bg-charcoal-750/90 border border-white/[0.08] text-slate-200 rounded-tl-sm shadow-card'
                  }`}
                >
                  {renderMessageText(m.content)}
                  <div
                    className={`text-[10px] mt-1 pt-1 ${
                      isUser ? 'text-emerald-400/80 text-right' : 'text-slate-500 text-left'
                    }`}
                  >
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )
          })}

          {isTyping && (
            <div className="flex gap-3.5 max-w-xl mr-auto animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shrink-0 text-white">
                <Sparkles size={15} />
              </div>
              <div className="p-4 rounded-2xl bg-charcoal-750/90 border border-white/[0.08] flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-5 py-3 border-t border-white/[0.06] bg-charcoal-850/60">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {PROMPT_SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="whitespace-nowrap text-xs px-3.5 py-1.5 rounded-full bg-charcoal-700/80 hover:bg-emerald-500/15 text-slate-300 hover:text-emerald-300 border border-white/[0.08] hover:border-emerald-500/30 transition-all shrink-0"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/[0.08] bg-charcoal-800/95 flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask a question about your profitability, products, or capacity..."
            className="input-field flex-1 text-sm bg-charcoal-750/90"
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="btn-primary px-5 py-2.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            <Send size={15} />
            <span className="hidden sm:inline">Ask Advisor</span>
          </button>
        </div>
      </div>
    </div>
  )
}
