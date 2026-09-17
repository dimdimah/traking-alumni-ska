'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useEffect, useRef } from 'react'
import { submitCompanySurvey, type SurveyState } from './actions'
import Image from 'next/image'
import Link from 'next/link'

// ─── Rating Scale Options ─────────────────────────────────────────────────────
const RATING_OPTIONS = [
  { value: 'sangat_baik', label: 'Sangat Baik' },
  { value: 'baik', label: 'Baik' },
  { value: 'cukup', label: 'Cukup' },
  { value: 'kurang', label: 'Kurang' },
]

const COMPETENCY_ITEMS = [
  { name: 'teamwork', label: 'Kemampuan Kerja Tim (Teamwork)' },
  { name: 'it_skill', label: 'Kemampuan Teknologi Informasi (IT Skill)' },
  { name: 'english', label: 'Kemampuan Bahasa Inggris' },
  { name: 'communication', label: 'Kemampuan Komunikasi' },
  { name: 'self_development', label: 'Pengembangan Diri' },
  { name: 'leadership', label: 'Kepemimpinan (Leadership)' },
  { name: 'work_ethic', label: 'Etika & Disiplin Kerja' },
]

const MAJOR_OPTIONS = [
  { value: 'Informatika', label: 'Teknik Informatika (S1)' },
  { value: 'Sistem Informasi', label: 'Sistem Informasi (S1)' },
  { value: 'Manajemen Informatika', label: 'Manajemen Informatika (D3)' },
  { value: 'Komputerisasi Akuntansi', label: 'Komputerisasi Akuntansi (D3)' },
]

// ─── Submit Button ────────────────────────────────────────────────────────────
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 rounded-xl bg-amikom-purple px-8 py-4 text-[16px] font-bold text-white transition-all hover:bg-amikom-purple-hover active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Mengirim...
        </>
      ) : (
        <>
          Kirim Survey
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </>
      )}
    </button>
  )
}

