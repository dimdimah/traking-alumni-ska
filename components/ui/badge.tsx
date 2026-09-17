import * as React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'accent'
}

const badgeVariants: Record<string, string> = {
  default: 'bg-amikom-purple text-white border border-amikom-purple',
  secondary: 'bg-amikom-parchment text-amikom-ink/60 border border-amikom-hairline',
  destructive: 'bg-amikom-danger-bg text-amikom-danger border border-amikom-danger/20',
  outline: 'border border-amikom-hairline text-amikom-ink/60 bg-transparent',
  success: 'bg-amikom-success-bg text-amikom-success border border-amikom-success/20',
  warning: 'bg-amikom-warning-bg text-amikom-warning border border-amikom-warning/20',
  accent: 'bg-amikom-jonquil/20 text-amikom-jonquil border border-amikom-jonquil/30',
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = '', variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold font-mono tracking-wider uppercase ${badgeVariants[variant]} ${className}`}
      {...props}
    />
  )
)
Badge.displayName = 'Badge'

export { Badge }
