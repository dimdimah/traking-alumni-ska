'use client'

import { useState, useEffect, useMemo, useDeferredValue } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createKisahSukses, updateKisahSukses, deleteKisahSukses, toggleKisahSuksesStatus, toggleKisahSuksesFeatured, uploadImage } from '@/lib/actions/content'
import { ImageUpload } from '@/components/ui/image-upload'
import { PageHeader } from '@/components/ui/page-header'
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
import { Plus, Pencil, Trash2, Search, Star, Eye, EyeOff, GraduationCap, Briefcase, MapPin, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import type { KisahSukses } from '@/types/database'

type ProdiAlumni = 'S1 Informatika' | 'S1 Teknologi Informasi' | 'D3 Manajemen Informatika' | 'D3 Komputerisasi Akuntansi'

const emptyForm = {
  nama_alumni: '',
  angkatan: new Date().getFullYear() - 4,
  prodi: 'S1 Informatika' as ProdiAlumni,
  posisi_sekarang: '',
  perusahaan: '',
  lokasi: '',
  foto_url: '',
  kutipan: '',
  cerita: '',
  status: 'draft' as 'published' | 'draft',
  tanggal_dibuat: new Date().toISOString().split('T')[0],
  featured: false,
}

const PRODI_OPTIONS: ProdiAlumni[] = ['S1 Informatika', 'S1 Teknologi Informasi', 'D3 Manajemen Informatika', 'D3 Komputerisasi Akuntansi']

const prodiColor: Record<ProdiAlumni, string> = {
  'S1 Informatika': 'bg-blue-50 text-blue-700 border-blue-200',
  'S1 Teknologi Informasi': 'bg-violet-50 text-violet-700 border-violet-200',
  'D3 Manajemen Informatika': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'D3 Komputerisasi Akuntansi': 'bg-amber-50 text-amber-700 border-amber-200',
}

function AlumniAvatar({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const colors = ['bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700']
  const colorIdx = name.charCodeAt(0) % colors.length
  return <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${colors[colorIdx]}`}>{initials}</span>
}

export default function AdminKisahSuksesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [items, setItems] = useState<KisahSukses[]>([])
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
      const { data } = await supabase.from('kisah_sukses').select('*').order('created_at', { ascending: false })
      if (data) setItems(data as KisahSukses[])
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
      item.nama_alumni.toLowerCase().includes(q) ||
      item.perusahaan.toLowerCase().includes(q) ||
      item.posisi_sekarang.toLowerCase().includes(q) ||
      item.prodi.toLowerCase().includes(q)
    )
  }, [items, deferredQuery])

  const { published, draft, featuredCount } = useMemo(() => ({
    published: items.filter(i => i.status === 'published').length,
    draft: items.filter(i => i.status === 'draft').length,
    featuredCount: items.filter(i => i.featured).length,
  }), [items])

  function openAdd() { setForm(emptyForm); setEditingId(null); setImageBlob(null); setShowModal(true) }

  function openEdit(item: KisahSukses) {
    setForm({
      nama_alumni: item.nama_alumni, angkatan: item.angkatan, prodi: item.prodi,
      posisi_sekarang: item.posisi_sekarang, perusahaan: item.perusahaan, lokasi: item.lokasi,
      foto_url: item.foto_url, kutipan: item.kutipan, cerita: item.cerita,
      status: item.status, tanggal_dibuat: item.created_at.split('T')[0], featured: item.featured,
    })
    setEditingId(item.id); setImageBlob(null); setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true)
    try {
      let foto_url = form.foto_url
      if (imageBlob) {
        const uploadFd = new FormData()
        uploadFd.append('file', imageBlob, 'image.jpg')
        foto_url = await uploadImage(uploadFd, 'kisah-sukses')
      }
      const fd = new FormData()
      fd.append('nama_alumni', form.nama_alumni); fd.append('angkatan', String(form.angkatan))
      fd.append('prodi', form.prodi); fd.append('posisi_sekarang', form.posisi_sekarang)
      fd.append('perusahaan', form.perusahaan); fd.append('lokasi', form.lokasi)
      fd.append('foto_url', foto_url); fd.append('kutipan', form.kutipan)
      fd.append('cerita', form.cerita); fd.append('status', form.status)
      fd.append('featured', form.featured ? 'true' : 'false')
      if (editingId) { await updateKisahSukses(editingId, fd); toast.success('Kisah sukses berhasil diperbarui') }
      else { await createKisahSukses(fd); toast.success('Kisah sukses berhasil ditambahkan') }
      setShowModal(false); await loadItems()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Gagal menyimpan') }
    finally { setSubmitting(false) }
  }

  async function handleDelete(id: string) {
    const promise = deleteKisahSukses(id).then(() => loadItems())
    toast.promise(promise, { loading: 'Menghapus...', success: 'Kisah sukses berhasil dihapus', error: (err) => err.message })
    setDeleteConfirm(null)
  }

  async function handleToggleStatus(id: string, currentStatus: 'published' | 'draft') {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    try { await toggleKisahSuksesStatus(id, newStatus); toast.success(newStatus === 'published' ? 'Dipublikasikan' : 'Dijadikan draft'); await loadItems() }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Gagal mengubah status') }
  }

  async function handleToggleFeatured(id: string, currentFeatured: boolean) {
    try { await toggleKisahSuksesFeatured(id, !currentFeatured); toast.success(currentFeatured ? 'Dihapus dari featured' : 'Ditandai sebagai featured'); await loadItems() }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Gagal mengubah featured') }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader icon={<Star className="h-[14px] w-[14px]" />} label="Konten" title="Kisah Sukses Alumni." subtitle="Kelola cerita inspiratif alumni yang ditampilkan di portal." />
        <div className="flex items-center justify-center py-20"><p className="text-sm text-slate-400">Memuat data...</p></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={<Star className="h-[14px] w-[14px]" />} label="Konten" title="Kisah Sukses Alumni." subtitle="Kelola cerita inspiratif alumni yang ditampilkan di portal."
        action={<button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-amikom-purple px-4 py-2 text-sm font-medium text-white hover:bg-amikom-purple-hover transition-colors"><Plus className="h-4 w-4" />Tambah Kisah</button>} />

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Total Kisah</p>
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
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Featured</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-amber-500">{featuredCount}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Cari nama, perusahaan, posisi..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple" />
          </div>
          <p className="text-sm text-slate-500 shrink-0">{filtered.length} kisah</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-400">Alumni</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-400">Prodi</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-400">Posisi & Perusahaan</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-400">Featured</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-wider text-slate-400">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">Tidak ada kisah sukses ditemukan.</td></tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <AlumniAvatar name={item.nama_alumni} />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.nama_alumni}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <GraduationCap className="h-3 w-3" /> Angkatan {item.angkatan}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${prodiColor[item.prodi]}`}>{item.prodi}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-900 flex items-center gap-1"><Briefcase className="h-3 w-3 text-slate-400" />{item.posisi_sekarang}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3" /> {item.perusahaan}
                        {item.lokasi && <><MapPin className="h-3 w-3 ml-1" /> {item.lokasi}</>}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleFeatured(item.id, item.featured)}
                        className={`transition-colors ${item.featured ? 'text-amber-400 hover:text-amber-500' : 'text-slate-300 hover:text-slate-400'}`}
                        aria-label={item.featured ? 'Hapus dari featured' : 'Jadikan featured'} title={item.featured ? 'Featured — klik untuk hapus' : 'Klik untuk featured'}>
                        <Star className={`h-5 w-5 ${item.featured ? 'fill-amber-400' : ''}`} />
                      </button>
                    </td>
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
                        <button onClick={() => openEdit(item)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" aria-label="Edit kisah sukses"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteConfirm(item.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors" aria-label="Hapus kisah sukses"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Kisah Sukses' : 'Tambah Kisah Sukses Baru'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Nama Alumni *</label>
              <input required value={form.nama_alumni} onChange={e => setForm(p => ({ ...p, nama_alumni: e.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple" placeholder="Nama lengkap alumni" />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Angkatan *</label>
              <input required type="number" min={2000} max={new Date().getFullYear()} value={form.angkatan}
                onChange={e => setForm(p => ({ ...p, angkatan: Number(e.target.value) }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Program Studi *</label>
            <select value={form.prodi} onChange={e => setForm(p => ({ ...p, prodi: e.target.value as ProdiAlumni }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple bg-white">
              {PRODI_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Posisi Sekarang *</label>
              <input required value={form.posisi_sekarang} onChange={e => setForm(p => ({ ...p, posisi_sekarang: e.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple" placeholder="mis. Software Engineer" />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Perusahaan *</label>
              <input required value={form.perusahaan} onChange={e => setForm(p => ({ ...p, perusahaan: e.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple" placeholder="Nama perusahaan" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Lokasi</label>
            <input value={form.lokasi} onChange={e => setForm(p => ({ ...p, lokasi: e.target.value }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple" placeholder="mis. Jakarta, Surabaya" />
          </div>
          <ImageUpload
            currentUrl={form.foto_url || undefined}
            onImageReady={setImageBlob}
            label="Foto Alumni"
            hint="Foto profil alumni. Akan otomatis dikompres."
          />
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Kutipan Inspiratif *</label>
            <textarea required rows={2} value={form.kutipan} onChange={e => setForm(p => ({ ...p, kutipan: e.target.value }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple resize-none" placeholder="Kutipan singkat dari alumni (ditampilkan sebagai highlight)..." />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Cerita Lengkap</label>
            <textarea rows={4} value={form.cerita} onChange={e => setForm(p => ({ ...p, cerita: e.target.value }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple resize-none" placeholder="Cerita perjalanan karir alumni secara lebih lengkap..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as 'published' | 'draft' }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple bg-white">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" id="kisah-featured" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} className="sr-only peer" />
                  <div className="h-5 w-9 rounded-full bg-slate-200 peer-checked:bg-amber-400 transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-4" />
                </div>
                <span className="text-sm text-slate-700">Tampilkan sebagai featured</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Batal</button>
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-amikom-purple px-4 py-2 text-sm font-medium text-white hover:bg-amikom-purple-hover transition-colors disabled:opacity-60">
              {submitting ? 'Menyimpan...' : editingId ? 'Perbarui Kisah' : 'Simpan Kisah'}</button>
          </div>
        </form>
      </Modal>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus Kisah Sukses?</AlertDialogTitle><AlertDialogDescription>Kisah sukses ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}