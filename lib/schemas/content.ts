import { z } from 'zod'

export const beritaSchema = z.object({
  judul: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi').regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip'),
  kategori: z.enum(['Akademik', 'Karir', 'Kampus', 'Teknologi', 'Umum']),
  penulis: z.string().min(1, 'Penulis wajib diisi'),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  status: z.enum(['published', 'draft']).default('draft'),
  ringkasan: z.string().min(1, 'Ringkasan wajib diisi'),
  konten: z.string().default(''),
  gambar_url: z.string().default(''),
})

export type BeritaFormData = z.infer<typeof beritaSchema>

export const sertifikasiSchema = z.object({
  nama: z.string().min(1, 'Nama sertifikasi wajib diisi'),
  penyelenggara: z.string().min(1, 'Penyelenggara wajib diisi'),
  kategori: z.enum(['IT & Networking', 'Programming', 'Data Science', 'Cloud', 'Keamanan Siber', 'Manajemen']),
  level: z.enum(['Nasional', 'Internasional', 'Vendor']),
  durasi_valid: z.string().default(''),
  biaya: z.string().default(''),
  deskripsi: z.string().default(''),
  url_info: z.string().default(''),
  icon_url: z.string().default(''),
  status: z.enum(['published', 'draft']).default('draft'),
})

export type SertifikasiFormData = z.infer<typeof sertifikasiSchema>

export const faqSchema = z.object({
  pertanyaan: z.string().min(1, 'Pertanyaan wajib diisi'),
  jawaban: z.string().min(1, 'Jawaban wajib diisi'),
  kategori: z.enum(['Akademik', 'Karir', 'Sistem Alumni', 'Teknis', 'Umum']),
  urutan: z.coerce.number().int().min(0).default(0),
  aktif: z.boolean().default(true),
})

export type FaqFormData = z.infer<typeof faqSchema>

export const kisahSuksesSchema = z.object({
  nama_alumni: z.string().min(1, 'Nama alumni wajib diisi'),
  angkatan: z.coerce.number().int().min(2000, 'Angkatan minimal 2000'),
  prodi: z.enum(['S1 Informatika', 'S1 Teknologi Informasi', 'D3 Manajemen Informatika', 'D3 Komputerisasi Akuntansi']),
  posisi_sekarang: z.string().min(1, 'Posisi wajib diisi'),
  perusahaan: z.string().min(1, 'Perusahaan wajib diisi'),
  lokasi: z.string().default(''),
  foto_url: z.string().default(''),
  kutipan: z.string().min(1, 'Kutipan wajib diisi'),
  cerita: z.string().default(''),
  status: z.enum(['published', 'draft']).default('draft'),
  featured: z.boolean().default(false),
})

export type KisahSuksesFormData = z.infer<typeof kisahSuksesSchema>