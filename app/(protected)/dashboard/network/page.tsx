'use client'

import { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/page-header'
import {
  Users, Search, MapPin, Briefcase, Phone, Mail, GraduationCap,
  X, ExternalLink, Building2, ChevronRight, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { getNetworkAlumni, type AlumniCard } from '@/lib/actions/network'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function getAvatarColor(id: string): string {
  const colors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-indigo-500 to-blue-600',
    'from-fuchsia-500 to-violet-600',
    'from-sky-500 to-indigo-600',
  ]
  const idx = id.charCodeAt(0) % colors.length
  return colors[idx]
}

function getWorkStatus(alumni: AlumniCard): { label: string; color: string } {
  const status = alumni.employment_status
  if (status === 'Bekerja' || status === 'Wiraswasta') {
    return { label: alumni.employment_status!, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  }
  if (status === 'Kuliah') {
    return { label: 'Melanjutkan Studi', color: 'bg-blue-50 text-blue-700 border-blue-200' }
  }
  if (status === 'Belum Bekerja') {
    return { label: 'Mencari Pekerjaan', color: 'bg-amber-50 text-amber-700 border-amber-200' }
  }
  return { label: 'Alumni', color: 'bg-slate-50 text-slate-600 border-slate-200' }
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function AlumniModal({ alumni, onClose }: { alumni: AlumniCard; onClose: () => void }) {
  const workStatus = getWorkStatus(alumni)
  const displayCompany = alumni.current_company ?? alumni.company
  const displayPosition = alumni.current_position ?? alumni.position

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={`Profil ${alumni.full_name ?? 'Alumni'}`}
    >
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl overflow-y-auto max-h-[85vh] animate-fade-in-up">
        {/* Header gradient */}
        <div className={`h-24 shrink-0 bg-gradient-to-br ${getAvatarColor(alumni.id)}`} />

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-4 right-4 rounded-full bg-white/20 p-1.5 text-white backdrop-blur-sm transition-all hover:bg-black/20 hover:text-white z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Avatar */}
        <div className="px-6 pb-6">
          <div className={`-mt-10 mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br ${getAvatarColor(alumni.id)} text-xl font-bold text-white shadow-lg`}>
            {getInitials(alumni.full_name)}
          </div>

          {/* Name + badge */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                {alumni.full_name ?? 'Nama tidak tersedia'}
              </h2>
              {alumni.nim && (
                <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">
                  NIM {alumni.nim}
                </p>
              )}
            </div>
            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-mono font-medium ${workStatus.color}`}>
              {workStatus.label}
            </span>
          </div>

          {/* Bio */}
          {alumni.bio && (
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">{alumni.bio}</p>
          )}

          <div className="mt-5 space-y-3">
            {/* Pekerjaan */}
            {(displayCompany || displayPosition) && (
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <Building2 className="h-4 w-4 mt-0.5 shrink-0 text-amikom-purple" />
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-0.5">Pekerjaan Saat Ini</p>
                  {displayPosition && (
                    <p className="text-sm font-semibold text-slate-900">{displayPosition}</p>
                  )}
                  {displayCompany && (
                    <p className="text-sm text-slate-600">{displayCompany}</p>
                  )}
                </div>
              </div>
            )}

            {/* Pendidikan + Lokasi */}
            <div className="grid grid-cols-2 gap-3">
              {alumni.education_level && (
                <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <GraduationCap className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Pendidikan</p>
                    <p className="text-xs font-medium text-slate-700 mt-0.5">{alumni.education_level}</p>
                  </div>
                </div>
              )}
              {alumni.location && (
                <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Lokasi</p>
                    <p className="text-xs font-medium text-slate-700 mt-0.5">{alumni.location}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Skills */}
            {alumni.skills && alumni.skills.length > 0 && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">Keahlian</p>
                <div className="flex flex-wrap gap-1.5">
                  {alumni.skills.slice(0, 8).map((skill) => (
                    <span key={skill} className="rounded-md bg-amikom-purple/8 border border-amikom-purple/15 px-2.5 py-1 text-[11px] font-medium text-amikom-purple">
                      {skill}
                    </span>
                  ))}
                  {alumni.skills.length > 8 && (
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500">
                      +{alumni.skills.length - 8}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Kontak */}
          <div className="mt-5 space-y-2 border-t border-slate-100 pt-5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-3">Hubungi</p>

            <a
              href={`mailto:${alumni.email}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:border-amikom-purple/30 hover:bg-amikom-purple/5 hover:text-amikom-purple group"
            >
              <Mail className="h-4 w-4 text-slate-400 group-hover:text-amikom-purple transition-colors" />
              <span className="flex-1 truncate">{alumni.email}</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-amikom-purple transition-colors" />
            </a>

            {alumni.phone && (
              <a
                href={`tel:${alumni.phone}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 group"
              >
                <Phone className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                <span className="flex-1">{alumni.phone}</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Alumni Card ──────────────────────────────────────────────────────────────

function AlumniCardItem({ alumni, onClick }: { alumni: AlumniCard; onClick: () => void }) {
  const workStatus = getWorkStatus(alumni)
  const displayCompany = alumni.current_company ?? alumni.company
  const displayPosition = alumni.current_position ?? alumni.position

  return (
    <button
      onClick={onClick}
      className="group w-full rounded-xl border border-slate-200 bg-white p-6 text-left transition-all hover:border-amikom-purple/30 hover:shadow-md active:scale-[0.98]"
      aria-label={`Lihat profil ${alumni.full_name ?? 'Alumni'}`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarColor(alumni.id)} text-sm font-bold text-white`}>
          {getInitials(alumni.full_name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-amikom-purple transition-colors">
                {alumni.full_name ?? 'Nama tidak tersedia'}
              </p>
              {alumni.nim && (
                <p className="text-[10px] font-mono text-slate-400 truncate">NIM {alumni.nim}</p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-amikom-purple" />
          </div>

          {/* Status badge */}
          <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-mono font-medium ${workStatus.color}`}>
            {workStatus.label}
          </span>

          {/* Pekerjaan */}
          {(displayPosition || displayCompany) && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <Briefcase className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {displayPosition && displayCompany
                  ? `${displayPosition} · ${displayCompany}`
                  : displayPosition ?? displayCompany}
              </span>
            </div>
          )}

          {/* Lokasi */}
          {alumni.location && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{alumni.location}</span>
            </div>
          )}

          {/* Skills */}
          {alumni.skills && alumni.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {alumni.skills.slice(0, 3).map((skill) => (
                <span key={skill} className="rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-500">
                  {skill}
                </span>
              ))}
              {alumni.skills.length > 3 && (
                <span className="rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                  +{alumni.skills.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NetworkPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [alumni, setAlumni] = useState<AlumniCard[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const deferredSearch = useDeferredValue(search)
  const [filterStatus, setFilterStatus] = useState<string>(searchParams.get('status') || 'all')
  const [filterYear, setFilterYear] = useState<string>(searchParams.get('year') || 'all')
  const [selected, setSelected] = useState<AlumniCard | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const PER_PAGE = 12
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1)

  const loadAlumni = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const currentId = user?.id ?? null
      setCurrentUserId(currentId)
      const merged = await getNetworkAlumni(currentId)
      setAlumni(merged)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data alumni')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAlumni() }, [loadAlumni])

  // Filter + search — memoize agar tidak recompute tiap render, pakai deferredSearch biar ketik tidak block UI
  const filtered = useMemo(() => {
    let result = alumni
    if (filterStatus !== 'all') {
      result = result.filter((a) => {
        if (filterStatus === 'bekerja') return a.employment_status === 'Bekerja' || a.employment_status === 'Wiraswasta'
        if (filterStatus === 'kuliah') return a.employment_status === 'Kuliah'
        if (filterStatus === 'belum') return a.employment_status === 'Belum Bekerja'
        return true
      })
    }
    if (filterYear !== 'all') {
      result = result.filter((a) => String(a.graduation_year) === filterYear)
    }
    if (deferredSearch.trim()) {
      const q = deferredSearch.toLowerCase()
      result = result.filter((a) =>
        (a.full_name?.toLowerCase().includes(q)) ||
        (a.nim?.toLowerCase().includes(q)) ||
        (a.location?.toLowerCase().includes(q)) ||
        (a.company?.toLowerCase().includes(q)) ||
        (a.current_company?.toLowerCase().includes(q)) ||
        (a.position?.toLowerCase().includes(q)) ||
        (a.skills?.some((s) => s.toLowerCase().includes(q)))
      )
    }
    return result
  }, [alumni, filterStatus, filterYear, deferredSearch])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paged = useMemo(() => {
    const start = (Math.min(page, totalPages) - 1) * PER_PAGE
    return filtered.slice(start, start + PER_PAGE)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, page, totalPages])

  // Jika filter menyusutkan hasil hingga page out-of-range, kembalikan ke halaman terakhir valid
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  // Sync filter + page ke URL — debounce 300ms agar router.replace tidak dipanggil tiap keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterYear !== 'all') params.set('year', filterYear)
      if (page > 1) params.set('page', String(page))
      const qs = params.toString()
      router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false })
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterStatus, filterYear, page])

  // Unique tahun — memoize agar tidak recompute tiap filter
  const availableYears = useMemo(() => Array.from(
    new Set(alumni.map((a) => a.graduation_year).filter((y): y is number => y !== null))
  ).sort((a, b) => b - a), [alumni])

  const statusFilters = [
    { value: 'all', label: 'Semua' },
    { value: 'bekerja', label: 'Bekerja' },
    { value: 'kuliah', label: 'Melanjutkan Studi' },
    { value: 'belum', label: 'Mencari Kerja' },
  ]

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        icon={<span className="text-[11px]">◇</span>}
        label="Jaringan Alumni"
        title="Koneksi Alumni."
        subtitle={`Temukan dan hubungi ${alumni.length} alumni UNIKOM STMIK AMIKOM Surakarta.`}
      />

      {/* Search + Filter */}
      <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        {/* Row 1: Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Cari nama, NIM, keahlian, atau perusahaan..."
            aria-label="Cari alumni"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20"
          />
        </div>

        {/* Row 2: Dropdown Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-48">
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
              aria-label="Filter status pekerjaan"
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20 bg-no-repeat bg-[position:right_0.5rem_center] bg-[length:1.25em_1.25em] bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')]"
            >
              {statusFilters.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label === 'Semua' ? 'Semua Status' : f.label}
                </option>
              ))}
            </select>
          </div>

          {availableYears.length > 0 && (
            <div className="relative w-full sm:w-40">
              <select
                value={filterYear}
                onChange={(e) => { setFilterYear(e.target.value); setPage(1) }}
                aria-label="Filter angkatan"
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20 bg-no-repeat bg-[position:right_0.5rem_center] bg-[length:1.25em_1.25em] bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')]"
              >
                <option value="all">Semua Angkatan</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={String(yr)}>
                    Angkatan {yr}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <div className="flex items-center justify-between animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
          <p className="text-xs text-slate-400 font-mono">
            Menampilkan {paged.length} dari {filtered.length} (total {alumni.length} alumni)
            {totalPages > 1 && (
              <span> · Halaman {Math.min(page, totalPages)} dari {totalPages}</span>
            )}
          </p>
          {(search || filterStatus !== 'all' || filterYear !== 'all') && (
            <button
              onClick={() => { setSearch(''); setFilterStatus('all'); setFilterYear('all'); setPage(1) }}
              className="text-xs text-amikom-purple hover:underline"
            >
              Reset semua filter
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-amikom-purple" />
            <p className="text-sm text-slate-500">Memuat jaringan alumni...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-16 shadow-sm animate-fade-in-up">
          <Users className="h-10 w-10 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            {search || filterStatus !== 'all' || filterYear !== 'all' ? 'Tidak ada alumni yang cocok' : 'Belum ada alumni terdaftar'}
          </p>
          {(search || filterStatus !== 'all' || filterYear !== 'all') && (
            <button
              onClick={() => { setSearch(''); setFilterStatus('all'); setFilterYear('all'); setPage(1) }}
              className="mt-3 text-xs text-amikom-purple hover:underline"
            >
              Reset filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {paged.map((a) => (
            <AlumniCardItem key={a.id} alumni={a} onClick={() => setSelected(a)} />
          ))}
        </div>
      )}

      {/* Pagination — 12 per halaman agar DOM ringan, filter/search tetap global */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4 animate-fade-in-up">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-400"
          >
            ‹ Prev
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number
            if (totalPages <= 5) pageNum = i + 1
            else if (page <= 3) pageNum = i + 1
            else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
            else pageNum = page - 2 + i
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`min-w-[32px] rounded-md px-3 py-1.5 text-xs font-medium font-mono ${pageNum === Math.min(page, totalPages) ? 'bg-amikom-purple text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-400'}`}
              >
                {pageNum}
              </button>
            )
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-400"
          >
            Next ›
          </button>
        </div>
      )}

      {/* Modal */}
      {selected && (
        <AlumniModal alumni={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
