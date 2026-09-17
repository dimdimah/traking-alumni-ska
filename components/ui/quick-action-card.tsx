'use client'

import { Briefcase, ClipboardCheck, Building2, Sparkles, User } from 'lucide-react'

interface QuickActionCardProps {
  href: string
  label: string
  title: string
  description: string
  highlight?: boolean
  iconColor?: 'purple' | 'blue' | 'green' | 'orange' | 'slate'
}

const iconMap = {
  purple: { bg: 'bg-amikom-purple/10', text: 'text-amikom-purple', Icon: Briefcase },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', Icon: Building2 },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600', Icon: ClipboardCheck },
  orange: { bg: 'bg-amber-50', text: 'text-amber-600', Icon: Sparkles },
  slate: { bg: 'bg-slate-50', text: 'text-slate-600', Icon: User },
}

export function QuickActionCard({ href, label, title, description, highlight, iconColor = 'slate' }: QuickActionCardProps) {
  const { bg, text, Icon } = iconMap[iconColor]

  return (
    <a
      href={href}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          window.location.href = href
        }
      }}
      className={`rounded-lg border p-4 shadow-sm transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 block ${
        highlight
          ? 'border-amikom-purple/20 bg-gradient-to-br from-amikom-purple/5 to-white'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${text}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className={`text-[11px] font-mono uppercase tracking-wider ${
            highlight ? 'text-amikom-purple' : 'text-slate-500'
          }`}>
            {label}
          </p>
          <p className="text-sm text-slate-900 mt-1 font-medium">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
    </a>
  )
}