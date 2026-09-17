'use client'

import { Briefcase, ClipboardCheck, Eye, CheckCircle2 } from 'lucide-react'

interface StatsGridProps {
  trackRecordCount: number
  SistemAlumniFilled: boolean
  jobCount: number
  completenessPercentage: number
}

function StatItem({ icon: Icon, bg, text, label, value, subtitle }: {
  icon: React.ComponentType<{ className?: string }>
  bg: string
  text: string
  label: string
  value: string | number
  subtitle: string
}) {
  return (
    <div className="group relative rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 font-mono">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-900">{value}</p>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${text} border border-slate-200`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export function StatsGrid({ trackRecordCount, SistemAlumniFilled, jobCount, completenessPercentage }: StatsGridProps) {
  const profileBadgeColor = completenessPercentage >= 80
    ? { bg: 'bg-emerald-50', text: 'text-emerald-600' }
    : completenessPercentage >= 50
    ? { bg: 'bg-amber-50', text: 'text-amber-600' }
    : { bg: 'bg-red-50', text: 'text-red-600' }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatItem
        icon={Briefcase}
        bg="bg-amikom-purple/10"
        text="text-amikom-purple"
        label="Riwayat Kerja"
        value={trackRecordCount}
        subtitle="Riwayat kerja tersimpan"
      />
      <StatItem
        icon={ClipboardCheck}
        bg="bg-emerald-50"
        text="text-emerald-600"
        label="Tracer Study"
        value={SistemAlumniFilled ? 'Selesai' : '—'}
        subtitle={SistemAlumniFilled ? 'Kuesioner sudah diisi' : 'Belum mengisi kuesioner'}
      />
      <StatItem
        icon={Eye}
        bg="bg-blue-50"
        text="text-blue-600"
        label="Lowongan Aktif"
        value={jobCount}
        subtitle="Lowongan kerja tersedia"
      />
      <div className="group relative rounded-lg border border-slate-200 bg-gradient-to-br from-amikom-pearl/50 to-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 font-mono">Profil</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-900">{completenessPercentage}%</p>
            <p className="mt-1 text-sm text-slate-600">Kelengkapan profil</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${profileBadgeColor.bg} ${profileBadgeColor.text} border border-slate-200`}>
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              completenessPercentage >= 80
                ? 'bg-emerald-500'
                : completenessPercentage >= 50
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${completenessPercentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}