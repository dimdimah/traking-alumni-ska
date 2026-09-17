'use client'

import { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react'
import { useRouter } from 'next/navigation'
import {
  submitSistemAlumni,
  submitTracerStudyAnswers,
  saveTracerStudyHistory,
  getTracerStudyHistory,
  getTracerStudyInitialData,
} from '@/lib/actions/tracer-study'
import type { SistemAlumniQuestion, SistemAlumniResponse, TracerStudyHistory } from '@/types/database'
import { PageHeader } from '@/components/ui/page-header'
import {
  CheckCircle2,
  Pencil,
  GraduationCap,
  History,
  ChevronDown,
  ChevronRight,
  Clock,
  Calendar,
  Briefcase,
  Building2,
  FileCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

import { EDUCATION_LEVELS } from '@/lib/constants'

const SECTION_LABELS: Record<string, string> = {
  identitas: '1. Identitas Responden',
  wajib: '2. Kuesioner Wajib',
  opsional: '3. Kuesioner Opsional',
}

function getQuestionSection(question: SistemAlumniQuestion): string {
  if (question.display_order < 100) return 'identitas'
  if (question.display_order <= 599) return 'wajib'
  return 'opsional'
}

// ─── Logika Percabangan (Conditional Logic) ───
// Pertanyaan wajib (Bagian 1 & 2) wajib diisi; opsional (Bagian 3) tidak wajib.

function isRequiredQuestion(question: SistemAlumniQuestion): boolean {
  return question.display_order < 600
}

function getAnswerAtOrder(
  questions: SistemAlumniQuestion[],
  answers: Record<string, string>,
  displayOrder: number
): string {
  const q = questions.find((qq) => qq.display_order === displayOrder)
  return q ? answers[q.id] || '' : ''
}

function answerHasOption(
  questions: SistemAlumniQuestion[],
  answers: Record<string, string>,
  displayOrder: number,
  option: string
): boolean {
  return getAnswerAtOrder(questions, answers, displayOrder)
    .split(', ')
    .includes(option)
}

function isQuestionVisible(
  question: SistemAlumniQuestion,
  questions: SistemAlumniQuestion[],
  answers: Record<string, string>
): boolean {
  const order = question.display_order
  if (order < 100) return true

  const status = getAnswerAtOrder(questions, answers, 100)
  const employed = status === 'Bekerja (full time/part time)'
  const entrepreneur = status === 'Wiraswasta'
  const studying = status === 'Melanjutkan pendidikan'
  const jobSeeker = status === 'Tidak bekerja tetapi sedang mencari pekerjaan'
  const activeWorker = employed || entrepreneur || jobSeeker

  // Tingkat kompetensi — hanya yang bekerja/wiraswasta
  if (order >= 230 && order <= 299) return employed || entrepreneur
  // Metode pembelajaran — semua responden
  if (order >= 600 && order <= 666) return true

  switch (order) {
    // 2a — dalam berapa bulan dapat pekerjaan (jika Q2 = Ya)
    case 115:
      return getAnswerAtOrder(questions, answers, 110) === 'Ya'
    // 2b — berapa bulan untuk pekerjaan pertama (jika Q2 = Tidak)
    case 116:
      return getAnswerAtOrder(questions, answers, 110) === 'Tidak'
    // Pendapatan, lokasi, tingkat tempat kerja, kesesuaian, pendidikan — Bekerja/Wiraswasta
    case 120:
    case 130:
    case 170:
    case 210:
    case 220:
      return employed || entrepreneur
    // Jenis & nama perusahaan — hanya Bekerja
    case 140:
    case 150:
      return employed
    case 145:
      return getAnswerAtOrder(questions, answers, 140) === 'Lainnya'
    // Posisi wiraswasta — hanya Wiraswasta
    case 160:
      return entrepreneur
    // Studi lanjut — hanya Melanjutkan pendidikan
    case 180:
    case 185:
    case 190:
    case 195:
      return studying
    case 205:
      return answerHasOption(questions, answers, 200, 'Lainnya')
    // Pencarian kerja & statistik lamaran — yang aktif bekerja/mencari kerja
    case 670:
      return activeWorker
    case 675:
      return getAnswerAtOrder(questions, answers, 670).includes('sebelum lulus') ||
        getAnswerAtOrder(questions, answers, 670).includes('sesudah lulus')
    case 680:
      return activeWorker
    case 685:
      return answerHasOption(questions, answers, 680, 'Lainnya')
    case 690:
    case 695:
    case 700:
      return activeWorker
    case 715:
      return answerHasOption(questions, answers, 710, 'Lainnya')
    case 725:
      return getAnswerAtOrder(questions, answers, 720) === 'Lainnya'
    // Alasan bekerja tidak sesuai pendidikan — Bekerja/Wiraswasta
    case 730:
    case 735:
      return employed || entrepreneur
    default:
      return true
  }
}

// ─── Komponen Timeline Riwayat Pembaruan Data ───
function HistoryTimeline({
  history,
  existingResponse,
}: {
  history: TracerStudyHistory[]
  existingResponse: SistemAlumniResponse | null
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Jika history array kosong tapi existingResponse ada, buat fallback visual
  const displayHistory: TracerStudyHistory[] = history.length > 0 ? history : existingResponse ? [
    {
      id: `fallback-${existingResponse.id}`,
      user_id: existingResponse.user_id,
      angkatan: String(existingResponse.graduation_year || ''),
      submitted_at: existingResponse.updated_at || existingResponse.submitted_at || new Date().toISOString(),
      snapshot: {
        core_fields: {
          education_level: existingResponse.education_level || '',
          employment_status: existingResponse.employment_status || '',
          company: existingResponse.company || null,
          position: existingResponse.position || null,
          salary_range: existingResponse.salary_range || null,
          study_field_match: existingResponse.study_field_match || null,
          suggestions: existingResponse.suggestions || null,
        },
        answers: [],
      },
    },
  ] : []

  if (displayHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center">
        <History className="h-9 w-9 text-slate-300 mb-2" />
        <p className="text-sm font-medium text-slate-600">Belum ada riwayat pembaruan</p>
        <p className="mt-1 text-xs text-slate-400 max-w-sm">
          Riwayat update data akan otomatis tersimpan setiap kali Anda memperbarui jawaban kuesioner.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Timeline */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-amikom-purple" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 font-mono">
            Log Aktivitas Pembaruan Data
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-amikom-purple/10 px-2.5 py-0.5 text-xs font-medium text-amikom-purple font-mono">
          {displayHistory.length} Versi Tersimpan
        </span>
      </div>

      <div className="relative space-y-0 pl-2">
        {/* Garis vertikal timeline */}
        <div className="absolute left-[17px] top-4 bottom-4 w-[2px] bg-slate-200" aria-hidden="true" />

        {displayHistory.map((item, index) => {
          const isExpanded = expandedId === item.id
          const isLatest = index === 0
          const date = new Date(item.submitted_at)
          const dateStr = date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
          const timeStr = date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          })

          let label = 'Pembaruan Data'
          if (index === displayHistory.length - 1 && displayHistory.length === 1) {
            label = 'Pengisian Pertama'
          } else if (index === displayHistory.length - 1) {
            label = 'Pengisian Awal'
          } else if (isLatest) {
            label = 'Pembaruan Terkini'
          } else {
            label = `Pembaruan ke-${displayHistory.length - index}`
          }

          return (
            <div key={item.id} className="relative pl-10 pb-6 last:pb-0">
              {/* Timeline Indicator Dot */}
              <span
                className={`absolute left-0 top-1.5 flex h-[32px] w-[32px] items-center justify-center rounded-full border-2 transition-all ${
                  isLatest
                    ? 'border-amikom-purple bg-amikom-purple text-white shadow-sm ring-4 ring-amikom-purple/10'
                    : 'border-slate-300 bg-white text-slate-400'
                }`}
              >
                {isLatest ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                )}
              </span>

              {/* Card Riwayat Item */}
              <div
                className={`rounded-xl border transition-all ${
                  isLatest
                    ? 'border-amikom-purple/30 bg-white shadow-sm'
                    : 'border-slate-200 bg-white/90 hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left transition-colors hover:bg-slate-50/80 rounded-xl"
                  aria-expanded={isExpanded}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider ${
                          isLatest
                            ? 'bg-amikom-purple text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {label}
                      </span>
                      {isLatest && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 font-mono">
                          <CheckCircle2 className="h-3 w-3" />
                          Versi Aktif
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-slate-900 pt-0.5">
                      {dateStr} <span className="text-slate-400 font-normal">pukul</span> {timeStr} WIB
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                        Status: <strong className="text-slate-800 font-medium">{item.snapshot.core_fields.employment_status || '—'}</strong>
                      </span>
                      {item.snapshot.core_fields.company && (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <strong className="text-slate-800 font-medium">{item.snapshot.core_fields.company}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-3">
                    <span className="text-xs text-amikom-purple font-medium hidden sm:inline">
                      {isExpanded ? 'Tutup Detail' : 'Lihat Detail'}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-amikom-purple shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                    )}
                  </div>
                </button>

                {/* Detail Snapshot Jawaban saat Expand */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50/50 space-y-4 rounded-b-xl animate-fade-in-up">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                      Snapshot Data pada Versi Ini
                    </p>

                    {/* Ringkasan Data Pokok */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-white p-4">
                      {Object.entries({
                        'Pendidikan Terakhir': item.snapshot.core_fields.education_level,
                        'Status Pekerjaan': item.snapshot.core_fields.employment_status,
                        'Perusahaan / Instansi': item.snapshot.core_fields.company,
                        'Posisi / Jabatan': item.snapshot.core_fields.position,
                        'Rentang Gaji': item.snapshot.core_fields.salary_range,
                        'Kesesuaian Bidang': item.snapshot.core_fields.study_field_match,
                      }).map(([label, val]) => (
                        <div key={label} className="space-y-0.5">
                          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{label}</p>
                          <p className="text-xs font-semibold text-slate-800">{val || '—'}</p>
                        </div>
                      ))}
                    </div>

                    {/* Jawaban Pertanyaan */}
                    {item.snapshot.answers && item.snapshot.answers.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                          Jawaban Kuesioner ({item.snapshot.answers.length} Pertanyaan)
                        </p>
                        <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg border border-slate-200 bg-white p-3 divide-y divide-slate-100">
                          {item.snapshot.answers.map((a, i) => (
                            <div key={i} className="pt-2 first:pt-0">
                              <p className="text-xs text-slate-600">
                                <span className="font-mono text-slate-400 mr-1.5">{i + 1}.</span>
                                {a.question_text}
                              </p>
                              {a.answer_text ? (
                                <p className="mt-1 text-xs font-semibold text-amikom-purple pl-4">
                                  {a.answer_text}
                                </p>
                              ) : (
                                <p className="mt-1 text-xs text-slate-400 italic pl-4">Tidak diisi</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Kritik & Saran */}
                    {item.snapshot.core_fields.suggestions && (
                      <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                          Kritik & Saran
                        </p>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {item.snapshot.core_fields.suggestions}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function SistemAlumniPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingResponse, setExistingResponse] = useState<SistemAlumniResponse | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [questions, setQuestions] = useState<SistemAlumniQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const deferredAnswers = useDeferredValue(answers)
  const [graduationYear, setGraduationYear] = useState('')
  const [history, setHistory] = useState<TracerStudyHistory[]>([])
  const [activeTab, setActiveTab] = useState<'summary' | 'history'>('summary')

  // Core fields not in 63 questions
  const [educationLevel, setEducationLevel] = useState('')
  const [position, setPosition] = useState('')
  const [suggestions, setSuggestions] = useState('')

  const loadHistory = useCallback(async () => {
    try {
      const h = await getTracerStudyHistory()
      setHistory(h)
    } catch (err) {
      console.error('Gagal mengambil history:', err)
    }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        // Single BE RTT: 1× auth + paralel DB (hemat 4× server-action roundtrip)
        const { existing, graduationYear: gy, questions: qs, answers: existingAnswers, history: h } = await getTracerStudyInitialData()
        if (existing) {
          setExistingResponse(existing)
          setSubmitted(true)
          setGraduationYear(gy)
          setEducationLevel(existing.education_level || '')
          setPosition(existing.position || '')
          setSuggestions(existing.suggestions || '')
        } else {
          setGraduationYear(gy)
        }
        if (qs) setQuestions(qs)
        setAnswers(existingAnswers)
        setHistory(h as TracerStudyHistory[])
      } catch (err) {
        console.error('Gagal load tracer study:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function updateAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  // Map Q1 (status) → employment_status (dukung lama & baru)
  function getEmploymentStatus(): string {
    const b1 = questions.find((q) => q.display_order === 100 || q.display_order === 10)
    if (!b1) return 'Belum Bekerja'
    const answer = answers[b1.id]
    if (answer === 'Bekerja (full time/part time)' || answer === 'Bekerja') return 'Bekerja'
    if (answer === 'Wiraswasta') return 'Wirausaha'
    if (answer === 'Melanjutkan pendidikan' || answer === 'Kuliah') return 'Melanjutkan Studi'
    if (answer === 'Tidak bekerja tetapi sedang mencari pekerjaan') return 'Mencari Kerja'
    if (answer === 'Belum memungkinkan bekerja') return 'Belum Memungkinkan Bekerja'
    return 'Belum Bekerja'
  }

  function getSalaryRange(): string | null {
    const b4 = questions.find((q) => q.display_order === 120 || q.display_order === 40)
    if (!b4) return null
    const val = answers[b4.id]
    if (!val) return null
    const num = parseInt(val, 10)
    if (isNaN(num)) return null
    if (num < 3000000) return '< 3 juta'
    if (num < 5000000) return '3-5 juta'
    if (num < 10000000) return '5-10 juta'
    if (num < 20000000) return '10-20 juta'
    return '> 20 juta'
  }

  function getCompany(): string | null {
    const b8 = questions.find(
      (q) => q.display_order === 150 || q.display_order === 80
    )
    if (!b8) return null
    return answers[b8.id] || null
  }

  function getStudyFieldMatch(): string | null {
    const b9 = questions.find((q) => q.display_order === 210 || q.display_order === 90)
    if (!b9) return null
    return answers[b9.id] || null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      // Validasi pertanyaan wajib yang terlihat
      const missingQuestions = questions.filter(
        (q) =>
          isRequiredQuestion(q) &&
          isQuestionVisible(q, questions, answers) &&
          !(answers[q.id] || '').trim()
      )
      if (missingQuestions.length > 0) {
        toast.error(
          `Masih ada ${missingQuestions.length} pertanyaan wajib yang belum diisi.`
        )
        setSaving(false)
        return
      }

      const questionAnswers = questions.map((q) => ({
        question_id: q.id,
        answer_text: answers[q.id] || '',
      }))

      await submitTracerStudyAnswers(questionAnswers)

      const employmentStatus = getEmploymentStatus()
      const salaryRange = getSalaryRange()
      const company = getCompany()
      const studyFieldMatch = getStudyFieldMatch()

      const fd = new FormData()
      fd.append('graduation_year', graduationYear)
      fd.append('education_level', educationLevel)
      fd.append('employment_status', employmentStatus)
      fd.append('company', company || '')
      fd.append('position', position)
      fd.append('salary_range', salaryRange || '')
      fd.append('study_field_match', studyFieldMatch || '')
      fd.append('suggestions', suggestions)

      await submitSistemAlumni(fd)

      // Simpan snapshot ke riwayat
      const answerSnapshot = questions.map((q) => ({
        question_text: q.question_text,
        question_type: q.question_type,
        answer_text: answers[q.id] || null,
      }))
      await saveTracerStudyHistory(
        graduationYear,
        {
          education_level: educationLevel,
          employment_status: employmentStatus,
          company: company ?? null,
          position: position || null,
          salary_range: salaryRange ?? null,
          study_field_match: studyFieldMatch ?? null,
          suggestions: suggestions || null,
        },
        answerSnapshot
      )

      toast.success(
        existingResponse
          ? 'Data Tracer Study berhasil diperbarui & tercatat di riwayat!'
          : 'Kuesioner berhasil dikirim!'
      )
      setSubmitted(true)
      await loadHistory()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  function handleEdit() {
    setSubmitted(false)
  }

  // Group questions by section — pakai deferredAnswers agar ketik tidak block UI (62 q * percabangan)
  const sections = useMemo(() => questions.reduce<Record<string, SistemAlumniQuestion[]>>((acc, q) => {
    if (!isQuestionVisible(q, questions, deferredAnswers)) return acc
    const section = getQuestionSection(q)
    if (!acc[section]) acc[section] = []
    acc[section].push(q)
    return acc
  }, {}), [questions, deferredAnswers])

  // ─── LOADING ───
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amikom-purple border-t-transparent" />
      </div>
    )
  }

  // ─── NO GRADUATION YEAR — Arahkan lengkapi profile ───
  if (!loading && !graduationYear && !submitted) {
    return (
      <div className="space-y-8">
        <PageHeader
          icon={<span className="text-[11px]">📋</span>}
          label="Tracer Study"
          title="Kuesioner Alumni."
          subtitle="Lengkapi profile terlebih dahulu."
        />
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-6">
          <GraduationCap className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Tahun Lulus Belum Diisi</p>
            <p className="mt-1 text-sm text-amber-700">
              Silakan lengkapi data tahun lulus di halaman profile terlebih dahulu agar kuesioner yang
              sesuai dengan angkatan Anda dapat ditampilkan.
            </p>
            <button
              onClick={() => router.push('/dashboard/profile')}
              className="mt-4 rounded-md bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-amikom-purple-hover active:scale-[0.98]"
            >
              Lengkapi Profile
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── NO QUESTIONS ───
  if (!loading && questions.length === 0 && !submitted) {
    return (
      <div className="space-y-8">
        <PageHeader
          icon={<span className="text-[11px]">📋</span>}
          label="Tracer Study"
          title="Kuesioner Alumni."
          subtitle="Belum ada pertanyaan untuk angkatan Anda."
        />
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-6">
          <GraduationCap className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Pertanyaan Belum Tersedia</p>
            <p className="mt-1 text-sm text-amber-700">
              Admin belum membuat pertanyaan kuesioner untuk tahun lulus{' '}
              <strong>{graduationYear}</strong>. Silakan hubungi admin kampus.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ─── SUBMITTED VIEW ───
  if (submitted && existingResponse) {
    const sectionEntries = Object.entries(sections)
    const lastUpdateDate = existingResponse.updated_at || existingResponse.submitted_at
    const formattedLastUpdate = lastUpdateDate
      ? new Date(lastUpdateDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—'

    const initialSubmitDate = existingResponse.submitted_at
      ? new Date(existingResponse.submitted_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '—'

    return (
      <div className="space-y-8">
        <PageHeader
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          label="Tracer Study"
          title="Data Kuesioner Alumni."
          subtitle="Data Anda telah tersimpan dan tercatat di pangkalan data STMIK AMIKOM Surakarta."
        />

        {/* ─── STATUS & PEMBARUAN SUMMARY BANNER ─── */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/30 p-6 shadow-sm animate-fade-in-up">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Kuesioner Terverifikasi &amp; Aktif</h3>
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    Angkatan {graduationYear}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  Terakhir diperbarui: <strong className="text-slate-900">{formattedLastUpdate} WIB</strong>
                </p>
                <p className="text-xs text-slate-500">
                  Pertama kali diisi: {initialSubmitDate} · {history.length > 0 ? `${history.length} kali pembaruan tercatat` : '1 kali pengisian'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex items-center gap-2 rounded-xl bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm active:scale-[0.98] shadow-sm"
              >
                <Pencil className="h-4 w-4" />
                Perbarui Data Lagi
              </button>
            </div>
          </div>
        </div>

        {/* ─── TAB NAVIGATOR: JAWABAN TERKINI VS RIWAYAT UPDATE ─── */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === 'summary'
                ? 'bg-amikom-purple text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileCheck className="h-4 w-4" />
            Data Jawaban Terkini
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-amikom-purple text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <History className="h-4 w-4" />
            Riwayat Pembaruan Data
            {history.length > 0 && (
              <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[11px] font-bold ${
                activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {history.length}
              </span>
            )}
          </button>
        </div>

        {/* ─── KONTEN TAB 1: DATA JAWABAN TERKINI ─── */}
        {activeTab === 'summary' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Core Fields Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-mono uppercase tracking-wider text-amikom-purple font-semibold mb-4">
                Data Pokok Alumni
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Tahun Lulus</p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5">{graduationYear || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Pendidikan Terakhir</p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5">{educationLevel || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Status Pekerjaan</p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5">{existingResponse.employment_status || '—'}</p>
                </div>
                {position && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Posisi / Jabatan</p>
                    <p className="text-sm font-medium text-slate-900 mt-0.5">{position}</p>
                  </div>
                )}
                {existingResponse.company && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Perusahaan / Instansi</p>
                    <p className="text-sm font-medium text-slate-900 mt-0.5">{existingResponse.company}</p>
                  </div>
                )}
                {existingResponse.salary_range && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Rentang Pendapatan</p>
                    <p className="text-sm font-medium text-slate-900 mt-0.5">{existingResponse.salary_range}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Jawaban per Section */}
            {sectionEntries.map(([sectionKey, sectionQuestions]) => (
              <div key={sectionKey} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[11px] font-mono uppercase tracking-wider text-amikom-purple font-semibold mb-4">
                  {SECTION_LABELS[sectionKey] || sectionKey}
                </p>
                <div className="space-y-3">
                  {sectionQuestions.map((q, i) => {
                    const answer = answers[q.id]
                    return (
                      <div key={q.id} className="flex items-start gap-3">
                        <span className="text-xs text-slate-400 mt-0.5 min-w-[24px] font-mono">{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm text-slate-800">{q.question_text}</p>
                          {answer ? (
                            <p className="mt-1 text-sm font-medium text-amikom-purple">{answer}</p>
                          ) : (
                            <p className="mt-1 text-xs text-slate-400 italic">Tidak diisi</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {suggestions && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  Kritik &amp; Saran
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">{suggestions}</p>
              </div>
            )}
          </div>
        )}

        {/* ─── KONTEN TAB 2: RIWAYAT PEMBARUAN DATA ─── */}
        {activeTab === 'history' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm animate-fade-in-up">
            <HistoryTimeline history={history} existingResponse={existingResponse} />
          </div>
        )}

        {/* Action Button Footer */}
        <div className="flex items-center gap-3 animate-fade-in-up">
          <button
            type="button"
            onClick={handleEdit}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-all hover:border-amikom-purple/40 hover:text-amikom-purple"
          >
            <Pencil className="h-4 w-4" />
            Perbarui Jawaban
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ─── FORM VIEW (MODE INPUT / EDIT) ───
  const sectionEntries = Object.entries(sections)

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<span className="text-[11px]">📋</span>}
        label="Tracer Study"
        title="Kuesioner Alumni."
        subtitle={
          existingResponse
            ? 'Anda sedang memperbarui data Tracer Study Anda. Pembaruan akan otomatis tercatat ke riwayat.'
            : 'Bantu kami melacak jejak karir alumni STMIK Amikom Surakarta.'
        }
      />

      {existingResponse && (
        <div className="flex items-center gap-3 rounded-xl border border-amikom-purple/30 bg-amikom-purple/5 p-4 text-sm text-amikom-purple animate-fade-in-up">
          <Sparkles className="h-5 w-5 shrink-0" />
          <p>
            <strong>Mode Pembaruan:</strong> Silakan ubah data atau jawaban kuesioner Anda di bawah ini. Setelah dikirim, histori perubahan Anda akan tercatat di tab <strong>Riwayat Pembaruan Data</strong>.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Fields */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm animate-fade-in-up">
          <p className="text-[11px] font-mono uppercase tracking-wider text-amikom-purple font-semibold mb-4">
            Data Pokok
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">
                Tahun Lulus
              </label>
              <input
                type="number"
                value={graduationYear}
                readOnly
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500 outline-none cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">
                Pendidikan Terakhir
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20"
              >
                <option value="">Pilih pendidikan terakhir</option>
                {EDUCATION_LEVELS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">
                Posisi / Jabatan (jika sudah bekerja)
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Posisi atau jabatan saat ini"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Questions by Section */}
        {sectionEntries.map(([sectionKey, sectionQuestions]) => (
          <div
            key={sectionKey}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm animate-fade-in-up"
          >
            <p className="text-[11px] font-mono uppercase tracking-wider text-amikom-purple font-semibold mb-4">
              {SECTION_LABELS[sectionKey] || sectionKey}
            </p>
            <div className="space-y-5">
              {sectionQuestions.map((q, i) => (
                <div key={q.id} className="space-y-2">
                  <label className="block text-xs font-medium text-slate-600">
                    <span className="text-slate-400 font-mono mr-2">{i + 1}.</span>
                    {q.question_text}
                    {isRequiredQuestion(q) ? (
                      <span className="ml-2 inline-flex items-center rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] font-mono font-semibold text-red-500">Wajib</span>
                    ) : (
                      <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-400">Opsional</span>
                    )}
                  </label>

                  {q.question_type === 'text' && (
                    <input
                      type="text"
                      value={answers[q.id] || ''}
                      onChange={(e) => updateAnswer(q.id, e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20"
                    />
                  )}

                  {q.question_type === 'number' && (
                    <input
                      type="number"
                      value={answers[q.id] || ''}
                      onChange={(e) => updateAnswer(q.id, e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20"
                    />
                  )}

                  {q.question_type === 'textarea' && (
                    <textarea
                      value={answers[q.id] || ''}
                      onChange={(e) => updateAnswer(q.id, e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20 resize-none"
                    />
                  )}

                  {q.question_type === 'select' && q.options && (
                    <select
                      value={answers[q.id] || ''}
                      onChange={(e) => updateAnswer(q.id, e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20"
                    >
                      <option value="">Pilih jawaban...</option>
                      {q.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {q.question_type === 'radio' && q.options && (
                    <div className="space-y-2">
                      {q.options.map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 cursor-pointer transition-all hover:border-amikom-purple/30 has-[:checked]:border-amikom-purple has-[:checked]:bg-amikom-purple/5"
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={(e) => updateAnswer(q.id, e.target.value)}
                            className="h-4 w-4 text-amikom-purple border-slate-300 focus:ring-amikom-purple/20"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}

                  {q.question_type === 'checkbox' && q.options && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-400">Jawaban dapat lebih dari satu.</p>
                      {q.options.map((opt) => {
                        const selected = (answers[q.id] || '').split(', ').filter(Boolean)
                        const checked = selected.includes(opt)
                        return (
                          <label
                            key={opt}
                            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 cursor-pointer transition-all hover:border-amikom-purple/30 has-[:checked]:border-amikom-purple has-[:checked]:bg-amikom-purple/5"
                          >
                            <input
                              type="checkbox"
                              value={opt}
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...selected, opt]
                                  : selected.filter((o) => o !== opt)
                                updateAnswer(q.id, next.join(', '))
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-amikom-purple focus:ring-amikom-purple/20"
                            />
                            {opt}
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {q.question_type === 'scale' && q.options && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt, optIdx) => {
                          const selected = answers[q.id] === opt.trim()
                          const [, labelText] = opt.split('=')
                          return (
                            <button
                              key={opt}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => updateAnswer(q.id, selected ? '' : opt.trim())}
                              className={`flex min-w-[54px] flex-col items-center rounded-lg border px-3 py-2.5 text-center transition-all active:scale-[0.98] ${
                                selected
                                  ? 'border-amikom-purple bg-amikom-purple text-white shadow-sm'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-amikom-purple/40 hover:bg-amikom-purple/5'
                              }`}
                            >
                              <span className="text-base font-semibold leading-none">{optIdx + 1}</span>
                              <span className={`mt-1 text-[10px] leading-tight ${selected ? 'text-white/80' : 'text-slate-400'}`}>
                                {labelText ? labelText.trim() : ''}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Suggestions */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm animate-fade-in-up">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-4">
            Kritik &amp; Saran
          </p>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">
              Kritik dan Saran untuk Almamater
            </label>
            <textarea
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              rows={4}
              placeholder="Tulis kritik dan saran Anda untuk pengembangan STMIK Amikom Surakarta..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20 resize-none"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between animate-fade-in-up">
          <button
            type="button"
            onClick={() => {
              if (existingResponse) {
                setSubmitted(true)
              } else {
                router.push('/dashboard')
              }
            }}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-400 hover:text-slate-900"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-amikom-purple px-6 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {saving ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Menyimpan...
              </>
            ) : existingResponse ? (
              'Simpan Pembaruan Data'
            ) : (
              'Kirim Kuesioner'
            )}
          </button>
        </div>

        {/* Pesan Penutup */}
        <div className="flex items-start gap-3 rounded-xl border border-amikom-purple/20 bg-amikom-purple/5 p-5 text-sm text-slate-700 animate-fade-in-up">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amikom-purple text-white">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <p className="leading-relaxed">
            Terima kasih atas partisipasi Anda dalam pengisian Tracer Study. Data yang diberikan akan
            digunakan untuk evaluasi dan pengembangan layanan Alumni serta peningkatan kualitas pendidikan.
          </p>
        </div>
      </form>
    </div>
  )
}
