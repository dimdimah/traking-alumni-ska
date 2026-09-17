'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getAdminJobsPaginated, getAdminJobsOverview } from '@/lib/actions/jobs'
import { createJob, updateJob, deleteJob, toggleJobStatus } from '@/lib/actions/jobs'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
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
import type { Job } from '@/types/database'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { toast } from 'sonner'

const JOBS_PER_PAGE = 15

const emptyForm: {
  title: string
  company: string
  location: string
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship'
  salary: string
  description: string
  skills: string
  contact_info: string
  url: string
  source: string
  is_active: boolean
} = {
  title: '',
  company: '',
  location: '',
  type: 'Full-time',
  salary: '',
  description: '',
  skills: '',
  contact_info: '',
  url: '',
  source: '',
  is_active: true,
}

export default function AdminCareerCenterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalJobs, setTotalJobs] = useState(0)
  const [overview, setOverview] = useState<{ total: number; active: number; inactive: number; added30: number; added7: number; sourceCount: number; lastUpdated: string | null } | null>(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadJobs(currentPage); loadOverview() }, [currentPage])

  async function loadOverview() {
    try {
      setOverview(await getAdminJobsOverview())
    } catch {
      // abaikan — stats pakai fallback dari halaman aktif
    }
  }

  // Sync page ke URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (currentPage > 1) params.set('page', String(currentPage))
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  async function loadJobs(page: number = currentPage) {
    try {
      setLoading(true)
      // BE pagination via server action (cached 30s) — tanpa fetch 2505 rows
      const result = await getAdminJobsPaginated(page, JOBS_PER_PAGE)
      setJobs(result.jobs)
      setTotalJobs(result.total)
      setTotalPages(result.totalPages)
      if (result.jobs.length > 0) {
        const dates = result.jobs
          .map(j => j.created_at ? new Date(j.created_at).getTime() : 0)
          .filter(Boolean)
        if (dates.length > 0) setLastUpdated(new Date(Math.max(...dates)))
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setForm(emptyForm)
    setEditingId(null)
    setShowModal(true)
  }

  function openEdit(job: Job) {
    setForm({
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      salary: job.salary || '',
      description: job.description,
      skills: (job.skills || []).join(', '),
      contact_info: job.contact_info || '',
      url: job.url || '',
      source: job.source || '',
      is_active: job.is_active,
    })
    setEditingId(job.id)
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('company', form.company)
      fd.append('location', form.location)
      fd.append('type', form.type)
      fd.append('salary', form.salary)
      fd.append('description', form.description)
      fd.append('skills', form.skills)
      fd.append('contact_info', form.contact_info)
      fd.append('url', form.url)
      fd.append('source', form.source)
      fd.append('is_active', form.is_active ? 'true' : 'false')

      if (editingId) {
        await updateJob(editingId, fd)
        toast.success('Lowongan berhasil diperbarui')
      } else {
        await createJob(fd)
        toast.success('Lowongan berhasil dipublikasikan')
      }

      setShowModal(false)
      loadJobs()
      loadOverview()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(job: Job) {
    try {
      await toggleJobStatus(job.id, !job.is_active)
      toast.success(`Lowongan ${job.is_active ? 'dinonaktifkan' : 'diaktifkan'}`)
      loadJobs()
      loadOverview()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  function confirmDelete(id: string) {
    setDeleteConfirm(id)
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    const promise = deleteJob(deleteConfirm)
    toast.promise(promise, {
      loading: 'Menghapus lowongan...',
      success: () => {
        setDeleteConfirm(null)
        loadJobs()
        loadOverview()
        return 'Lowongan berhasil dihapus'
      },
      error: (err) => err instanceof Error ? err.message : 'Terjadi kesalahan',
    })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<span className="text-[11px]">💼</span>}
        label="Lowongan Kerja"
        title="Kelola Lowongan Kerja."
        subtitle="Publikasikan dan kelola lowongan kerja untuk alumni."
        action={
          <button onClick={openAdd}
            className="rounded-md bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm">
            + Tambah
          </button>
        }
      />

      {/* Stats — dari overview global (cached), fallback hitungan halaman aktif */}
      <div className="flex gap-4 text-sm text-slate-600 font-mono animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <span><span className="text-slate-900 font-medium">{overview ? overview.total : totalJobs}</span> total</span>
        <span><span className="text-amikom-purple font-medium">{overview ? overview.active : jobs.filter(j => j.is_active).length}</span> aktif</span>
        <span><span className="text-slate-500">{overview ? overview.inactive : jobs.filter(j => !j.is_active).length}</span> nonaktif</span>
      </div>

      {/* Auto-fill Notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amikom-purple/10 bg-gradient-to-r from-amikom-purple/5 to-amikom-purple/0 p-4 animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amikom-purple/10 text-amikom-purple">
          <span className="text-[15px] leading-none">💼</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-amikom-ink">
            <span className="font-semibold">Data terisi otomatis.</span>{' '}
            Lowongan diambil dari berbagai sumber dan masuk ke sini tanpa perlu ditulis ulang. Anda tetap bisa menambah, mengedit, atau menghapus secara manual.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-amikom-purple/10 bg-amikom-purple/10 sm:grid-cols-3">
            {(() => {
              const lastDate = overview?.lastUpdated ? new Date(overview.lastUpdated) : lastUpdated
              const added30 = overview ? overview.added30 : 0
              const added7 = overview ? overview.added7 : 0
              const sourceCount = overview ? overview.sourceCount : 0
              return (
                <>
                  <div className="bg-amikom-canvas px-3 py-2">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-amikom-ink-muted-48">Terakhir terisi</p>
                    <p className="mt-0.5 text-sm font-semibold text-amikom-purple">
                      {lastDate ? lastDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum ada data'}
                    </p>
                  </div>
                  <div className="bg-amikom-canvas px-3 py-2">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-amikom-ink-muted-48">30 hari terakhir</p>
                    <p className="mt-0.5 text-sm font-semibold text-amikom-purple">
                      +{added30} <span className="font-normal text-amikom-ink-muted-48">lowongan ({added7} minggu ini)</span>
                    </p>
                  </div>
                  <div className="bg-amikom-canvas px-3 py-2">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-amikom-ink-muted-48">Sumber data</p>
                    <p className="mt-0.5 text-sm font-semibold text-amikom-purple">
                      {sourceCount} <span className="font-normal text-amikom-ink-muted-48">kanal</span>
                    </p>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Job List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amikom-purple border-t-transparent" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-16 shadow-sm">
          <span className="text-3xl text-slate-500">💼</span>
          <p className="mt-4 text-sm text-slate-500">Belum ada lowongan kerja</p>
          <button onClick={openAdd} className="mt-4 rounded-md bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-amikom-jonquil-warm transition-all active:scale-[0.98] hover:bg-amikom-purple-hover">
            Tambah Lowongan
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <p className="text-xs font-mono text-slate-500">
            Menampilkan {jobs.length} dari {totalJobs} lowongan · Halaman {currentPage} dari {totalPages}
          </p>
          {jobs.map((job) => (
            <div key={job.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-sans text-base font-semibold text-slate-900">{job.title}</h3>
                    <Badge variant={(job.type === 'Full-time' ? 'default' : job.type === 'Internship' ? 'warning' : 'secondary') as 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'}>
                      {job.type}
                    </Badge>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-mono font-medium ${
                      job.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {job.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-amikom-purple font-medium">{job.company}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-sm text-slate-500">{job.location}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2">{job.description}</p>
                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {job.skills.map((skill) => (
                        <span key={skill} className="inline-flex items-center rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-600">{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => handleToggleActive(job)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-slate-400 hover:text-slate-900">
                    {job.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button onClick={() => openEdit(job)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-slate-400 hover:text-slate-900">
                    Edit
                  </button>
                  <button onClick={() => confirmDelete(job.id)}
                    className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-50 hover:border-red-300">
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      {/* Modal Form */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Lowongan' : 'Tambah Lowongan'}
        footer={
          <>
            <button type="button" onClick={() => setShowModal(false)}
              className="rounded-md border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-400 hover:text-slate-900">
              Batal
            </button>
            <button type="submit" disabled={submitting} form="career-form"
              className="rounded-md bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm disabled:opacity-50 flex items-center gap-2">
              {submitting ? (
                <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Menyimpan...</>
              ) : editingId ? 'Simpan' : 'Publikasikan'}
            </button>
          </>
        }
      >
        <form id="career-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Judul</label>
                <input type="text" required value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Senior Frontend Engineer"
                  className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Tipe</label>
                <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value as 'Full-time' | 'Part-time' | 'Contract' | 'Internship' }))}
                  className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20">
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Perusahaan</label>
                <input type="text" required value={form.company} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))}
                  placeholder="Nama perusahaan"
                  className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Lokasi</label>
                <input type="text" required value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Jakarta, Remote"
                  className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Gaji (opsional)</label>
              <input type="text" value={form.salary} onChange={(e) => setForm(f => ({ ...f, salary: e.target.value }))}
                placeholder="Rp 15-25 jt"
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Deskripsi</label>
              <textarea required value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={4}
                placeholder="Deskripsi lowongan..."
                className="w-full rounded-md border border-amikom-hairline bg-amikom-canvas px-3.5 py-2.5 text-sm text-amikom-ink placeholder-amikom-ink/30 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20 resize-none" />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Skills (pisahkan dengan koma)</label>
              <input type="text" value={form.skills} onChange={(e) => setForm(f => ({ ...f, skills: e.target.value }))}
                placeholder="React, TypeScript, Next.js"
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Kontak (opsional)</label>
              <input type="text" value={form.contact_info} onChange={(e) => setForm(f => ({ ...f, contact_info: e.target.value }))}
                placeholder="Email atau nomor telepon"
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">URL Pendaftaran</label>
                <input type="url" value={form.url} onChange={(e) => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://example.com/apply"
                  className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Sumber</label>
                <select value={form.source} onChange={(e) => setForm(f => ({ ...f, source: e.target.value }))}
                  className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20">
                  <option value="">Pilih sumber...</option>
                  <option value="Internal">Internal</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Jobstreet">Jobstreet</option>
                  <option value="Glints">Glints</option>
                  <option value="E-mail">E-mail</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-amikom-purple focus:ring-amikom-purple/20" />
              <span className="text-sm text-slate-600">Publikasikan segera</span>
            </label>

          </form>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Lowongan?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Lowongan akan dihapus permanen.
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
