'use client'

import { useState, useEffect, useMemo, useDeferredValue } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createBerita, updateBerita, deleteBerita, toggleBeritaStatus, uploadImage } from '@/lib/actions/content'
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
import { Plus, Pencil, Trash2, Search, Newspaper, Eye, EyeOff, Calendar, Tag } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import type { Berita } from '@/types/database'

type BeritaKategori = 'Akademik' | 'Karir' | 'Kampus' | 'Teknologi' | 'Umum'

const emptyForm = {
  judul: '',
  slug: '',
  kategori: 'Umum' as BeritaKategori,
  penulis: '',
  tanggal: new Date().toISOString().split('T')[0],
  status: 'draft' as 'published' | 'draft',
  ringkasan: '',
  konten: '',
  gambar_url: '',
}

const KATEGORI_OPTIONS: BeritaKategori[] = ['Akademik', 'Karir', 'Kampus', 'Teknologi', 'Umum']

const generateSlug = (text: string) => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const kategoriColor: Record<BeritaKategori, string> = {
  Akademik: 'bg-blue-50 text-blue-700 border-blue-200',
  Karir: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Kampus: 'bg-violet-50 text-violet-700 border-violet-200',
  Teknologi: 'bg-amber-50 text-amber-700 border-amber-200',
  Umum: 'bg-slate-50 text-slate-600 border-slate-200',
}

