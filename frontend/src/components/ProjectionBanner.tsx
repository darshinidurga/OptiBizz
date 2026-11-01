// ProjectionBanner.tsx — persistent disclaimer
import { AlertTriangle } from 'lucide-react'

export default function ProjectionBanner() {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs">
      <AlertTriangle size={12} className="shrink-0" />
      <span>
        <strong>Model Projection:</strong> All figures are derived from the quadratic profit formula P = Σ(m_i·q_i) − Σ(a_i·q_i²) − s·(Σq_i)². Not guaranteed real-world outcomes.
      </span>
    </div>
  )
}

