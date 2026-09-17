'use client'

import { Users, CheckCircle, BarChart3, AlertCircle } from 'lucide-react'

interface AdminStatsGridProps {
  totalUsers: number
  superUserCount: number
  regularUserCount: number
}

function AdminStatCard({ title, value, icon, color }: {
  title: string
  value: string | number
  icon: React.ReactNode
  color: 'indigo' | 'blue' | 'green' | 'amber'
}) {
  const colorConfig: Record<string, string> = {
    indigo: 'bg-amikom-purple/10 text-amikom-purple border-amikom-purple/20',
    blue: 'bg-slate-100 text-slate-600 border-slate-200',
    green: 'bg-slate-100 text-slate-600 border-slate-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
  }

  return (
    <div className="group relative rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 font-mono">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-900">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-md border ${colorConfig[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export function AdminStatsGrid({ totalUsers, superUserCount, regularUserCount }: AdminStatsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AdminStatCard title="Total Users" value={totalUsers} icon={<Users className="h-6 w-6" />} color="blue" />
      <AdminStatCard title="Super Users" value={superUserCount} icon={<CheckCircle className="h-6 w-6" />} color="indigo" />
      <AdminStatCard title="Regular Users" value={regularUserCount} icon={<BarChart3 className="h-6 w-6" />} color="green" />
      <AdminStatCard title="Total Akun" value={totalUsers} icon={<AlertCircle className="h-6 w-6" />} color="amber" />
    </div>
  )
}
