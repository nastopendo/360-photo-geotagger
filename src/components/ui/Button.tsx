import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-sky text-white hover:bg-sky-light shadow-[0_0_14px_rgba(68,144,245,0.25)] hover:shadow-[0_0_18px_rgba(68,144,245,0.35)] disabled:bg-sky/40 disabled:shadow-none',
  secondary:
    'bg-panel text-ink-soft border border-line hover:bg-hover hover:text-ink hover:border-line-soft disabled:opacity-40',
  danger:
    'bg-cut/10 text-cut border border-cut/30 hover:bg-cut/20 hover:border-cut/50 disabled:opacity-40',
  ghost:
    'text-ink-soft hover:bg-panel hover:text-ink disabled:opacity-40',
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  )
}
