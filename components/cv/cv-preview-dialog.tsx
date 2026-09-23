'use client'

import { useState, useCallback, useEffect } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { getCvData } from '@/lib/actions/cv'
import type { CvData } from '@/lib/actions/cv'
import { parseCertifications } from '@/lib/utils/certifications'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CVPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type DownloadLang = 'id' | 'en'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPeriod(startDate: string, endDate: string | null): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
  return `${fmt(startDate)} – ${endDate ? fmt(endDate) : 'Sekarang'}`
}

function formatPeriodLong(startDate: string, endDate: string | null): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  return `${fmt(startDate)} – ${endDate ? fmt(endDate) : 'Sekarang'}`
}

function splitBullets(text: string): string[] {
  return text
    .split(/\n|•|-/)
    .map((s) => s.trim())
    .filter(Boolean)
}

// --- Program studi config (mirrors cv-template) ---
const PRODI_CONFIG: Record<string, { degree: string; field: string; focus: string }> = {
  'D3 Komputerisasi Akuntansi': {
    degree: 'D3',
    field: 'Komputerisasi Akuntansi',
    focus:
      'Fokus pada integrasi teknologi informasi dengan akuntansi, pengolahan data keuangan, dan sistem informasi akuntansi.',
  },
  'D3 Manajemen Informatika': {
    degree: 'D3',
    field: 'Manajemen Informatika',
    focus:
      'Fokus pada pengelolaan sistem informasi, pemrograman aplikasi, dan administrasi basis data.',
  },
  'S1 Informatika': {
    degree: 'S1',
    field: 'Informatika',
    focus:
      'Fokus pada pengembangan aplikasi web, basis data, dan rekayasa perangkat lunak dengan keterampuan dalam pemrograman, analisis sistem, desain sistem, inovasi teknologi, serta pemecahan masalah teknis.',
  },
  'S1 Teknologi Informasi': {
    degree: 'S1',
    field: 'Teknologi Informasi',
    focus:
      'Fokus pada infrastruktur TI, manajemen jaringan, keamanan siber, dan solusi teknologi untuk mendukung operasional organisasi.',
  },
}

function getProdiLabels(programStudi: string | null): { degree: string; field: string; focus: string } {
  const key = (programStudi ?? '').trim()
  const config = PRODI_CONFIG[key] ?? PRODI_CONFIG['S1 Informatika'] ?? { degree: 'S1', field: 'Informatika', focus: '' }
  return config
}

// ─── CV Preview (HTML render, mirrors the PDF layout) ────────────────────────

