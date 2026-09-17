'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createTrackRecord, updateTrackRecord, deleteTrackRecord } from '@/lib/actions/track-record'
import type { TrackRecord } from '@/types/database'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/modal'
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
} from '@/components/ui/alert-dialog'

const RECORDS_PER_PAGE = 20

export default function TrackRecordPage() {
  const [records, setRecords] = useState<TrackRecord[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; mode: 'add' | 'edit'; record: TrackRecord | null }>({ open: false, mode: 'add', record: null })
  const [submitting, setSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Form state
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [isCurrent, setIsCurrent] = useState(false)

  const loadRecords = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const from = (currentPage - 1) * RECORDS_PER_PAGE
      const to = from + RECORDS_PER_PAGE - 1
      const { data, error, count } = await supabase
        .from('track_records')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })
        .range(from, to)
      if (error) throw new Error(error.message)
      if (data) {
        setRecords(data as TrackRecord[])
        setTotalRecords(count || 0)
        setTotalPages(Math.ceil((count || 0) / RECORDS_PER_PAGE))
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  useEffect(() => { loadRecords() }, [loadRecords])

  function openAddModal() {
    resetForm()
    setModal({ open: true, mode: 'add', record: null })
  }

  function openEditModal(record: TrackRecord) {
    setCompany(record.company)
    setPosition(record.position)
    setStartDate(record.start_date.split('T')[0])
    setEndDate(record.end_date ? record.end_date.split('T')[0] : '')
    setDescription(record.description || '')
    setIsCurrent(record.is_current)
    setModal({ open: true, mode: 'edit', record })
  }

  function resetForm() {
    setCompany('')
    setPosition('')
    setStartDate('')
    setEndDate('')
    setDescription('')
    setIsCurrent(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('company', company)
      fd.append('position', position)
      fd.append('start_date', startDate)
      fd.append('end_date', isCurrent ? '' : endDate)
      fd.append('description', description)
      fd.append('is_current', isCurrent ? 'true' : 'false')

      if (modal.mode === 'add') {
        await createTrackRecord(fd)
        toast.success('Riwayat kerja berhasil ditambahkan')
      } else if (modal.record) {
        await updateTrackRecord(modal.record.id, fd)
        toast.success('Riwayat kerja berhasil diperbarui')
      }

      setModal({ open: false, mode: 'add', record: null })
      resetForm()
      loadRecords()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  function confirmDelete(id: string) {
    setDeleteConfirm(id)
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    const promise = deleteTrackRecord(deleteConfirm)
    toast.promise(promise, {
      loading: 'Menghapus riwayat kerja...',
      success: () => {
        setDeleteConfirm(null)
        loadRecords()
        return 'Riwayat kerja berhasil dihapus'
      },
      error: (err) => err instanceof Error ? err.message : 'Terjadi kesalahan',
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<span className="text-xs">💼</span>}
        label="Riwayat Kerja"
        title="Riwayat Kerja."
        subtitle="Kelola pengalaman kerja dan karir Anda."
        action={
          <button
            onClick={openAddModal}
            className="rounded-md bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm"
          >
            + Tambah
          </button>
        }
      />

      {/* Records List */}
      <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amikom-purple border-t-transparent" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-16 shadow-sm">
            <span className="text-3xl text-slate-500">💼</span>
            <p className="mt-4 text-sm text-slate-500">Belum ada riwayat kerja</p>
            <button
              onClick={openAddModal}
              className="mt-4 rounded-pill bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm"
            >
              Tambah Riwayat Kerja
            </button>
          </div>
        ) : (
          records.map((record) => (
            <div
              key={record.id}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-sans text-base font-semibold text-slate-900">{record.position}</h3>
                    {record.is_current && (
                      <span className="inline-flex items-center rounded-md bg-amikom-purple/10 px-2 py-0.5 text-[10px] font-semibold text-amikom-purple font-mono uppercase tracking-wider">
                        Saat Ini
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-amikom-purple font-medium">{record.company}</p>
                  <p className="mt-0.5 text-xs text-slate-500 font-mono">
                    {new Date(record.start_date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    {' — '}
                    {record.is_current
                      ? 'Sekarang'
                      : record.end_date
                      ? new Date(record.end_date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
                      : '—'}
                  </p>
                  {record.description && (
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">{record.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => openEditModal(record)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-slate-400 hover:text-slate-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => confirmDelete(record.id)}
                    className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-50 hover:border-red-300"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      {/* Modal */}
      <Modal
        open={modal.open}
        onClose={() => { setModal({ open: false, mode: 'add', record: null }) }}
        title={modal.mode === 'add' ? 'Tambah Riwayat Kerja' : 'Edit Riwayat Kerja'}
        description={modal.mode === 'add' ? 'Tambah Baru' : 'Edit'}
        footer={
          <>
            <button type="button" onClick={() => { setModal({ open: false, mode: 'add', record: null }) }}
              className="rounded-md border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-400 hover:text-slate-900">
              Batal
            </button>
            <button type="submit" disabled={submitting} form="track-record-form"
              className="rounded-md bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm disabled:opacity-50 flex items-center gap-2">
              {submitting ? (
                <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Menyimpan...</>
              ) : (
                modal.mode === 'add' ? 'Tambah' : 'Simpan'
              )}
            </button>
          </>
        }
      >
        <form id="track-record-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Perusahaan</label>
              <input type="text" required value={company} onChange={(e) => setCompany(e.target.value)}
                placeholder="Nama perusahaan"
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Posisi</label>
              <input type="text" required value={position} onChange={(e) => setPosition(e.target.value)}
                placeholder="Jabatan atau posisi"
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Mulai</label>
                <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Selesai</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  disabled={isCurrent}
                  className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20 disabled:bg-slate-100 disabled:cursor-not-allowed" />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isCurrent} onChange={(e) => { setIsCurrent(e.target.checked); if (e.target.checked) setEndDate('') }}
                className="h-4 w-4 rounded border-slate-300 text-amikom-purple focus:ring-amikom-purple/20" />
              <span className="text-sm text-slate-600">Saya masih bekerja di sini</span>
            </label>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Deskripsi</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                placeholder="Deskripsi pekerjaan (opsional)"
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20 resize-none" />
            </div>
          </form>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Riwayat Kerja?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data riwayat kerja akan dihapus permanen.
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
    </div>
  )
}
