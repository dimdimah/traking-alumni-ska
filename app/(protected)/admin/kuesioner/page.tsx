'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createQuestion, updateQuestion, deleteQuestion, getQuestionsPerAngkatan, getQuestionsByAngkatanPaginated, bulkCreateFromTemplate, getAngkatanResponses, getUserAnswers, deleteQuestionsByAngkatan, getUserTracerHistory, getAngkatanTracerHistory } from '@/lib/actions/questions'
import { TEMPLATE_QUESTION_COUNT } from '@/lib/tracer-study-template'
import { exportQuestionsToExcel, exportResponsesToExcel, exportHistoryToExcel } from '@/lib/actions/export'
import type { SistemAlumniQuestion } from '@/types/database'
import { ClipboardList, ChevronRight, Plus, Download, Eye, Users, CheckCircle2, XCircle, GraduationCap, X, History, ChevronDown, Activity, RefreshCw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription as AlertDesc,
} from '@/components/ui/alert-dialog'

interface QuestionForm {
  question_text: string
  question_type: string
  options: string
  is_active: boolean
  display_order: number
  angkatan: string
}

const emptyForm: QuestionForm = {
  question_text: '',
  question_type: 'text',
  options: '',
  is_active: true,
  display_order: 0,
  angkatan: new Date().getFullYear().toString(),
}

interface AngkatanStat {
  angkatan: string
  count: number
  active: number
}