// ─── Rating Group Component ───────────────────────────────────────────────────
function RatingGroup({ name, label }: { name: string; label: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-amikom-hairline last:border-0">
      <div className="sm:w-64 flex-shrink-0">
        <span className="text-[15px] font-medium text-amikom-ink">{label}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {RATING_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="relative flex cursor-pointer items-center gap-2 rounded-lg border border-amikom-hairline bg-amikom-pearl px-4 py-2 text-sm font-medium text-amikom-ink transition-all has-[:checked]:border-amikom-purple has-[:checked]:bg-amikom-purple/5 has-[:checked]:text-amikom-purple hover:border-amikom-purple/40"
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              className="sr-only"
              required
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const initialState: SurveyState = { success: false, error: null }

export default function SurveyPerusahaanPage() {
  const [state, formAction] = useFormState(submitCompanySurvey, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
      successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [state.success])

  return (
    <div className="min-h-screen bg-amikom-pearl">
      {/* Header */}
      <div className="bg-white border-b border-amikom-hairline">
        <div className="mx-auto max-w-4xl px-6 py-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-amikom-ink-muted-48 hover:text-amikom-purple transition-colors mb-6">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Kembali ke Beranda
          </Link>
          <div className="flex items-start gap-4">
            <Image
              src="/logo-amikom-surakarta-1.png"
              alt="Logo STMIK AMIKOM Surakarta"
              width={52}
              height={52}
              className="h-13 w-auto flex-shrink-0"
            />
            <div>
              <h1 className="text-[24px] md:text-[28px] font-bold leading-tight text-amikom-ink">
                Survey Penilaian Alumni oleh Perusahaan
              </h1>
              <p className="mt-1.5 text-[15px] leading-[1.6] text-amikom-ink-muted-48">
                STMIK AMIKOM Surakarta — Program Tracer Study &amp; Evaluasi Kompetensi Alumni
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8 space-y-8">

        {/* Info Banner */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-[14px] text-blue-700 leading-[1.6]">
          <strong className="font-semibold">Informasi:</strong> Survey ini ditujukan bagi perusahaan/instansi yang telah atau sedang mempekerjakan alumni STMIK AMIKOM Surakarta. Data yang diberikan bersifat rahasia dan hanya digunakan untuk keperluan akreditasi dan peningkatan mutu pendidikan.
        </div>

        {/* Success State */}
        {state.success && (
          <div ref={successRef} className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-[16px] font-bold text-emerald-800">Survey berhasil dikirim!</p>
            <p className="mt-1 text-[14px] text-emerald-700">Terima kasih atas partisipasi Anda. Data penilaian telah kami terima dan akan digunakan untuk evaluasi mutu alumni.</p>
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-[14px] text-red-700">
            <strong className="font-semibold">Terjadi kesalahan:</strong> {state.error}
          </div>
        )}

        <form ref={formRef} action={formAction} className="space-y-8">

          {/* ── Seksi A: Data Perusahaan ── */}
          <div className="rounded-2xl border border-amikom-hairline bg-white p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amikom-purple font-bold text-[13px] text-white font-mono">A</div>
              <h2 className="text-[18px] font-bold text-amikom-ink">Data Perusahaan / Instansi</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2 grid gap-1.5">
                <label htmlFor="company_name" className="text-sm font-semibold text-amikom-ink">Nama Perusahaan / Instansi <span className="text-red-500">*</span></label>
                <input id="company_name" name="company_name" type="text" required placeholder="PT. Contoh Indonesia" className="w-full rounded-lg border border-amikom-hairline bg-amikom-pearl px-4 py-2.5 text-[15px] text-amikom-ink outline-none focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/10 transition-all" />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="pic_name" className="text-sm font-semibold text-amikom-ink">Nama PIC / Narahubung <span className="text-red-500">*</span></label>
                <input id="pic_name" name="pic_name" type="text" required placeholder="Nama lengkap" className="w-full rounded-lg border border-amikom-hairline bg-amikom-pearl px-4 py-2.5 text-[15px] text-amikom-ink outline-none focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/10 transition-all" />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="position" className="text-sm font-semibold text-amikom-ink">Jabatan PIC <span className="text-red-500">*</span></label>
                <input id="position" name="position" type="text" required placeholder="HRD Manager" className="w-full rounded-lg border border-amikom-hairline bg-amikom-pearl px-4 py-2.5 text-[15px] text-amikom-ink outline-none focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/10 transition-all" />
              </div>
              <div className="sm:col-span-2 grid gap-1.5">
                <label htmlFor="email" className="text-sm font-semibold text-amikom-ink">Email PIC <span className="text-red-500">*</span></label>
                <input id="email" name="email" type="email" required placeholder="pic@perusahaan.com" className="w-full rounded-lg border border-amikom-hairline bg-amikom-pearl px-4 py-2.5 text-[15px] text-amikom-ink outline-none focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/10 transition-all" />
              </div>
            </div>
          </div>

          {/* ── Seksi B: Data Alumni ── */}
          <div className="rounded-2xl border border-amikom-hairline bg-white p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amikom-purple font-bold text-[13px] text-white font-mono">B</div>
              <h2 className="text-[18px] font-bold text-amikom-ink">Data Alumni yang Dinilai</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2 grid gap-1.5">
                <label htmlFor="alumni_name" className="text-sm font-semibold text-amikom-ink">Nama Lengkap Alumni <span className="text-red-500">*</span></label>
                <input id="alumni_name" name="alumni_name" type="text" required placeholder="Nama sesuai ijazah" className="w-full rounded-lg border border-amikom-hairline bg-amikom-pearl px-4 py-2.5 text-[15px] text-amikom-ink outline-none focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/10 transition-all" />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="alumni_graduation_year" className="text-sm font-semibold text-amikom-ink">Tahun Lulus <span className="text-red-500">*</span></label>
                <input id="alumni_graduation_year" name="alumni_graduation_year" type="number" required placeholder="Contoh: 2023" min={2000} max={new Date().getFullYear()} className="w-full rounded-lg border border-amikom-hairline bg-amikom-pearl px-4 py-2.5 text-[15px] text-amikom-ink outline-none focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/10 transition-all" />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="alumni_major" className="text-sm font-semibold text-amikom-ink">Program Studi <span className="text-red-500">*</span></label>
                <select id="alumni_major" name="alumni_major" required className="w-full rounded-lg border border-amikom-hairline bg-amikom-pearl px-4 py-2.5 text-[15px] text-amikom-ink outline-none focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/10 transition-all">
                  <option value="">-- Pilih Program Studi --</option>
                  {MAJOR_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Seksi C: Penilaian Kompetensi ── */}
          <div className="rounded-2xl border border-amikom-hairline bg-white p-6 md:p-8">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amikom-purple font-bold text-[13px] text-white font-mono">C</div>
              <h2 className="text-[18px] font-bold text-amikom-ink">Penilaian Kompetensi</h2>
            </div>
            <p className="mb-6 text-[14px] text-amikom-ink-muted-48 pl-11">Berikan penilaian untuk setiap aspek kompetensi alumni berdasarkan pengamatan Anda selama bekerja di perusahaan.</p>
            <div className="divide-y divide-amikom-hairline">
              {COMPETENCY_ITEMS.map((item) => (
                <RatingGroup key={item.name} name={item.name} label={item.label} />
              ))}
            </div>
          </div>

          {/* ── Seksi D: Saran & Harapan ── */}
          <div className="rounded-2xl border border-amikom-hairline bg-white p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amikom-purple font-bold text-[13px] text-white font-mono">D</div>
              <h2 className="text-[18px] font-bold text-amikom-ink">Harapan &amp; Saran</h2>
            </div>
            <div className="grid gap-5">
              <div className="grid gap-1.5">
                <label htmlFor="expectation" className="text-sm font-semibold text-amikom-ink">Harapan terhadap Kompetensi Alumni</label>
                <textarea id="expectation" name="expectation" rows={3} placeholder="Kompetensi apa yang Anda harapkan lebih dikuasai alumni dari kampus..." className="w-full rounded-lg border border-amikom-hairline bg-amikom-pearl px-4 py-2.5 text-[15px] text-amikom-ink outline-none focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/10 transition-all resize-none" />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="suggestion" className="text-sm font-semibold text-amikom-ink">Saran untuk Kampus</label>
                <textarea id="suggestion" name="suggestion" rows={3} placeholder="Saran Anda untuk meningkatkan kualitas lulusan STMIK AMIKOM Surakarta..." className="w-full rounded-lg border border-amikom-hairline bg-amikom-pearl px-4 py-2.5 text-[15px] text-amikom-ink outline-none focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/10 transition-all resize-none" />
              </div>
            </div>
          </div>

          {/* Submit */}
          <SubmitButton />
        </form>
      </div>
    </div>
  )
}
