import { getAlumniStats } from '@/lib/actions/alumni'
import { getSistemAlumniStats } from '@/lib/actions/questions'
import { getMatchingStats } from '@/lib/actions/matching'
import { getUsersPaginated } from '@/lib/actions/alumni'
import { Users, CheckCircle, ClipboardList, TrendingUp, Target, UserPlus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'

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

function MiniStat({ label, value, subtitle, color }: { label: string; value: string | number; subtitle: string; color: 'emerald' | 'amber' | 'purple' | 'blue' }) {
  const dotColor = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    purple: 'bg-amikom-purple',
    blue: 'bg-blue-500',
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${dotColor[color]}`} />
        <div>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">{label}</p>
          <p className="mt-0.5 text-xl font-semibold tracking-[-0.02em] text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

export default async function AdminDashboardPage() {
  const [stats, tracerStats, matchingStats, recent] = await Promise.all([
    getAlumniStats(),
    getSistemAlumniStats().catch(() => null),
    getMatchingStats().catch(() => null),
    getUsersPaginated(1, 5).catch(() => null),
  ])

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
        <StatCard label="Super Users" value={stats.totalSuperUsers} icon={CheckCircle} color="slate" sub="Admin & operator" />
        <StatCard label="Kuesioner Terisi" value={stats.SistemAlumniFilled} icon={ClipboardList} color="emerald" sub={`${needFilling} alumni belum mengisi`} />
        <StatCard label="Response Rate" value={`${responseRate}%`} icon={TrendingUp} color={rateColor} sub={`${stats.SistemAlumniFilled}/${stats.totalAlumni} responden`} />
      </div>

      {/* ─── Row 2: Response Rate Progress ─── */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500">Progress Pengisian Kuesioner</p>
            <span className="text-xs text-slate-500">{stats.SistemAlumniFilled} dari {stats.totalAlumni} alumni</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(responseRate, 100)}%`,
                backgroundColor: responseRate >= 50 ? '#22c55e' : responseRate >= 25 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] text-slate-500">0</span>
            <span className="text-[11px] text-slate-500">100%</span>
          </div>
        </div>
      </div>

      {/* ─── Row 3: Sistem Alumni Health + Profile Quality ─── */}
      <div className="grid gap-4 sm:grid-cols-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {tracerStats ? (
          <>
            <MiniStat
              label="Employment Rate"
              value={`${tracerStats.employmentRate}%`}
              subtitle={`${tracerStats.totalResponses} responden`}
              color={tracerStats.employmentRate >= 60 ? 'emerald' : 'amber'}
            />
            <MiniStat
              label="Field Match Rate"
              value={`${tracerStats.fieldMatchRate}%`}
              subtitle="Kesesuaian bidang studi"
              color={tracerStats.fieldMatchRate >= 60 ? 'emerald' : 'amber'}
            />
            <MiniStat
              label="Melanjutkan Studi"
              value={`${tracerStats.studyingRate}%`}
              subtitle="Alumni lanjut S2/S3"
              color="blue"
            />
          </>
        ) : (
          <div className="col-span-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm text-center">
            <p className="text-sm text-slate-500">Data sistem alumni belum tersedia.</p>
          </div>
        )}
      </div>

      {/* ─── Row 4: Profile Quality + Recent Registrations ─── */}
      <div className="grid gap-4 lg:grid-cols-2 animate-fade-in-up" style={{ animationDelay: '0.12s' }}>
        {/* Profile Quality */}
        {matchingStats && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-slate-500">Kualitas Profil Alumni</p>
                <p className="text-sm text-slate-600 mt-0.5">Kelengkapan data untuk smart matching</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amikom-purple/10 text-amikom-purple border border-amikom-purple/20">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Program Studi', filled: matchingStats.withProgramStudi, total: matchingStats.totalAlumni },
                { label: 'Skills', filled: matchingStats.withSkills, total: matchingStats.totalAlumni },
                { label: 'Pengalaman Kerja', filled: matchingStats.withTrackRecords, total: matchingStats.totalAlumni },
                { label: 'Sertifikasi', filled: matchingStats.withCertifications, total: matchingStats.totalAlumni },
                { label: 'Bidang Pekerjaan', filled: matchingStats.withJobInterests, total: matchingStats.totalAlumni },
                { label: 'Preferensi Lokasi', filled: matchingStats.withPreferredLocation, total: matchingStats.totalAlumni },
                { label: 'Tipe Pekerjaan', filled: matchingStats.withPreferredType, total: matchingStats.totalAlumni },
                { label: 'Profil Lengkap', filled: matchingStats.completeProfile, total: matchingStats.totalAlumni },
              ].map((item) => {
                const pct = item.total > 0 ? Math.round((item.filled / item.total) * 100) : 0
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">{item.label}</span>
                      <span className="text-[11px] font-mono text-slate-500">{item.filled}/{item.total} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: pct >= 60 ? '#22c55e' : pct >= 30 ? '#f59e0b' : '#ef4444' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent Registrations */}
        {recent && recent.users.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-slate-500">Alumni Terbaru</p>
                <p className="text-sm text-slate-600 mt-0.5">5 pendaftar terakhir</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                <UserPlus className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-0 divide-y divide-slate-100">
              {recent.users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{user.full_name || user.email}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-[11px] font-mono text-slate-500">
                      {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </p>
                    {user.nim && <p className="text-[11px] font-mono text-slate-400">{user.nim}</p>}
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/admin/alumni"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-amikom-purple hover:text-amikom-purple-hover transition-colors"
            >
              Lihat semua alumni
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>

      {/* ─── Row 5: Quick Links ─── */}
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