export default function AdminKuesionerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [angkatanStats, setAngkatanStats] = useState<AngkatanStat[]>([])
  const [selectedAngkatan, setSelectedAngkatan] = useState<string | null>(null)
  const [questions, setQuestions] = useState<SistemAlumniQuestion[]>([])
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [totalQuestionPages, setTotalQuestionPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [questionPage, setQuestionPage] = useState(1)
  const [showAddAngkatan, setShowAddAngkatan] = useState(false)
  const [useTemplate, setUseTemplate] = useState(true)
  const [newAngkatan, setNewAngkatan] = useState(new Date().getFullYear().toString())
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<QuestionForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleteAngkatanConfirm, setDeleteAngkatanConfirm] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'questions' | 'responses' | 'history'>('questions')
  const [responses, setResponses] = useState<any[]>([])
  const [loadingResponses, setLoadingResponses] = useState(false)
  const [selectedUserResponses, setSelectedUserResponses] = useState<any[] | null>(null)
  const [selectedUserName, setSelectedUserName] = useState('')
  const [selectedUserHistory, setSelectedUserHistory] = useState<any[]>([])
  const [userDialogTab, setUserDialogTab] = useState<'answers' | 'history'>('answers')
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)
  const [responseStats, setResponseStats] = useState({ total: 0, employed: 0, studying: 0 })

  // ─── Riwayat & Activity Logs State ───
  const [historyLogs, setHistoryLogs] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<'all' | 'alumni'>('all')
  const [selectedSnapshotDetail, setSelectedSnapshotDetail] = useState<any | null>(null)


  useEffect(() => {
    loadAngkatanList()
  }, [])

  // Reactif ke perubahan search params (breadcrumb klik, back/forward)
  useEffect(() => {
    const urlAngkatan = searchParams.get('angkatan')
    if (urlAngkatan) {
      if (urlAngkatan !== selectedAngkatan) selectAngkatan(urlAngkatan)
    } else {
      if (selectedAngkatan) goBack()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  async function loadAngkatanList() {
    try {
      const stats = await getQuestionsPerAngkatan()
      setAngkatanStats(stats)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  async function selectAngkatan(angkatan: string) {
    setSelectedAngkatan(angkatan)
    router.replace(`/admin/kuesioner?angkatan=${angkatan}`, { scroll: false })
    setQuestionPage(1)
    setLoading(true)
    try {
      const result = await getQuestionsByAngkatanPaginated(angkatan, 1)
      setQuestions(result.questions as SistemAlumniQuestion[])
      setTotalQuestions(result.total)
      setTotalQuestionPages(result.totalPages)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat pertanyaan')
    } finally {
      setLoading(false)
    }
  }

  async function loadQuestionPage(angkatan: string, page: number) {
    setQuestionPage(page)
    setLoading(true)
    try {
      const result = await getQuestionsByAngkatanPaginated(angkatan, page)
      setQuestions(result.questions as SistemAlumniQuestion[])
      setTotalQuestions(result.total)
      setTotalQuestionPages(result.totalPages)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat pertanyaan')
    } finally {
      setLoading(false)
    }
  }

  function goBack() {
    setSelectedAngkatan(null)
    setQuestions([])
    router.replace('/admin/kuesioner', { scroll: false })
  }

  function openAdd() {
    setForm({ ...emptyForm, angkatan: selectedAngkatan || new Date().getFullYear().toString() })
    setEditingId(null)
    setShowFormDialog(true)
  }

  function openEdit(q: SistemAlumniQuestion) {
    setForm({
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options ? q.options.join('\n') : '',
      is_active: q.is_active,
      display_order: q.display_order,
      angkatan: (q as SistemAlumniQuestion & { angkatan?: string }).angkatan || '2024',
    })
    setEditingId(q.id)
    setShowFormDialog(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('question_text', form.question_text)
      fd.append('question_type', form.question_type)
      fd.append('options', form.options)
      fd.append('is_active', form.is_active ? 'true' : 'false')
      fd.append('display_order', form.display_order.toString())
      fd.append('angkatan', form.angkatan)

      if (editingId) {
        await updateQuestion(editingId, fd)
        toast.success('Pertanyaan berhasil diperbarui')
      } else {
        await createQuestion(fd)
        toast.success('Pertanyaan berhasil ditambahkan')
      }

    setShowFormDialog(false)
    if (selectedAngkatan) loadQuestionPage(selectedAngkatan, 1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  function confirmDelete(id: string) {
    setDeleteConfirm(id)
  }

  function handleDeleteAngkatan(angkatan: string) {
    const promise = deleteQuestionsByAngkatan(angkatan)
    toast.promise(promise, {
      loading: 'Menghapus angkatan...',
      success: () => {
        setDeleteAngkatanConfirm(null)
        loadAngkatanList()
        return `Angkatan ${angkatan} berhasil dihapus`
      },
      error: (err) => err instanceof Error ? err.message : 'Gagal menghapus angkatan',
    })
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    const promise = deleteQuestion(deleteConfirm)
    toast.promise(promise, {
      loading: 'Menghapus pertanyaan...',
      success: () => {
        setDeleteConfirm(null)
        if (selectedAngkatan) loadQuestionPage(selectedAngkatan, questionPage)
        return 'Pertanyaan berhasil dihapus'
      },
      error: (err) => err instanceof Error ? err.message : 'Terjadi kesalahan',
    })
  }

  async function toggleActive(q: SistemAlumniQuestion) {
    try {
      const supabase = createClient()
      await supabase
        .from('tracer_study_questions')
        .update({ is_active: !q.is_active } as never)
        .eq('id', q.id)
      if (selectedAngkatan) loadQuestionPage(selectedAngkatan, questionPage)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah status')
    }
  }

  // ═══════════════ VIEW: Angkatan Cards Overview ═══════════════
  if (!selectedAngkatan) {
    return (
      <div className="space-y-8">
        <PageHeader
          icon={<ClipboardList className="h-3.5 w-3.5" />}
          label="Tracer Study"
          title="Kelola Tracer Study."
          subtitle="Pilih angkatan untuk mengelola pertanyaan kuesioner."
        />

        {/* Add Angkatan Button */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <button
            onClick={() => {
              setNewAngkatan(new Date().getFullYear().toString())
              setShowAddAngkatan(true)
            }}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-5 py-3 text-sm font-medium text-slate-500 transition-all hover:border-amikom-purple/40 hover:text-amikom-purple active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Tambah Tahun Lulusan
          </button>
        </div>

        {/* Add Angkatan AlertDialog */}
        <AlertDialog open={showAddAngkatan} onOpenChange={setShowAddAngkatan}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tambah Tahun Lulusan</AlertDialogTitle>
              <AlertDialogDescription>
                Masukkan tahun kelulusan untuk membuat kuesioner baru.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider mb-2">
                  Tahun Lulusan
                </label>
                <input
                  type="number"
                  value={newAngkatan}
                  onChange={(e) => setNewAngkatan(e.target.value)}
                  min={1990}
                  max={2030}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      document.getElementById('confirm-add-angkatan')?.click()
                    }
                  }}
                  placeholder="Contoh: 2024"
                  className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20"
                />
              </div>

              {/* Template Toggle */}
              <label
                htmlFor="use-template-checkbox"
                className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-all ${
                  useTemplate
                    ? 'border-amikom-purple/40 bg-amikom-purple/5'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  id="use-template-checkbox"
                  type="checkbox"
                  checked={useTemplate}
                  onChange={(e) => setUseTemplate(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-amikom-purple focus:ring-amikom-purple/20"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    Muat Template Panduan Resmi Dikti
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {TEMPLATE_QUESTION_COUNT} pertanyaan berdasarkan panduan resmi Tracer Study Dikti Kemdikbud.
                  </p>
                  {useTemplate && angkatanStats.some(s => s.angkatan === newAngkatan) && (
                    <p className="mt-2 text-xs font-medium text-amber-600">
                      ⚠ Angkatan {newAngkatan} sudah memiliki pertanyaan. Pertanyaan lama akan diganti.
                    </p>
                  )}
                </div>
              </label>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                id="confirm-add-angkatan"
                onClick={() => {
                  if (!/^\d{4}$/.test(newAngkatan)) {
                    toast.error('Format tahun harus 4 digit')
                    return
                  }
                  const year = parseInt(newAngkatan, 10)
                  if (year < 1990 || year > 2030) {
                    toast.error('Tahun harus antara 1990 dan 2030')
                    return
                  }

                  if (useTemplate) {
                    // Gunakan template — overwrite jika angkatan sudah ada
                    const alreadyExists = angkatanStats.some(s => s.angkatan === newAngkatan)
                    const promise = bulkCreateFromTemplate(newAngkatan, alreadyExists)
                    toast.promise(promise, {
                      loading: `Memuat ${TEMPLATE_QUESTION_COUNT} pertanyaan template...`,
                      success: () => {
                        setShowAddAngkatan(false)
                        loadAngkatanList()
                        return `Template angkatan ${newAngkatan} berhasil dimuat (${TEMPLATE_QUESTION_COUNT} pertanyaan)`
                      },
                      error: (err) => err instanceof Error ? err.message : 'Gagal memuat template',
                    })
                  } else {
                    // Tanpa template — buat 1 pertanyaan placeholder
                    const fd = new FormData()
                    fd.append('question_text', 'Pertanyaan baru')
                    fd.append('question_type', 'text')
                    fd.append('options', '')
                    fd.append('is_active', 'true')
                    fd.append('display_order', '1')
                    fd.append('angkatan', newAngkatan)
                    createQuestion(fd).then(() => {
                      toast.success(`Angkatan ${newAngkatan} berhasil ditambahkan`)
                      setShowAddAngkatan(false)
                      loadAngkatanList()
                    }).catch(err => toast.error(err.message))
                  }
                }}
              >
                {useTemplate ? `Muat Template (${TEMPLATE_QUESTION_COUNT} pertanyaan)` : 'Tambah Kosong'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Angkatan Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amikom-purple border-t-transparent" />
          </div>
        ) : angkatanStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-16">
            <ClipboardList className="h-10 w-10 text-slate-400" />
            <p className="mt-4 text-sm text-slate-500">Belum ada angkatan. Tambahkan angkatan pertama.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {angkatanStats.map((stat) => (
              <div
                key={stat.angkatan}
                className="relative group rounded-xl border border-slate-200 bg-white transition-all hover:border-amikom-purple/30 hover:shadow-sm"
              >
                <button
                  onClick={() => selectAngkatan(stat.angkatan)}
                  className="w-full p-6 text-left active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amikom-purple">
                        Angkatan
                      </p>
                      <p className="mt-1 text-3xl font-semibold tracking-[-0.02em] text-slate-900">
                        {stat.angkatan}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                    <span>{stat.count} pertanyaan</span>
                    <span className="text-green-600">{stat.active} aktif</span>
                  </div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteAngkatanConfirm(stat.angkatan) }}
                  className="absolute top-3 right-3 z-10 flex h-6 w-6 items-center justify-center rounded-md text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  aria-label={`Hapus angkatan ${stat.angkatan}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

      {/* Delete Angkatan Confirmation */}
      <AlertDialog open={!!deleteAngkatanConfirm} onOpenChange={() => setDeleteAngkatanConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Angkatan {deleteAngkatanConfirm}?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah anda yakin ingin menghapus card angkatan {deleteAngkatanConfirm}? Semua pertanyaan dalam angkatan ini akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteAngkatanConfirm && handleDeleteAngkatan(deleteAngkatanConfirm)} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    )
  }

  async function loadResponses(angkatan: string) {
    setLoadingResponses(true)
    try {
      const data = await getAngkatanResponses(angkatan)
      setResponses(data as any[])
      const employed = data.filter((r: any) => r.employment_status === 'Bekerja').length
      const studying = data.filter((r: any) => r.employment_status === 'Melanjutkan Studi').length
      setResponseStats({ total: data.length, employed, studying })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat jawaban')
    } finally {
      setLoadingResponses(false)
    }
  }

  async function loadHistory(angkatan: string) {
    setLoadingHistory(true)
    try {
      const histData = await getAngkatanTracerHistory(angkatan)
      setHistoryLogs(histData as any[])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat riwayat log')
    } finally {
      setLoadingHistory(false)
    }
  }

  function switchTab(tab: 'questions' | 'responses' | 'history') {
    setViewMode(tab)
    if (tab === 'responses' && selectedAngkatan) {
      loadResponses(selectedAngkatan)
    } else if (tab === 'history' && selectedAngkatan) {
      loadHistory(selectedAngkatan)
    }
  }

  async function openUserAnswers(userId: string, fullName: string) {
    setSelectedUserName(fullName)
    setUserDialogTab('answers')
    setExpandedHistoryId(null)
    try {
      const [answers, history] = await Promise.all([
        getUserAnswers(userId, selectedAngkatan!),
        getUserTracerHistory(userId),
      ])
      setSelectedUserResponses(answers as any[])
      setSelectedUserHistory(history as any[])
    } catch {
      toast.error('Gagal memuat jawaban user')
    }
  }

  // ═══════════════ VIEW: Questions for Selected Angkatan ═══════════════
  return (
    <div className="space-y-8">
      <div className="space-y-1.5 animate-fade-in-up">
        <PageHeader
          icon={<ClipboardList className="h-3.5 w-3.5" />}
          label={`Angkatan ${selectedAngkatan}`}
          title={
            viewMode === 'questions'
              ? 'Pertanyaan Kuesioner.'
              : viewMode === 'responses'
              ? 'Jawaban Kuesioner.'
              : 'Riwayat Log.'
          }
          subtitle={
            viewMode === 'questions'
              ? `${totalQuestions} pertanyaan untuk angkatan ${selectedAngkatan}.`
              : viewMode === 'responses'
              ? `${responseStats.total} alumni telah mengisi kuesioner angkatan ${selectedAngkatan}.`
              : `Riwayat pembaruan tracer study angkatan ${selectedAngkatan}.`
          }
        />
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 w-fit animate-fade-in-up">
        <button onClick={() => switchTab('questions')}
          className={`rounded-md px-4 py-2 text-xs font-medium font-mono uppercase tracking-wider transition-all ${
            viewMode === 'questions'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}>
          Pertanyaan
        </button>
        <button onClick={() => switchTab('responses')}
          className={`rounded-md px-4 py-2 text-xs font-medium font-mono uppercase tracking-wider transition-all flex items-center gap-2 ${
            viewMode === 'responses'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}>
          <Users className="h-3.5 w-3.5" />
          Jawaban
          {responseStats.total > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-amikom-purple/10 text-[10px] font-semibold text-amikom-purple px-1.5">
              {responseStats.total}
            </span>
          )}
        </button>
        <button onClick={() => switchTab('history')}
          className={`rounded-md px-4 py-2 text-xs font-medium font-mono uppercase tracking-wider transition-all flex items-center gap-2 ${
            viewMode === 'history'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}>
          <History className="h-3.5 w-3.5" />
          Riwayat Log
          {historyLogs.length > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-amikom-purple/10 text-[10px] font-semibold text-amikom-purple px-1.5">
              {historyLogs.length}
            </span>
          )}
        </button>
      </div>

      {/* ─── TAB: QUESTIONS ─── */}
      {viewMode === 'questions' && (
        <>
          {/* Export + Add */}
          <div className="flex items-center justify-end gap-2 animate-fade-in-up">
            <button onClick={async () => {
              try {
                const base64 = await exportQuestionsToExcel(selectedAngkatan!)
                const binaryString = atob(base64)
                const bytes = new Uint8Array(binaryString.length)
                for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)
                const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `kuesioner-angkatan-${selectedAngkatan}.xlsx`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
              } catch {
                toast.error('Gagal mengekspor data kuesioner')
              }
            }}
              className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:text-slate-900 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button onClick={openAdd}
              className="rounded-md bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm">
              + Tambah
            </button>
          </div>

          {/* Question List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amikom-purple border-t-transparent" />
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-16">
              <ClipboardList className="h-10 w-10 text-slate-400" />
              <p className="mt-4 text-sm text-slate-500">Belum ada pertanyaan untuk angkatan ini</p>
              <button onClick={openAdd} className="mt-4 rounded-md bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm">
                Tambah Pertanyaan
              </button>
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
              {questions.map((q, i) => (
                <div key={q.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-xs font-mono text-slate-500">{i + 1}</span>
                        <span className="text-[10px] font-mono text-slate-400">#{q.display_order}</span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-mono font-medium ${
                          q.is_active ? 'bg-amikom-purple/10 text-amikom-purple' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {q.question_type}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono font-medium ${
                          q.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                        }`}>
                          {q.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-900">{q.question_text}</p>
                      {q.options && q.options.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {q.options.map((opt, idx) => (
                            <span key={`${opt}-${idx}`} className="inline-flex items-center rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-600">{opt}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button onClick={() => toggleActive(q)}
                        className={`rounded-md border px-3 py-1.5 text-xs transition-all ${
                          q.is_active
                            ? 'border-slate-200 text-slate-600 hover:border-slate-400'
                            : 'border-amikom-purple/30 text-amikom-purple hover:bg-amikom-purple/5'
                        }`}>
                        {q.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button onClick={() => openEdit(q)}
                        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-slate-400 hover:text-slate-900">
                        Edit
                      </button>
                      <button onClick={() => confirmDelete(q.id)}
                        className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-50 hover:border-red-300">
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Pagination currentPage={questionPage} totalPages={totalQuestionPages} onPageChange={(p) => loadQuestionPage(selectedAngkatan!, p)} />

          {/* Question Form AlertDialog */}
          <AlertDialog open={showFormDialog} onOpenChange={setShowFormDialog}>
            <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {editingId ? 'Edit Pertanyaan' : 'Tambah Pertanyaan'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Angkatan {form.angkatan}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Teks Pertanyaan</label>
                  <textarea required value={form.question_text} onChange={(e) => setForm(f => ({ ...f, question_text: e.target.value }))}
                    rows={3} placeholder="Tulis pertanyaan..."
                    className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20 resize-none" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Tipe</label>
                    <select value={form.question_type} onChange={(e) => setForm(f => ({ ...f, question_type: e.target.value }))}
                      className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20">
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="select">Select</option>
                      <option value="radio">Radio</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="scale">Skala Linier</option>
                      <option value="number">Number</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Urutan</label>
                    <input type="number" value={form.display_order} onChange={(e) => setForm(f => ({ ...f, display_order: Number(e.target.value) }))}
                      className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Angkatan</label>
                    <input type="text" value={form.angkatan} onChange={(e) => setForm(f => ({ ...f, angkatan: e.target.value }))}
                      pattern="\d{4}" maxLength={4}
                      className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
                  </div>
                </div>

                {(form.question_type === 'select' || form.question_type === 'radio' || form.question_type === 'checkbox' || form.question_type === 'scale') && (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">
                      Opsi (pisahkan dengan baris baru)
                    </label>
                    <textarea value={form.options} onChange={(e) => setForm(f => ({ ...f, options: e.target.value }))}
                      rows={4} placeholder="Opsi 1&#10;Opsi 2&#10;Opsi 3"
                      className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20 resize-none" />
                  </div>
                )}

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-amikom-purple focus:ring-amikom-purple/20" />
                  <span className="text-sm text-slate-600">Aktif</span>
                </label>
              </form>

              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowFormDialog(false)}>Batal</AlertDialogCancel>
                <AlertDialogAction
                  id="confirm-form-question"
                  onClick={(e) => {
                    e.preventDefault()
                    handleSubmit(new Event('submit') as unknown as React.FormEvent)
                  }}
                  className="bg-amikom-purple text-white hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm"
                >
                  {submitting ? (
                    <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Menyimpan...</>
                  ) : editingId ? 'Simpan' : 'Tambah'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Confirmation */}
          <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Pertanyaan?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Pertanyaan akan dihapus permanen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </>
      )}

      {/* ─── TAB: RESPONSES ─── */}
      {viewMode === 'responses' && (
        <>
          {/* Stats + Export */}
          <div className="flex items-start justify-between gap-4 animate-fade-in-up">
            <div className="grid grid-cols-3 gap-4 flex-1">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Total Responden</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{responseStats.total}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Bekerja</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-600">{responseStats.employed}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Melanjutkan Studi</p>
                <p className="mt-1 text-2xl font-semibold text-amikom-purple">{responseStats.studying}</p>
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  const base64 = await exportResponsesToExcel(selectedAngkatan!)
                  const binaryString = atob(base64)
                  const bytes = new Uint8Array(binaryString.length)
                  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)
                  const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `jawaban-kuesioner-${selectedAngkatan}.xlsx`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Gagal mengekspor')
                }
              }}
              className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:text-slate-900 flex items-center gap-2 whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </button>
          </div>

          {/* Responses Table */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden animate-fade-in-up">
            {loadingResponses ? (
              <div className="flex items-center justify-center py-16">
                <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amikom-purple border-t-transparent" />
              </div>
            ) : responses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <ClipboardList className="h-10 w-10 text-slate-400" />
                <p className="mt-4 text-sm text-slate-500">Belum ada alumni yang mengisi kuesioner</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100">
                      <th className="px-6 py-3.5 text-left text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-500">Nama</th>
                      <th className="px-6 py-3.5 text-left text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-500">NIM</th>
                      <th className="px-6 py-3.5 text-left text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-6 py-3.5 text-left text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-500">Perusahaan</th>
                      <th className="px-6 py-3.5 text-left text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-500">Tgl Isi</th>
                      <th className="px-6 py-3.5 text-center text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-500">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {responses.map((r: any) => (
                      <tr key={r.user_id} className="transition-colors duration-200 hover:bg-slate-50">
                        <td className="px-6 py-4"><p className="text-sm font-medium text-slate-900">{r.full_name || r.email}</p></td>
                        <td className="px-6 py-4"><p className="text-sm text-slate-600 font-mono">{r.nim || '—'}</p></td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-medium ${
                            r.employment_status === 'Bekerja' ? 'bg-emerald-50 text-emerald-700' :
                            r.employment_status === 'Melanjutkan Studi' ? 'bg-amikom-purple/10 text-amikom-purple' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {r.employment_status === 'Bekerja' ? <CheckCircle2 className="h-3 w-3" /> :
                             r.employment_status === 'Melanjutkan Studi' ? <GraduationCap className="h-3 w-3" /> :
                             <XCircle className="h-3 w-3" />}
                            {r.employment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4"><p className="text-sm text-slate-600">{r.company || '—'}</p></td>
                        <td className="px-6 py-4"><p className="text-sm text-slate-500">
                          {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </p></td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => openUserAnswers(r.user_id, r.full_name || r.email)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-amikom-purple/30 hover:text-amikom-purple"
                          >
                            <Eye className="h-3.5 w-3.5" />
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
        </>
      )}

      {/* ─── TAB: RIWAYAT & LOG ─── */}
      {viewMode === 'history' && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Total Log Tercatat</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {historyLogs.length}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amikom-purple/10 text-amikom-purple">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Pembaruan Alumni</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-600">
                    {historyLogs.length}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Filter & Refresh Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in-up">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 p-1">
              <button
                onClick={() => setHistoryFilter('all')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium font-mono uppercase tracking-wider transition-all ${
                  historyFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Semua Log
              </button>
              <button
                onClick={() => setHistoryFilter('alumni')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium font-mono uppercase tracking-wider transition-all ${
                  historyFilter === 'alumni' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Pembaruan Alumni ({historyLogs.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (!selectedAngkatan) return
                  try {
                    const base64 = await exportHistoryToExcel(selectedAngkatan)
                    const binaryString = atob(base64)
                    const bytes = new Uint8Array(binaryString.length)
                    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)
                    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `riwayat-log-${selectedAngkatan}.xlsx`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Gagal mengekspor riwayat')
                  }
                }}
                className="rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Unduh XLS
              </button>
              <button
                onClick={() => selectedAngkatan && loadHistory(selectedAngkatan)}
                disabled={loadingHistory}
                className="rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                Segarkan Log
              </button>
            </div>
          </div>

          {/* History List */}
          {loadingHistory ? (
            <div className="flex items-center justify-center py-16">
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amikom-purple border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in-up">
              {/* Combine & Filter history items */}
              {(() => {
                const combinedItems: any[] = []

                if (historyFilter === 'all' || historyFilter === 'alumni') {
                  historyLogs.forEach(h => {
                    combinedItems.push({
                      id: `hist-${h.id}`,
                      type: h.type,
                      title: `${h.type}: ${h.full_name}`,
                      subtitle: `${h.status} ${h.company ? `di ${h.company}` : ''} • NIM: ${h.nim || '—'}`,
                      userName: h.full_name,
                      userEmail: h.email,
                      timestamp: h.submitted_at,
                      metadata: {
                        education_level: h.education_level,
                        company: h.company,
                        position: h.position,
                      },
                      snapshot: h.snapshot,
                      originalUserId: h.user_id,
                    })
                  })
                }

                combinedItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

                if (combinedItems.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center">
                      <History className="h-10 w-10 text-slate-300" />
                      <p className="mt-3 text-sm font-medium text-slate-600">Belum Ada Riwayat Log</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        Aktivitas pengisian dan pembaruan data alumni akan tercatat secara otomatis di sini.
                      </p>
                    </div>
                  )
                }

                return combinedItems.map(item => {
                  const date = new Date(item.timestamp)
                  const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                  const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                  const isUpdate = item.type === 'Pembaruan Data'

                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isUpdate
                              ? 'bg-amber-50 text-amber-600 border border-amber-100'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {isUpdate ? (
                              <RefreshCw className="h-4 w-4" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono font-medium ${
                                isUpdate
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {item.type}
                              </span>
                              <span className="text-xs font-semibold text-slate-900">{item.title}</span>
                            </div>

                            <p className="mt-1 text-xs text-slate-600">
                              {item.subtitle}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                              <span>Oleh: <strong className="text-slate-600 font-normal">{item.userName}</strong></span>
                              {item.userEmail && <span>({item.userEmail})</span>}
                              <span>•</span>
                              <span>{dateStr} pukul {timeStr} WIB</span>
                            </div>
                          </div>
                        </div>

                        {item.snapshot && (
                          <button
                            onClick={() => setSelectedSnapshotDetail({
                              userName: item.userName,
                              timestamp: item.timestamp,
                              type: item.type,
                              snapshot: item.snapshot,
                            })}
                            className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-amikom-purple/30 hover:text-amikom-purple transition-all flex items-center gap-1.5"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Lihat Snapshot
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          )}
        </div>
      )}

      {/* Snapshot Detail Dialog */}
      <Dialog open={!!selectedSnapshotDetail} onOpenChange={() => setSelectedSnapshotDetail(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Snapshot Riwayat — {selectedSnapshotDetail?.userName}</DialogTitle>
            <DialogDescription>
              {selectedSnapshotDetail?.timestamp && new Date(selectedSnapshotDetail.timestamp).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}
            </DialogDescription>
          </DialogHeader>

          {selectedSnapshotDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm rounded-lg bg-slate-50 p-4 border border-slate-200">
                {Object.entries({
                  'Pendidikan': selectedSnapshotDetail.snapshot?.core_fields?.education_level,
                  'Status Kerja': selectedSnapshotDetail.snapshot?.core_fields?.employment_status,
                  'Perusahaan': selectedSnapshotDetail.snapshot?.core_fields?.company,
                  'Posisi': selectedSnapshotDetail.snapshot?.core_fields?.position,
                  'Rentang Gaji': selectedSnapshotDetail.snapshot?.core_fields?.salary_range,
                  'Kesesuaian Bidang': selectedSnapshotDetail.snapshot?.core_fields?.study_field_match,
                  'Kritik & Saran': selectedSnapshotDetail.snapshot?.core_fields?.suggestions,
                }).map(([lbl, val]) => val ? (
                  <div key={lbl}>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{lbl}</p>
                    <p className="text-slate-800 font-medium text-xs mt-0.5">{String(val)}</p>
                  </div>
                ) : null)}
              </div>

              {selectedSnapshotDetail.snapshot?.answers?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-mono uppercase tracking-wider text-slate-500">
                    Jawaban Kuesioner ({selectedSnapshotDetail.snapshot.answers.length} Butir)
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedSnapshotDetail.snapshot.answers.map((a: any, i: number) => (
                      <div key={i} className="rounded-md border border-slate-100 bg-white p-3">
                        <p className="text-xs text-slate-500 font-mono">#{i + 1} {a.question_text}</p>
                        <p className="text-xs font-semibold text-amikom-purple mt-1">
                          {a.answer_text || <span className="italic text-slate-400 font-normal">Tidak diisi</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* User Answers Dialog */}
      <Dialog open={!!selectedUserResponses} onOpenChange={() => setSelectedUserResponses(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kuesioner — {selectedUserName}</DialogTitle>
            <DialogDescription>
              Angkatan {selectedAngkatan}
            </DialogDescription>
          </DialogHeader>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 w-fit">
            <button
              onClick={() => setUserDialogTab('answers')}
              className={`rounded-md px-4 py-1.5 text-xs font-medium font-mono uppercase tracking-wider transition-all ${
                userDialogTab === 'answers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Jawaban Terkini
            </button>
            <button
              onClick={() => setUserDialogTab('history')}
              className={`rounded-md px-4 py-1.5 text-xs font-medium font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                userDialogTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <History className="h-3 w-3" />
              Riwayat
              {selectedUserHistory.length > 0 && (
                <span className="inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-amikom-purple/10 text-[10px] font-semibold text-amikom-purple px-1">
                  {selectedUserHistory.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab: Jawaban Terkini */}
          {userDialogTab === 'answers' && (
            <div className="space-y-3">
              {selectedUserResponses && selectedUserResponses.length > 0 ? (
                selectedUserResponses.map((a: any, i: number) => (
                  <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-400 font-mono">{i + 1}.</p>
                    <p className="text-sm text-slate-800 mt-0.5">{a.question_text}</p>
                    <p className="mt-1.5 text-sm font-medium text-amikom-purple bg-white rounded-md border border-slate-100 px-3 py-2">
                      {a.answer_text || <span className="italic text-slate-400">Tidak diisi</span>}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">Tidak ada jawaban</p>
              )}
            </div>
          )}

          {/* Tab: Riwayat */}
          {userDialogTab === 'history' && (
            <div className="space-y-0 relative">
              {selectedUserHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 py-12">
                  <History className="h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-400">Belum ada riwayat tersimpan.</p>
                </div>
              ) : (
                <>
                  {/* garis vertikal */}
                  <div className="absolute left-[15px] top-4 bottom-4 w-px bg-slate-200" aria-hidden="true" />
                  {selectedUserHistory.map((item: any, index: number) => {
                    const isExp = expandedHistoryId === item.id
                    const label = index === selectedUserHistory.length - 1
                      ? 'Submit Pertama'
                      : `Pembaruan ke-${selectedUserHistory.length - index - 1}`
                    const date = new Date(item.submitted_at)
                    const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    return (
                      <div key={item.id} className="relative pl-10 pb-5 last:pb-0">
                        <span className={`absolute left-0 top-1 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 ${
                          index === 0 ? 'border-amikom-purple bg-amikom-purple text-white' : 'border-slate-300 bg-white text-slate-400'
                        }`}>
                          {index === 0 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <History className="h-3 w-3" />}
                        </span>
                        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                          <button
                            onClick={() => setExpandedHistoryId(isExp ? null : item.id)}
                            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                          >
                            <div>
                              <p className="text-[10px] font-mono uppercase tracking-wider text-amikom-purple">{label}</p>
                              <p className="text-sm font-semibold text-slate-900">{dateStr} · {timeStr}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {item.snapshot?.core_fields?.employment_status || '—'}
                                {item.snapshot?.core_fields?.company && ` · ${item.snapshot.core_fields.company}`}
                              </p>
                            </div>
                            {isExp
                              ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                              : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                          </button>
                          {isExp && (
                            <div className="border-t border-slate-100 px-4 py-3 space-y-3">
                              {/* Core fields */}
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {Object.entries({
                                  'Pendidikan': item.snapshot?.core_fields?.education_level,
                                  'Status Kerja': item.snapshot?.core_fields?.employment_status,
                                  'Perusahaan': item.snapshot?.core_fields?.company,
                                  'Jabatan': item.snapshot?.core_fields?.position,
                                  'Rentang Gaji': item.snapshot?.core_fields?.salary_range,
                                  'Kesesuaian Bid.': item.snapshot?.core_fields?.study_field_match,
                                }).map(([lbl, val]) => val ? (
                                  <div key={lbl}>
                                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{lbl}</p>
                                    <p className="text-slate-800 font-medium text-xs">{val}</p>
                                  </div>
                                ) : null)}
                              </div>
                              {/* Jawaban */}
                              {item.snapshot?.answers?.length > 0 && (
                                <div className="pt-2 border-t border-slate-100">
                                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                                    Jawaban ({item.snapshot.answers.length})
                                  </p>
                                  <div className="max-h-48 overflow-y-auto space-y-2">
                                    {item.snapshot.answers.map((a: any, i: number) => (
                                      <div key={i} className="flex gap-2">
                                        <span className="text-[10px] font-mono text-slate-400 mt-0.5 min-w-[18px]">{i + 1}</span>
                                        <div>
                                          <p className="text-xs text-slate-600 line-clamp-1">{a.question_text}</p>
                                          {a.answer_text
                                            ? <p className="text-xs font-medium text-amikom-purple">{a.answer_text}</p>
                                            : <p className="text-xs text-slate-400 italic">Tidak diisi</p>}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
