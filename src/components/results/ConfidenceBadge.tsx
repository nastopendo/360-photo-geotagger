import type { ConfidenceScore } from '@/types'

const tierConfig: Record<ConfidenceScore['tier'], { label: string; className: string }> = {
  high:   { label: 'High',   className: 'bg-green-100 text-green-700' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700' },
  low:    { label: 'Low',    className: 'bg-red-100 text-red-700' },
  none:   { label: 'None',   className: 'bg-gray-100 text-gray-500' },
}

interface ConfidenceBadgeProps {
  confidence: ConfidenceScore
  showValue?: boolean
}

export function ConfidenceBadge({ confidence, showValue = false }: ConfidenceBadgeProps) {
  const { label, className } = tierConfig[confidence.tier]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
      title={confidence.reason}
    >
      {label}
      {showValue && <span className="ml-1 opacity-70">({(confidence.value * 100).toFixed(0)}%)</span>}
    </span>
  )
}
