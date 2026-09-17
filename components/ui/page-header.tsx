import type { ReactNode } from 'react'

interface PageHeaderProps {
  icon: ReactNode
  label: string
  title: string
  subtitle?: string
  action?: ReactNode
}

export function PageHeader({ icon, label, title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="space-y-1.5 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-amikom-purple text-amikom-jonquil-warm">
          {icon}
        </span>
        <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
          {label}
        </p>
      </div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-sans text-3xl font-semibold tracking-[-0.03em] text-amikom-ink leading-[1.1] md:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-slate-600">{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0 ml-4">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
