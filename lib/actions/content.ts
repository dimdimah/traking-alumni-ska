'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { beritaSchema, sertifikasiSchema, faqSchema, kisahSuksesSchema } from '@/lib/schemas/content'

async function checkAdminRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null; error: unknown }
  if (profile?.role !== 'super_user') throw new Error('Forbidden')
  return supabase
}

async function ins(supabase: Awaited<ReturnType<typeof createClient>>, table: string, data: unknown) {
  const { error } = await (supabase.from(table) as any).insert(data)
  return error as { message: string } | null
}

async function upd(supabase: Awaited<ReturnType<typeof createClient>>, table: string, id: string, data: unknown) {
  const { error } = await (supabase.from(table) as any).update(data).eq('id', id)
  return error as { message: string } | null
}

async function del(supabase: Awaited<ReturnType<typeof createClient>>, table: string, id: string) {
  const { error } = await (supabase.from(table) as any).delete().eq('id', id)
  return error as { message: string } | null
}

// ─── UPLOAD GAMBAR ke Supabase Storage ───
// bucket: 'content' (public bucket, buat manual di Supabase Dashboard)
// folder: 'berita' | 'kisah-sukses' | 'sertifikasi'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 // 2MB — sudah dikompresi client-side

export async function uploadImage(
  formData: FormData,
  folder: 'berita' | 'kisah-sukses' | 'sertifikasi'
): Promise<string> {
  const supabase = await checkAdminRole()

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) throw new Error('File gambar tidak ditemukan')

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.')
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Ukuran file ${(file.size / 1024 / 1024).toFixed(2)}MB melebihi batas 2MB.`)
  }

  // Buat nama file unik: folder/timestamp-random.jpg
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from('content')
    .upload(filename, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    console.error('Gagal upload gambar:', error.message)
    throw new Error('Gagal mengupload gambar. Pastikan bucket "content" sudah dibuat di Supabase.')
  }

  const { data: { publicUrl } } = supabase.storage
    .from('content')
    .getPublicUrl(filename)

  return publicUrl
}

// ─── DELETE GAMBAR dari Supabase Storage ───
// path = bagian setelah domain storage, mis: 'berita/1234-abc.jpg'
export async function deleteImage(publicUrl: string): Promise<void> {
  if (!publicUrl) return
  const supabase = await checkAdminRole()

  // Ekstrak path dari URL publik
  // Format: https://xxx.supabase.co/storage/v1/object/public/content/berita/file.jpg
  const match = publicUrl.match(/\/storage\/v1\/object\/public\/content\/(.+)$/)
  if (!match) return // bukan URL storage, skip

  const filePath = match[1]
  const { error } = await supabase.storage.from('content').remove([filePath])
  if (error) console.error('Gagal hapus gambar lama:', error.message)
  // Tidak throw — delete gambar lama adalah best-effort, tidak boleh block operasi utama
}

// ─── BERITA ───

export async function createBerita(formData: FormData) {
  const supabase = await checkAdminRole()
  const parsed = beritaSchema.safeParse({
    judul: formData.get('judul') as string,
    slug: formData.get('slug') as string,
    kategori: formData.get('kategori') as string,
    penulis: formData.get('penulis') as string,
    tanggal: formData.get('tanggal') as string,
    status: formData.get('status') as string,
    ringkasan: formData.get('ringkasan') as string,
    konten: (formData.get('konten') as string) || '',
    gambar_url: (formData.get('gambar_url') as string) || '',
  })
  if (!parsed.success) throw new Error(parsed.error.issues.map(e => e.message).join(', '))
  const error = await ins(supabase, 'berita', parsed.data)
  if (error) { console.error('Gagal buat berita:', error.message); throw new Error('Gagal menyimpan berita.') }
  revalidatePath('/admin/content/berita')
}

export async function updateBerita(id: string, formData: FormData) {
  const supabase = await checkAdminRole()
  const parsed = beritaSchema.safeParse({
    judul: formData.get('judul') as string,
    slug: formData.get('slug') as string,
    kategori: formData.get('kategori') as string,
    penulis: formData.get('penulis') as string,
    tanggal: formData.get('tanggal') as string,
    status: formData.get('status') as string,
    ringkasan: formData.get('ringkasan') as string,
    konten: (formData.get('konten') as string) || '',
    gambar_url: (formData.get('gambar_url') as string) || '',
  })
  if (!parsed.success) throw new Error(parsed.error.issues.map(e => e.message).join(', '))
  const error = await upd(supabase, 'berita', id, parsed.data)
  if (error) { console.error('Gagal update berita:', error.message); throw new Error('Gagal menyimpan berita.') }
  revalidatePath('/admin/content/berita')
}

export async function deleteBerita(id: string) {
  const supabase = await checkAdminRole()
  const error = await del(supabase, 'berita', id)
  if (error) { console.error('Gagal hapus berita:', error.message); throw new Error('Gagal menghapus berita.') }
  revalidatePath('/admin/content/berita')
}

export async function toggleBeritaStatus(id: string, status: 'published' | 'draft') {
  const supabase = await checkAdminRole()
  const error = await upd(supabase, 'berita', id, { status })
  if (error) { console.error('Gagal toggle berita:', error.message); throw new Error('Gagal mengubah status.') }
  revalidatePath('/admin/content/berita')
}

// ─── SERTIFIKASI ───

export async function createSertifikasi(formData: FormData) {
  const supabase = await checkAdminRole()
  const parsed = sertifikasiSchema.safeParse({
    nama: formData.get('nama') as string,
    penyelenggara: formData.get('penyelenggara') as string,
    kategori: formData.get('kategori') as string,
    level: formData.get('level') as string,
    durasi_valid: (formData.get('durasi_valid') as string) || '',
    biaya: (formData.get('biaya') as string) || '',
    deskripsi: (formData.get('deskripsi') as string) || '',
    url_info: (formData.get('url_info') as string) || '',
    icon_url: (formData.get('icon_url') as string) || '',
    status: formData.get('status') as string,
  })
  if (!parsed.success) throw new Error(parsed.error.issues.map(e => e.message).join(', '))
  const error = await ins(supabase, 'sertifikasi', parsed.data)
  if (error) { console.error('Gagal buat sertifikasi:', error.message); throw new Error('Gagal menyimpan sertifikasi.') }
  revalidatePath('/admin/content/sertifikasi')
}

export async function updateSertifikasi(id: string, formData: FormData) {
  const supabase = await checkAdminRole()
  const parsed = sertifikasiSchema.safeParse({
    nama: formData.get('nama') as string,
    penyelenggara: formData.get('penyelenggara') as string,
    kategori: formData.get('kategori') as string,
    level: formData.get('level') as string,
    durasi_valid: (formData.get('durasi_valid') as string) || '',
    biaya: (formData.get('biaya') as string) || '',
    deskripsi: (formData.get('deskripsi') as string) || '',
    url_info: (formData.get('url_info') as string) || '',
    icon_url: (formData.get('icon_url') as string) || '',
    status: formData.get('status') as string,
  })
  if (!parsed.success) throw new Error(parsed.error.issues.map(e => e.message).join(', '))
  const error = await upd(supabase, 'sertifikasi', id, parsed.data)
  if (error) { console.error('Gagal update sertifikasi:', error.message); throw new Error('Gagal menyimpan sertifikasi.') }
  revalidatePath('/admin/content/sertifikasi')
}

export async function deleteSertifikasi(id: string) {
  const supabase = await checkAdminRole()
  const error = await del(supabase, 'sertifikasi', id)
  if (error) { console.error('Gagal hapus sertifikasi:', error.message); throw new Error('Gagal menghapus sertifikasi.') }
  revalidatePath('/admin/content/sertifikasi')
}

export async function toggleSertifikasiStatus(id: string, status: 'published' | 'draft') {
  const supabase = await checkAdminRole()
  const error = await upd(supabase, 'sertifikasi', id, { status })
  if (error) { console.error('Gagal toggle sertifikasi:', error.message); throw new Error('Gagal mengubah status.') }
  revalidatePath('/admin/content/sertifikasi')
}

// ─── FAQ ───

export async function createFaq(formData: FormData) {
  const supabase = await checkAdminRole()
  const parsed = faqSchema.safeParse({
    pertanyaan: formData.get('pertanyaan') as string,
    jawaban: formData.get('jawaban') as string,
    kategori: formData.get('kategori') as string,
    urutan: formData.get('urutan') as string,
    aktif: formData.get('aktif') === 'true',
  })
  if (!parsed.success) throw new Error(parsed.error.issues.map(e => e.message).join(', '))
  const error = await ins(supabase, 'faq', parsed.data)
  if (error) { console.error('Gagal buat faq:', error.message); throw new Error('Gagal menyimpan FAQ.') }
  revalidatePath('/admin/content/faq')
}

export async function updateFaq(id: string, formData: FormData) {
  const supabase = await checkAdminRole()
  const parsed = faqSchema.safeParse({
    pertanyaan: formData.get('pertanyaan') as string,
    jawaban: formData.get('jawaban') as string,
    kategori: formData.get('kategori') as string,
    urutan: formData.get('urutan') as string,
    aktif: formData.get('aktif') === 'true',
  })
  if (!parsed.success) throw new Error(parsed.error.issues.map(e => e.message).join(', '))
  const error = await upd(supabase, 'faq', id, parsed.data)
  if (error) { console.error('Gagal update faq:', error.message); throw new Error('Gagal menyimpan FAQ.') }
  revalidatePath('/admin/content/faq')
}

export async function deleteFaq(id: string) {
  const supabase = await checkAdminRole()
  const error = await del(supabase, 'faq', id)
  if (error) { console.error('Gagal hapus faq:', error.message); throw new Error('Gagal menghapus FAQ.') }
  revalidatePath('/admin/content/faq')
}

export async function toggleFaqAktif(id: string, aktif: boolean) {
  const supabase = await checkAdminRole()
  const error = await upd(supabase, 'faq', id, { aktif })
  if (error) { console.error('Gagal toggle faq:', error.message); throw new Error('Gagal mengubah status.') }
  revalidatePath('/admin/content/faq')
}

// ─── KISAH SUKSES ───

export async function createKisahSukses(formData: FormData) {
  const supabase = await checkAdminRole()
  const parsed = kisahSuksesSchema.safeParse({
    nama_alumni: formData.get('nama_alumni') as string,
    angkatan: formData.get('angkatan') as string,
    prodi: formData.get('prodi') as string,
    posisi_sekarang: formData.get('posisi_sekarang') as string,
    perusahaan: formData.get('perusahaan') as string,
    lokasi: (formData.get('lokasi') as string) || '',
    foto_url: (formData.get('foto_url') as string) || '',
    kutipan: formData.get('kutipan') as string,
    cerita: (formData.get('cerita') as string) || '',
    status: formData.get('status') as string,
    featured: formData.get('featured') === 'true',
  })
  if (!parsed.success) throw new Error(parsed.error.issues.map(e => e.message).join(', '))
  const error = await ins(supabase, 'kisah_sukses', parsed.data)
  if (error) { console.error('Gagal buat kisah sukses:', error.message); throw new Error('Gagal menyimpan kisah sukses.') }
  revalidatePath('/admin/content/kisah-sukses')
}

export async function updateKisahSukses(id: string, formData: FormData) {
  const supabase = await checkAdminRole()
  const parsed = kisahSuksesSchema.safeParse({
    nama_alumni: formData.get('nama_alumni') as string,
    angkatan: formData.get('angkatan') as string,
    prodi: formData.get('prodi') as string,
    posisi_sekarang: formData.get('posisi_sekarang') as string,
    perusahaan: formData.get('perusahaan') as string,
    lokasi: (formData.get('lokasi') as string) || '',
    foto_url: (formData.get('foto_url') as string) || '',
    kutipan: formData.get('kutipan') as string,
    cerita: (formData.get('cerita') as string) || '',
    status: formData.get('status') as string,
    featured: formData.get('featured') === 'true',
  })
  if (!parsed.success) throw new Error(parsed.error.issues.map(e => e.message).join(', '))
  const error = await upd(supabase, 'kisah_sukses', id, parsed.data)
  if (error) { console.error('Gagal update kisah sukses:', error.message); throw new Error('Gagal menyimpan kisah sukses.') }
  revalidatePath('/admin/content/kisah-sukses')
}

export async function deleteKisahSukses(id: string) {
  const supabase = await checkAdminRole()
  const error = await del(supabase, 'kisah_sukses', id)
  if (error) { console.error('Gagal hapus kisah sukses:', error.message); throw new Error('Gagal menghapus kisah sukses.') }
  revalidatePath('/admin/content/kisah-sukses')
}

export async function toggleKisahSuksesStatus(id: string, status: 'published' | 'draft') {
  const supabase = await checkAdminRole()
  const error = await upd(supabase, 'kisah_sukses', id, { status })
  if (error) { console.error('Gagal toggle kisah sukses:', error.message); throw new Error('Gagal mengubah status.') }
  revalidatePath('/admin/content/kisah-sukses')
}

export async function toggleKisahSuksesFeatured(id: string, featured: boolean) {
  const supabase = await checkAdminRole()
  const error = await upd(supabase, 'kisah_sukses', id, { featured })
  if (error) { console.error('Gagal toggle featured:', error.message); throw new Error('Gagal mengubah featured.') }
  revalidatePath('/admin/content/kisah-sukses')
}