'use client'

import { useState, useEffect, useMemo, useDeferredValue } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createFaq, updateFaq, deleteFaq, toggleFaqAktif } from '@/lib/actions/content'
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
import { Plus, Pencil, Trash2, Search, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import type { FAQ } from '@/types/database'

type FaqKategori = 'Akademik' | 'Karir' | 'Sistem Alumni' | 'Teknis' | 'Umum'

const emptyForm = {
  pertanyaan: '',
  jawaban: '',
  kategori: 'Umum' as FaqKategori,
  urutan: 0,
  aktif: true,
}

const KATEGORI_OPTIONS: FaqKategori[] = ['Akademik', 'Karir', 'Sistem Alumni', 'Teknis', 'Umum']

const kategoriColor: Record<FaqKategori, string> = {
  Akademik: 'bg-blue-50 text-blue-700 border-blue-200',
  Karir: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Sistem Alumni': 'bg-violet-50 text-violet-700 border-violet-200',
  Teknis: 'bg-red-50 text-red-700 border-red-200',
  Umum: 'bg-slate-50 text-slate-600 border-slate-200',
}

export default function AdminFaqPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [items, setItems] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
      const { data } = await supabase.from('faq').select('*').order('urutan', { ascending: true })
      if (data) setItems(data as FAQ[])
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
      item.pertanyaan.toLowerCase().includes(q) ||
      item.jawaban.toLowerCase().includes(q) ||
      item.kategori.toLowerCase().includes(q)
    )
  }, [items, deferredQuery])

  const { aktif, nonAktif } = useMemo(() => ({
    aktif: items.filter(i => i.aktif).length,
    nonAktif: items.filter(i => !i.aktif).length,
  }), [items])

  function openAdd() { setForm({ ...emptyForm, urutan: items.length + 1 }); setEditingId(null); setShowModal(true) }

  function openEdit(item: FAQ) {
    setForm({ pertanyaan: item.pertanyaan, jawaban: item.jawaban, kategori: item.kategori, urutan: item.urutan, aktif: item.aktif })
    setEditingId(item.id); setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('pertanyaan', form.pertanyaan)
      fd.append('jawaban', form.jawaban)
      fd.append('kategori', form.kategori)
      fd.append('urutan', String(form.urutan))
      fd.append('aktif', form.aktif ? 'true' : 'false')
      if (editingId) { await updateFaq(editingId, fd); toast.success('FAQ berhasil diperbarui') }
      else { await createFaq(fd); toast.success('FAQ berhasil ditambahkan') }
      setShowModal(false); await loadItems()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Gagal menyimpan') }
    finally { setSubmitting(false) }
  }

  async function handleDelete(id: string) {
    const promise = deleteFaq(id).then(() => loadItems())
    toast.promise(promise, { loading: 'Menghapus...', success: 'FAQ berhasil dihapus', error: (err) => err.message })
    setDeleteConfirm(null)
  }

  async function handleToggleAktif(id: string, currentAktif: boolean) {
    try { await toggleFaqAktif(id, !currentAktif); toast.success(currentAktif ? 'FAQ dinonaktifkan' : 'FAQ diaktifkan'); await loadItems() }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Gagal mengubah status') }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader icon={<HelpCircle className="h-[14px] w-[14px]" />} label="Konten" title="Manajemen FAQ." subtitle="Kelola pertanyaan dan jawaban yang sering ditanyakan oleh alumni." />
        <div className="flex items-center justify-center py-20"><p className="text-sm text-slate-400">Memuat data...</p></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={<HelpCircle className="h-[14px] w-[14px]" />} label="Konten" title="Manajemen FAQ." subtitle="Kelola pertanyaan dan jawaban yang sering ditanyakan oleh alumni."
        action={<button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-amikom-purple px-4 py-2 text-sm font-medium text-white hover:bg-amikom-purple-hover transition-colors"><Plus className="h-4 w-4" />Tambah FAQ</button>} />

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Total FAQ</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-slate-900">{items.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Aktif</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-emerald-600">{aktif}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Nonaktif</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-slate-400">{nonAktif}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Cari pertanyaan, jawaban, kategori..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple shadow-sm" />
        </div>
        <p className="text-sm text-slate-500 shrink-0">{filtered.length} FAQ</p>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm"><p className="text-sm text-slate-400">Tidak ada FAQ ditemukan.</p></div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className={`rounded-lg border bg-white shadow-sm transition-all ${item.aktif ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}>
              <div className="flex items-start gap-3 p-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-mono font-semibold text-slate-500 mt-0.5">{item.urutan}</span>
                <div className="flex-1 min-w-0">
                  <div role="button" tabIndex={0} onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedId(expandedId === item.id ? null : item.id) }}}
                    className="flex items-start justify-between gap-3 cursor-pointer group" aria-expanded={expandedId === item.id}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 group-hover:text-amikom-purple transition-colors">{item.pertanyaan}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium ${kategoriColor[item.kategori]}`}>{item.kategori}</span>
                        {!item.aktif && <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Nonaktif</span>}
                      </div>
                    </div>
                    {expandedId === item.id ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />}
                  </div>
                  {expandedId === item.id && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-sm text-slate-600 leading-relaxed">{item.jawaban}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleToggleAktif(item.id, item.aktif)}
                    className={`rounded-md px-2 py-1 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                      item.aktif ? 'text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`} aria-label={item.aktif ? 'Nonaktifkan FAQ' : 'Aktifkan FAQ'}>
                    {item.aktif ? 'Aktif' : 'Off'}
                  </button>
                  <button onClick={() => openEdit(item)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" aria-label="Edit FAQ"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteConfirm(item.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors" aria-label="Hapus FAQ"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit FAQ' : 'Tambah FAQ Baru'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Pertanyaan *</label>
            <input required value={form.pertanyaan} onChange={e => setForm(p => ({ ...p, pertanyaan: e.target.value }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple" placeholder="Tulis pertanyaan yang sering diajukan..." />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Jawaban *</label>
            <textarea required rows={5} value={form.jawaban} onChange={e => setForm(p => ({ ...p, jawaban: e.target.value }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple resize-none" placeholder="Tulis jawaban yang jelas dan informatif..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Kategori *</label>
              <select value={form.kategori} onChange={e => setForm(p => ({ ...p, kategori: e.target.value as FaqKategori }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple bg-white">
                {KATEGORI_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Urutan</label>
              <input type="number" min={1} value={form.urutan} onChange={e => setForm(p => ({ ...p, urutan: Number(e.target.value) }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amikom-purple focus:outline-none focus:ring-1 focus:ring-amikom-purple" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" checked={form.aktif} onChange={e => setForm(p => ({ ...p, aktif: e.target.checked }))} className="sr-only peer" id="faq-aktif" />
              <div className="h-5 w-9 rounded-full bg-slate-200 peer-checked:bg-amikom-purple transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-4" />
            </label>
            <label htmlFor="faq-aktif" className="text-sm text-slate-700 cursor-pointer">FAQ aktif (tampil di halaman publik)</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Batal</button>
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-amikom-purple px-4 py-2 text-sm font-medium text-white hover:bg-amikom-purple-hover transition-colors disabled:opacity-60">
              {submitting ? 'Menyimpan...' : editingId ? 'Perbarui FAQ' : 'Simpan FAQ'}</button>
          </div>
        </form>
      </Modal>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus FAQ?</AlertDialogTitle><AlertDialogDescription>FAQ ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}