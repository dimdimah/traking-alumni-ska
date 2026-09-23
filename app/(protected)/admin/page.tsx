import { getAlumniStats } from '@/lib/actions/alumni'
import { Users, CheckCircle, ClipboardList, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'

export const dynamic = 'force-dynamic'

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color: 'purple' | 'slate' | 'emerald' | 'amber'; sub?: string }) {
  const colorMap = {
    purple: { bg: 'bg-amikom-purple/10', text: 'text-amikom-purple', border: 'border-amikom-purple/20' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  }
  const c = colorMap[color]
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          <p className="text-3xl font-semibold tracking-[-0.03em] text-slate-900">{value}</p>
          {sub && <p className="text-xs text-slate-500">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${c.bg} ${c.text} border ${c.border}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export default async function AdminDashboardPage() {
  const stats = await getAlumniStats()

  const responseRate = stats.totalAlumni > 0
    ? Math.round((stats.SistemAlumniFilled / stats.totalAlumni) * 100)
    : 0

  const rateColor = responseRate >= 50 ? 'emerald' as const : responseRate >= 25 ? 'amber' as const : 'slate' as const
  const needFilling = stats.totalAlumni - stats.SistemAlumniFilled

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<span className="text-[11px]">◆</span>}
        label="Admin Panel"
        title="Dashboard Admin."
        subtitle="Ringkasan data alumni dan metrik kampus."
      />

      {/* ─── Row 1: Primary Stats ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <StatCard label="Total Alumni" value={stats.totalAlumni} icon={Users} color="purple" sub="Seluruh user terdaftar" />
        <StatCard label="Super Users" value={stats.totalSuperUsers} icon={CheckCircle} color="slate" sub="Admin" />
        <StatCard label="Kuesioner Terisi" value={stats.SistemAlumniFilled} icon={ClipboardList} color="emerald" sub={`${needFilling} alumni belum mengisi`} />
        <StatCard label="Response Rate" value={`${responseRate}%`} icon={TrendingUp} color={rateColor} sub={`${stats.SistemAlumniFilled}/${stats.totalAlumni} responden`} />
      </div>

      {/* ─── Row 2: Progress per Angkatan ─── */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
        <p className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-3">Progress Pengisian Tracer Study</p>
        {stats.byAngkatan.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.byAngkatan.map((item) => {
              const rate = item.totalAlumni > 0 ? Math.round((item.filled / item.totalAlumni) * 100) : 0
              return (
                <div key={item.angkatan} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-mono uppercase tracking-wider text-slate-500">Angkatan {item.angkatan}</p>
                    <span className="text-xs text-slate-500">{item.filled} dari {item.totalAlumni} alumni</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(rate, 100)}%`,
                        backgroundColor: rate >= 50 ? '#22c55e' : rate >= 25 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[11px] text-slate-500">0%</span>
                    <span className="text-[11px] text-slate-500">{rate}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm text-center">
            <p className="text-sm text-slate-500">Belum ada angkatan tracer study.</p>
          </div>
        )}
      </div>

      {/* ─── Row 3: Quick Links ─── */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <p className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-3">Menu Cepat</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/alumni"
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-sm hover:-translate-y-0.5 block">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Manajemen</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">Kelola Alumni</p>
            <p className="text-xs text-slate-500 mt-0.5">Cari, reset password, hapus akun</p>
          </Link>
          <Link href="/admin/bulk-import"
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-sm hover:-translate-y-0.5 block">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Import</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">Tambahkan Alumni (CSV)</p>
            <p className="text-xs text-slate-500 mt-0.5">Upload CSV untuk tambah alumni massal</p>
          </Link>
          <Link href="/admin/add-user"
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-sm hover:-translate-y-0.5 block">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">User Baru</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">Tambahkan Alumni</p>
            <p className="text-xs text-slate-500 mt-0.5">Buat akun alumni manual satu per satu</p>
          </Link>
          <Link href="/admin/kuesioner"
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-sm hover:-translate-y-0.5 block">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Tracer Study</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">Kelola Tracer Study</p>
            <p className="text-xs text-slate-500 mt-0.5">Kelola pertanyaan &amp; ekspor Excel</p>
          </Link>
          <Link href="/admin/career-center"
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-sm hover:-translate-y-0.5 block">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Konten</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">Kelola Lowongan Kerja</p>
            <p className="text-xs text-slate-500 mt-0.5">Publikasikan lowongan kerja</p>
          </Link>
          <Link href="/admin/analytics"
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-sm hover:-translate-y-0.5 block">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Analisis</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">Lihat Analitik</p>
            <p className="text-xs text-slate-500 mt-0.5">Grafik data tracer study</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
