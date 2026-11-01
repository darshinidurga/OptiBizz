// RecommendationBadge.tsx
interface Props { rec: 'increase' | 'decrease' | 'maintain' }

export default function RecommendationBadge({ rec }: Props) {
  const cls = rec === 'increase' ? 'tag-increase' : rec === 'decrease' ? 'tag-decrease' : 'tag-maintain'
  const label = rec.charAt(0).toUpperCase() + rec.slice(1)
  return <span className={cls}>{label}</span>
}

