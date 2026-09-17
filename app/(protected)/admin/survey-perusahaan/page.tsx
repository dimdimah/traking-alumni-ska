'use client'

import { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react'
import { getCompanySurveys } from '@/lib/actions/survey-perusahaan'
import { exportCompanySurveysToExcel } from '@/lib/actions/export'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { Building2, Download, Search, RefreshCw } from 'lucide-react'
import type { CompanySurvey } from '@/types/database'

const RATING_LABEL: Record<string, { label: string; color: string }> = {
  sangat_baik: { label: 'Sangat Baik', color: 'bg-emerald-100 text-emerald-700' },
  baik:        { label: 'Baik',        color: 'bg-blue-100 text-blue-700' },
  cukup:       { label: 'Cukup',       color: 'bg-amber-100 text-amber-700' },
  kurang:      { label: 'Kurang',      color: 'bg-red-100 text-red-700' },
}

const COMPETENCY_KEYS: { key: keyof CompanySurvey; label: string }[] = [
  { key: 'teamwork',         label: 'Teamwork' },
  { key: 'it_skill',         label: 'IT Skill' },
  { key: 'english',          label: 'Bahasa Inggris' },
  { key: 'communication',    label: 'Komunikasi' },
  { key: 'self_development', label: 'Pengembangan Diri' },
  { key: 'leadership',       label: 'Kepemimpinan' },
  { key: 'work_ethic',       label: 'Etika Kerja' },
]

function RatingBadge({ value }: { value: string }) {
  const r = RATING_LABEL[value] ?? { label: value, color: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.color}`}>
      {r.label}
    </span>
  )
}

export default function AdminSurveyPerusahaanPage() {
  const [surveys, setSurveys] = useState<CompanySurvey[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [isExporting, setIsExporting] = useState(false)
  const [selected, setSelected] = useState<CompanySurvey | null>(null)

  const loadSurveys = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getCompanySurveys()
      setSurveys(data)
    } catch (e) {
      toast.error('Gagal memuat data survey perusahaan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadSurveys() }, [loadSurveys])

  // Memoize agar ketik tidak block tabel (pengganti filtered state + effect)
  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase()
    if (!q) return surveys
    return surveys.filter(s =>
      s.company_name.toLowerCase().includes(q) ||
      s.alumni_name.toLowerCase().includes(q) ||
      s.pic_name.toLowerCase().includes(q) ||
      s.alumni_major.toLowerCase().includes(q)
    )
  }, [deferredSearch, surveys])

  async function handleExport() {
    setIsExporting(true)
    try {
      const base64 = await exportCompanySurveysToExcel()
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `survey-perusahaan-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('File Excel berhasil diunduh!')
    } catch (e) {
      toast.error('Gagal mengunduh data')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Building2 className="h-4 w-4" />}
        label="Admin Panel"
        title="Survey Perusahaan."
        subtitle={`${surveys.length} data penilaian alumni dari perusahaan/instansi.`}
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama perusahaan, alumni, atau program studi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-900 outline-none focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/10"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSurveys}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || surveys.length === 0}
            className="flex items-center gap-2 rounded-lg bg-amikom-purple px-4 py-2.5 text-sm font-semibold text-white hover:bg-amikom-purple-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Mengunduh...' : 'Unduh Excel'}
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['sangat_baik', 'baik', 'cukup', 'kurang'] as const).map(r => {
          const count = surveys.filter(s => s.teamwork === r).length
          const info = RATING_LABEL[r]
          return (
            <div key={r} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{info.label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{count}</p>
              <p className="text-xs text-slate-400">berdasarkan teamwork</p>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Memuat data...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Building2 className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">{search ? 'Tidak ada hasil pencarian' : 'Belum ada data survey perusahaan'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Perusahaan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">PIC</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Alumni</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Lulus</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Prodi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Teamwork</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">IT Skill</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Komunikasi</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s, i) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{i + 1}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {new Date(s.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{s.company_name}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{s.pic_name}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{s.alumni_name}</td>
                    <td className="px-4 py-3 text-slate-600 text-center">{s.alumni_graduation_year}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">{s.alumni_major}</td>
                    <td className="px-4 py-3"><RatingBadge value={s.teamwork} /></td>
                    <td className="px-4 py-3"><RatingBadge value={s.it_skill} /></td>
                    <td className="px-4 py-3"><RatingBadge value={s.communication} /></td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelected(s)}
                        className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:border-amikom-purple hover:text-amikom-purple transition-colors"
                      >
                        Lihat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selected.company_name}</h3>
                <p className="text-sm text-slate-500">{selected.pic_name} · {selected.email}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="ml-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Alumni Info */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Data Alumni</p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400">Nama</p>
                    <p className="font-semibold text-slate-900">{selected.alumni_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Tahun Lulus</p>
                    <p className="font-semibold text-slate-900">{selected.alumni_graduation_year}</p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-xs text-slate-400">Program Studi</p>
                    <p className="font-semibold text-slate-900">{selected.alumni_major}</p>
                  </div>
                </div>
              </div>

              {/* Competency Ratings */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Penilaian Kompetensi</p>
                <div className="grid gap-2">
                  {COMPETENCY_KEYS.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <span className="text-sm text-slate-600">{label}</span>
                      <RatingBadge value={selected[key] as string} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              {(selected.expectation || selected.suggestion) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Harapan & Saran</p>
                  {selected.expectation && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-400 mb-1">Harapan</p>
                      <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{selected.expectation}</p>
                    </div>
                  )}
                  {selected.suggestion && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Saran</p>
                      <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{selected.suggestion}</p>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-400 text-right">
                Dikirim: {new Date(selected.created_at).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
