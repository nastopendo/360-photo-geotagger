import type { ConfidenceScore } from '@/types'

const tierConfig: Record<ConfidenceScore['tier'], { label: string; dot: string; text: string; bg: string }> = {
  high:   { label: 'High',   dot: 'bg-match',   text: 'text-match',   bg: 'bg-match/10' },
  medium: { label: 'Med',    dot: 'bg-caution',  text: 'text-caution', bg: 'bg-caution/10' },
  low:    { label: 'Low',    dot: 'bg-cut',      text: 'text-cut',     bg: 'bg-cut/10' },
  none:   { label: 'None',   dot: 'bg-ink-mute', text: 'text-ink-mute', bg: 'bg-panel' },
}

interface ConfidenceBadgeProps {
  confidence: ConfidenceScore
  showValue?: boolean
}

export function ConfidenceBadge({ confidence, showValue = false }: ConfidenceBadgeProps) {
  const { label, dot, text, bg } = tierConfig[confidence.tier]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${bg} ${text}`}
      title={confidence.reason}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {label}
      {showValue && (
        <span className="opacity-60 font-mono">
          {(confidence.value * 100).toFixed(0)}%
        </span>
      )}
    </span>
  )
}
