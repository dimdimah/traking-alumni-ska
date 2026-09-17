'use client'

import { useState, useEffect, useMemo, useDeferredValue } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createSertifikasi, updateSertifikasi, deleteSertifikasi, toggleSertifikasiStatus, uploadImage } from '@/lib/actions/content'
import { PageHeader } from '@/components/ui/page-header'
import { Modal } from '@/components/ui/modal'
import { ImageUpload } from '@/components/ui/image-upload'
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
import { Plus, Pencil, Trash2, Search, Award, Eye, EyeOff, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import type { Sertifikasi } from '@/types/database'

type SertifikasiLevel = 'Nasional' | 'Internasional' | 'Vendor'
type SertifikasiKategori = 'IT & Networking' | 'Programming' | 'Data Science' | 'Cloud' | 'Keamanan Siber' | 'Manajemen'

const emptyForm = {
  nama: '',
  penyelenggara: '',
  kategori: 'IT & Networking' as SertifikasiKategori,
  level: 'Nasional' as SertifikasiLevel,
  durasi_valid: '',
  biaya: '',
  deskripsi: '',
  url_info: '',
  status: 'draft' as 'published' | 'draft',
  icon_url: '',
}

const KATEGORI_OPTIONS: SertifikasiKategori[] = ['IT & Networking', 'Programming', 'Data Science', 'Cloud', 'Keamanan Siber', 'Manajemen']
const LEVEL_OPTIONS: SertifikasiLevel[] = ['Nasional', 'Internasional', 'Vendor']

const levelColor: Record<SertifikasiLevel, string> = {
  Nasional: 'bg-blue-50 text-blue-700 border-blue-200',
  Internasional: 'bg-violet-50 text-violet-700 border-violet-200',
  Vendor: 'bg-amber-50 text-amber-700 border-amber-200',
}

const kategoriColor: Record<SertifikasiKategori, string> = {
  'IT & Networking': 'bg-slate-50 text-slate-600 border-slate-200',
  'Programming': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Data Science': 'bg-purple-50 text-purple-700 border-purple-200',
  'Cloud': 'bg-sky-50 text-sky-700 border-sky-200',
  'Keamanan Siber': 'bg-red-50 text-red-700 border-red-200',
  'Manajemen': 'bg-orange-50 text-orange-700 border-orange-200',
}

export default function AdminSertifikasiPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [items, setItems] = useState<Sertifikasi[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)

  useEffect(() => { loadItems() }, [])

  // Sync search ke URL — debounce 300ms agar tidak replace tiap keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      const qs = params.toString()
      router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false })
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  async function loadItems() {
    try {
      const supabase = createClient()
      const { data } = await supabase.from('sertifikasi').select('*').order('created_at', { ascending: false })
      if (data) setItems(data as Sertifikasi[])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const deferredQuery = useDeferredValue(searchQuery)
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    if (!q) return items
    return items.filter(item =>
      item.nama.toLowerCase().includes(q) ||
      item.penyelenggara.toLowerCase().includes(q) ||
      item.kategori.toLowerCase().includes(q)
    )
  }, [items, deferredQuery])

  const { published, draft } = useMemo(() => ({
    published: items.filter(i => i.status === 'published').length,
    draft: items.filter(i => i.status === 'draft').length,
  }), [items])

  function openAdd() { setForm(emptyForm); setEditingId(null); setImageBlob(null); setShowModal(true) }

  function openEdit(item: Sertifikasi) {
    setForm({
      nama: item.nama, penyelenggara: item.penyelenggara,
      kategori: item.kategori, level: item.level,
      durasi_valid: item.durasi_valid, biaya: item.biaya,
      deskripsi: item.deskripsi, url_info: item.url_info,
      status: item.status,
      icon_url: item.icon_url ?? '',
    })
    setImageBlob(null)
    setEditingId(item.id); setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true)
    try {
      let icon_url = form.icon_url
      if (imageBlob) {
        const uploadFd = new FormData()
        uploadFd.append('file', imageBlob, 'image.jpg')
        icon_url = await uploadImage(uploadFd, 'sertifikasi')
      }

      const fd = new FormData()
      fd.append('nama', form.nama); fd.append('penyelenggara', form.penyelenggara)
      fd.append('kategori', form.kategori); fd.append('level', form.level)
      fd.append('durasi_valid', form.durasi_valid); fd.append('biaya', form.biaya)
      fd.append('deskripsi', form.deskripsi); fd.append('url_info', form.url_info)
      fd.append('status', form.status)
      fd.append('icon_url', icon_url)
      if (editingId) { await updateSertifikasi(editingId, fd); toast.success('Sertifikasi berhasil diperbarui') }
      else { await createSertifikasi(fd); toast.success('Sertifikasi berhasil ditambahkan') }
      setShowModal(false); await loadItems()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Gagal menyimpan') }
    finally { setSubmitting(false) }
  }

  async function handleDelete(id: string) {
    const promise = deleteSertifikasi(id).then(() => loadItems())
    toast.promise(promise, { loading: 'Menghapus...', success: 'Sertifikasi berhasil dihapus', error: (err) => err.message })
    setDeleteConfirm(null)
  }

  async function handleToggleStatus(id: string, currentStatus: 'published' | 'draft') {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    try { await toggleSertifikasiStatus(id, newStatus); toast.success(newStatus === 'published' ? 'Dipublikasikan' : 'Dijadikan draft'); await loadItems() }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Gagal mengubah status') }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader icon={<Award className="h-[14px] w-[14px]" />} label="Konten" title="Manajemen Sertifikasi." subtitle="Kelola daftar sertifikasi rekomendasi untuk alumni dan mahasiswa." />
        <div className="flex items-center justify-center py-20"><p className="text-sm text-slate-400">Memuat data...</p></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={<Award className="h-[14px] w-[14px]" />} label="Konten" title="Manajemen Sertifikasi." subtitle="Kelola daftar sertifikasi rekomendasi untuk alumni dan mahasiswa."
        action={<button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-amikom-purple px-4 py-2 text-sm font-medium text-white hover:bg-amikom-purple-hover transition-colors"><Plus className="h-4 w-4" />Tambah Sertifikasi</button>} />

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Total Sertifikasi</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-slate-900">{items.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Dipublikasikan</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-emerald-600">{published}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Draft</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-amber-600">{draft}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Cari nama, penyelenggara, kategori..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple" />
          </div>
          <p className="text-sm text-slate-500 shrink-0">{filtered.length} sertifikasi</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-400">Nama Sertifikasi</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-400">Kategori</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-400">Level</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-400">Biaya</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-wider text-slate-400">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">Tidak ada sertifikasi ditemukan.</td></tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.icon_url && (
                          <Image src={item.icon_url} alt={item.penyelenggara} width={28} height={28} className="h-7 w-7 rounded object-contain shrink-0 border border-slate-100 bg-white p-0.5" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.nama}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{item.penyelenggara} · {item.durasi_valid}</p>
                          {item.url_info && (
                            <a href={item.url_info} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-[11px] text-amikom-purple hover:underline mt-0.5">
                              <ExternalLink className="h-2.5 w-2.5" /> Info</a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${kategoriColor[item.kategori]}`}>{item.kategori}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${levelColor[item.level]}`}>{item.level}</span>
                    </td>
                    <td className="px-4 py-3"><span className="text-sm text-slate-600">{item.biaya}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleStatus(item.id, item.status)}
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold font-mono uppercase tracking-wider transition-colors ${
                          item.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        }`}>
                        {item.status === 'published' ? <><Eye className="h-3 w-3" /> Published</> : <><EyeOff className="h-3 w-3" /> Draft</>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(item)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" aria-label="Edit sertifikasi"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteConfirm(item.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors" aria-label="Hapus sertifikasi"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Sertifikasi' : 'Tambah Sertifikasi Baru'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageUpload
            currentUrl={form.icon_url || undefined}
            onImageReady={setImageBlob}
            label="Icon / Logo Sertifikasi"
            hint="Logo provider sertifikasi (AWS, Google, dll). Akan otomatis dikompres."
          />
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Nama Sertifikasi *</label>
            <input required value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple" placeholder="Nama sertifikasi lengkap..." />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Penyelenggara *</label>
            <input required value={form.penyelenggara} onChange={e => setForm(p => ({ ...p, penyelenggara: e.target.value }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple" placeholder="Nama lembaga penyelenggara..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Kategori *</label>
              <select value={form.kategori} onChange={e => setForm(p => ({ ...p, kategori: e.target.value as SertifikasiKategori }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple bg-white">
                {KATEGORI_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Level *</label>
              <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value as SertifikasiLevel }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple bg-white">
                {LEVEL_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Durasi Valid</label>
              <input value={form.durasi_valid} onChange={e => setForm(p => ({ ...p, durasi_valid: e.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple" placeholder="mis. 3 tahun, Seumur hidup" />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Biaya</label>
              <input value={form.biaya} onChange={e => setForm(p => ({ ...p, biaya: e.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple" placeholder="mis. Rp 500.000 atau USD 200" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">URL Info</label>
            <input type="url" value={form.url_info} onChange={e => setForm(p => ({ ...p, url_info: e.target.value }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Deskripsi</label>
            <textarea rows={3} value={form.deskripsi} onChange={e => setForm(p => ({ ...p, deskripsi: e.target.value }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple resize-none" placeholder="Deskripsi singkat sertifikasi..." />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as 'published' | 'draft' }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple bg-white">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Batal</button>
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-amikom-purple px-4 py-2 text-sm font-medium text-white hover:bg-amikom-purple-hover transition-colors disabled:opacity-60">
              {submitting ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus Sertifikasi?</AlertDialogTitle><AlertDialogDescription>Sertifikasi ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