export default function AdminBeritaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [items, setItems] = useState<Berita[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

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
      const { data } = await supabase.from('berita').select('*').order('tanggal', { ascending: false })
      if (data) setItems(data as Berita[])
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
      item.judul.toLowerCase().includes(q) ||
      item.kategori.toLowerCase().includes(q) ||
      item.penulis.toLowerCase().includes(q)
    )
  }, [items, deferredQuery])

  const { published, draft } = useMemo(() => ({
    published: items.filter(i => i.status === 'published').length,
    draft: items.filter(i => i.status === 'draft').length,
  }), [items])

  function openAdd() {
    setForm(emptyForm)
    setImageBlob(null)
    setEditingId(null)
    setShowModal(true)
  }

  function openEdit(item: Berita) {
    setForm({
      judul: item.judul,
      slug: item.slug,
      kategori: item.kategori,
      penulis: item.penulis,
      tanggal: item.tanggal,
      status: item.status,
      ringkasan: item.ringkasan,
      konten: item.konten,
      gambar_url: item.gambar_url ?? '',
    })
    setImageBlob(null)
    setEditingId(item.id)
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      let gambar_url = form.gambar_url

      if (imageBlob) {
        const uploadFd = new FormData()
        uploadFd.append('file', imageBlob, 'image.jpg')
        gambar_url = await uploadImage(uploadFd, 'berita')
      }

      const fd = new FormData()
      fd.append('judul', form.judul)
      fd.append('slug', form.slug)
      fd.append('kategori', form.kategori)
      fd.append('penulis', form.penulis)
      fd.append('tanggal', form.tanggal)
      fd.append('status', form.status)
      fd.append('ringkasan', form.ringkasan)
      fd.append('konten', form.konten)
      fd.append('gambar_url', gambar_url)

      if (editingId) {
        await updateBerita(editingId, fd)
        toast.success('Berita berhasil diperbarui')
      } else {
        await createBerita(fd)
        toast.success('Berita berhasil ditambahkan')
      }
      setShowModal(false)
      await loadItems()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    const promise = deleteBerita(id).then(() => loadItems())
    toast.promise(promise, { loading: 'Menghapus...', success: 'Berita berhasil dihapus', error: (err) => err.message })
    setDeleteConfirm(null)
  }

  async function handleToggleStatus(id: string, currentStatus: 'published' | 'draft') {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    try {
      await toggleBeritaStatus(id, newStatus)
      toast.success(newStatus === 'published' ? 'Berita dipublikasikan' : 'Berita dijadikan draft')
      await loadItems()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah status')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader icon={<Newspaper className="h-[14px] w-[14px]" />} label="Konten" title="Manajemen Berita." subtitle="Kelola artikel dan berita yang ditampilkan di portal alumni." />
        <div className="flex items-center justify-center py-20"><p className="text-sm text-slate-400">Memuat data...</p></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Newspaper className="h-[14px] w-[14px]" />}
        label="Konten"
        title="Manajemen Berita."
        subtitle="Kelola artikel dan berita yang ditampilkan di portal alumni."
        action={
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-amikom-purple px-4 py-2 text-sm font-medium text-white hover:bg-amikom-purple-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tulis Berita
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Total Berita</p>
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
            <input
              type="text"
              placeholder="Cari judul, kategori, penulis..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple"
            />
          </div>
          <p className="text-sm text-slate-500 shrink-0">{filtered.length} berita</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-400">Judul</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-400">Kategori</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-400">Tanggal</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-400">Views</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-wider text-slate-400">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">Tidak ada berita ditemukan.</td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.gambar_url ? (
                          <Image src={item.gambar_url} alt="" width={56} height={40} className="h-10 w-14 rounded object-cover shrink-0 border border-slate-100" />
                        ) : (
                          <div className="h-10 w-14 rounded bg-slate-100 shrink-0 flex items-center justify-center">
                            <Newspaper className="h-4 w-4 text-slate-300" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900 line-clamp-1">{item.judul}</p>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.ringkasan}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${kategoriColor[item.kategori]}`}>
                        <Tag className="h-2.5 w-2.5" />
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">{item.views.toLocaleString('id-ID')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(item.id, item.status)}
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold font-mono uppercase tracking-wider transition-colors ${
                          item.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {item.status === 'published'
                          ? <><Eye className="h-3 w-3" /> Published</>
                          : <><EyeOff className="h-3 w-3" /> Draft</>
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          aria-label="Edit berita"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          aria-label="Hapus berita"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Berita' : 'Tulis Berita Baru'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageUpload
            currentUrl={form.gambar_url || undefined}
            onImageReady={setImageBlob}
            label="Gambar Berita"
            hint="Gambar akan otomatis dikompres. Disarankan rasio 16:9."
          />
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Judul Berita *</label>
            <input required value={form.judul} onChange={e => {
                const val = e.target.value
                setForm(p => ({ ...p, judul: val, slug: generateSlug(val) }))
              }}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple"
              placeholder="Masukkan judul berita..." />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Slug *</label>
            <input required value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple"
              placeholder="judul-berita-di-url" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Kategori *</label>
              <select value={form.kategori} onChange={e => setForm(p => ({ ...p, kategori: e.target.value as BeritaKategori }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple bg-white">
                {KATEGORI_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Penulis *</label>
              <input required value={form.penulis} onChange={e => setForm(p => ({ ...p, penulis: e.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple"
                placeholder="Nama penulis" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Tanggal Publikasi *</label>
              <input required type="date" value={form.tanggal} onChange={e => setForm(p => ({ ...p, tanggal: e.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple" />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as 'published' | 'draft' }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple bg-white">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Ringkasan *</label>
            <textarea required rows={2} value={form.ringkasan} onChange={e => setForm(p => ({ ...p, ringkasan: e.target.value }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple resize-none"
              placeholder="Ringkasan singkat berita..." />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Konten Berita</label>
            <textarea rows={5} value={form.konten} onChange={e => {
                const val = e.target.value
                const ringkasan = val.length > 150 ? val.substring(0, 150) + '...' : val
                setForm(p => ({ ...p, konten: val, ringkasan }))
              }}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple resize-none"
              placeholder="Tulis konten berita lengkap di sini..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Batal</button>
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-amikom-purple px-4 py-2 text-sm font-medium text-white hover:bg-amikom-purple-hover transition-colors disabled:opacity-60">
              {submitting ? 'Menyimpan...' : editingId ? 'Perbarui Berita' : 'Simpan Berita'}</button>
          </div>
        </form>
      </Modal>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Berita?</AlertDialogTitle>
            <AlertDialogDescription>Berita ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