function CvHtmlPreview({ data }: { data: CvData }) {
  const { profile, trackRecords, SistemAlumni } = data
  const skills: string[] = Array.isArray(profile.skills) ? (profile.skills as string[]) : []
  const certificationLines: string[] = parseCertifications(profile.certifications)
    .map(c => [c.name, c.issuer, c.year].filter(Boolean).join(' — '))
  const jobInterests: string[] = Array.isArray(profile.job_interests) ? profile.job_interests : []
  const prodi = getProdiLabels(profile.program_studi ?? profile.education_level)

  return (
    <div className="font-sans text-[#1a1a1a] text-sm leading-relaxed">
      {/* ── Header ── */}
      <div className="pb-4 mb-5">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1">
          {profile.full_name ?? 'Alumni'}
        </h1>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#444]">
          {profile.email && <span>{profile.email}</span>}
          {profile.phone && (
            <>
              <span className="text-[#bbb]">•</span>
              <span>{profile.phone}</span>
            </>
          )}
          {profile.location && (
            <>
              <span className="text-[#bbb]">•</span>
              <span>{profile.location}</span>
            </>
          )}
        </div>
      </div>

      {/* ── Professional Summary ── */}
      {profile.bio && (
        <div className="mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#700070] border-b border-[#ccc] pb-1 mb-3">
            Ringkasan Profesional
          </h2>
          <p className="text-[#333] text-[13px] leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* ── Experience ── */}
      {trackRecords.length > 0 && (
        <div className="mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#700070] border-b border-[#ccc] pb-1 mb-3">
            Pengalaman Organisasi dan Proyek
          </h2>
          <div className="space-y-5">
            {trackRecords.map((rec) => (
              <div key={rec.id}>
                <p className="font-semibold text-[13px] text-[#1a1a1a]">
                  {rec.position}, {rec.company}
                </p>
                <p className="text-[11px] text-[#666] mt-0.5 mb-2">
                  {formatPeriodLong(rec.start_date, rec.end_date)}
                </p>
                {rec.description && (
                  <ul className="list-disc pl-4 space-y-1">
                    {splitBullets(rec.description).map((bullet, i) => (
                      <li key={i} className="text-[12px] text-[#555] leading-relaxed">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

{/* ── Education ── */}
        <div className="mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#700070] border-b border-[#ccc] pb-1 mb-3">
            Pendidikan
          </h2>
          <div>
            <p className="font-semibold text-[13px] text-[#1a1a1a]">
              {prodi.degree} — {prodi.field}
            </p>
            <p className="text-[12px] text-[#444] mt-0.5">STMIK Amikom Surakarta</p>
            {SistemAlumni?.graduation_year && (
              <p className="text-[11px] text-[#666] mt-1">
                Periode Studi: - {SistemAlumni.graduation_year}
              </p>
            )}
            <p className="text-[12px] text-[#555] mt-2 leading-relaxed">
              {prodi.focus}
            </p>
          </div>
        </div>

      {/* ── Skills (plain text, no badges) ── */}
      {skills.length > 0 && (
        <div className="mb-2">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#700070] border-b border-[#ccc] pb-1 mb-3">
            Kemampuan
          </h2>
          <p className="text-[#333] text-[12px] leading-relaxed">
            {skills.join(', ')}
          </p>
        </div>
      )}

      {certificationLines.length > 0 && (
        <div className="mb-2">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#700070] border-b border-[#ccc] pb-1 mb-3">
            Sertifikasi Kompetensi
          </h2>
          <ul className="text-[#333] text-[12px] leading-relaxed space-y-1">
            {certificationLines.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0 text-[#700070]">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {jobInterests.length > 0 && (
        <div className="mb-2">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#700070] border-b border-[#ccc] pb-1 mb-3">
            Bidang Pekerjaan yang Diminati
          </h2>
          <p className="text-[#333] text-[12px] leading-relaxed">
            {jobInterests.join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CVPreviewDialog({ open, onOpenChange }: CVPreviewDialogProps) {
  const [cvData, setCvData] = useState<CvData | null>(null)
  const [loadingData, setLoadingData] = useState(false)
  const [downloading, setDownloading] = useState<DownloadLang | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch data when dialog opens — NOT inside onOpenChange because
  // Radix UI Dialog only fires onOpenChange on user-initiated close,
  // not when the parent sets open={true} externally.
  useEffect(() => {
    if (open && !cvData && !loadingData) {
      setLoadingData(true)
      setError(null)
      getCvData()
        .then((data) => {
          if (!data) {
            setError('Gagal memuat data profil. Silakan coba lagi.')
          } else {
            setCvData(data)
          }
        })
        .catch(() => {
          setError('Terjadi kesalahan saat memuat data.')
        })
        .finally(() => {
          setLoadingData(false)
        })
    }
  }, [open, cvData, loadingData])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen)
    },
    [onOpenChange]
  )

  const handleDownload = useCallback(async (lang: DownloadLang) => {
    setDownloading(lang)
    setError(null)
    try {
      const res = await fetch(`/api/generate-cv?lang=${lang}`, {
        credentials: 'same-origin',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Gagal mengunduh CV')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = res.headers.get('Content-Disposition')
      const match = disposition?.match(/filename="?([^"]+)"?/)
      a.download = match?.[1] ?? `CV_${lang.toUpperCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunduh CV')
    } finally {
      setDownloading(null)
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* ── Dialog Header ── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-amikom-hairline shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amikom-purple/10 border border-amikom-purple/20">
              <FileText className="h-4 w-4 text-[#700070]" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-amikom-ink">
                Preview CV
              </DialogTitle>
              <DialogDescription className="text-xs text-amikom-ink-muted-48 mt-0.5">
                Format ATS-friendly — mudah dibaca sistem screening HRD
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Content Area ── */}
        <div className="flex-1 overflow-y-auto">
          {loadingData ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#700070]" />
              <span className="ml-3 text-sm text-amikom-ink-muted-48">Memuat data profil...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center max-w-sm">
                {error}
              </div>
            </div>
          ) : cvData ? (
            <div className="p-6 bg-white">
              {/* A4-like paper preview */}
              <div className="mx-auto bg-white border border-[#e0e0e0] shadow-sm rounded-sm p-8 max-w-[560px]">
                <CvHtmlPreview data={cvData} />
              </div>
            </div>
          ) : null}
        </div>

        {/* ── Footer — Download Buttons ── */}
        {cvData && !loadingData && (
          <div className="shrink-0 border-t border-amikom-hairline bg-amikom-canvas px-6 py-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <p className="text-[11px] font-mono uppercase tracking-wider text-amikom-ink-muted-48 hidden sm:block">
                Unduh CV
              </p>
              <div className="flex gap-3 sm:ml-auto">
                {/* Bahasa Indonesia */}
                <button
                  onClick={() => handleDownload('id')}
                  disabled={downloading !== null}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-md border border-amikom-hairline bg-amikom-canvas px-4 py-2.5 text-sm font-medium text-amikom-ink transition-all hover:bg-slate-50 hover:border-[#700070] hover:text-[#700070] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  aria-label="Unduh CV Bahasa Indonesia"
                >
                  {downloading === 'id' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>Bahasa Indonesia</span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">.pdf</span>
                </button>

                {/* English */}
                <button
                  onClick={() => handleDownload('en')}
                  disabled={downloading !== null}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-md bg-[#700070] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#580058] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  aria-label="Download CV in English"
                >
                  {downloading === 'en' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>English</span>
                  <span className="text-[10px] font-mono text-white/60 uppercase">.pdf</span>
                </button>
              </div>
            </div>

            {error && (
              <p className="mt-2 text-xs text-red-600">{error}</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
