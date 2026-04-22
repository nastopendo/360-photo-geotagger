interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  blue:   'bg-sky/15 text-sky',
  green:  'bg-match/15 text-match',
  yellow: 'bg-caution/15 text-caution',
  red:    'bg-cut/15 text-cut',
  gray:   'bg-panel text-ink-mute',
}

export function Badge({ children, variant = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  )
}
