-- ============================================================
-- Migration 008: Add image columns + Storage bucket policy
-- ============================================================
-- Tambah kolom gambar untuk tabel konten landing page.
-- Semua kolom nullable/default '' agar tidak break data existing.
-- ============================================================

-- 1. Tambah gambar_url ke tabel berita
ALTER TABLE public.berita
  ADD COLUMN IF NOT EXISTS gambar_url text not null default '';

-- 2. Tambah icon_url ke tabel sertifikasi
--    (untuk logo provider: AWS, Google, CompTIA, dst)
ALTER TABLE public.sertifikasi
  ADD COLUMN IF NOT EXISTS icon_url text not null default '';

-- ============================================================
-- Storage bucket policy (jalankan manual di Supabase Dashboard
-- atau via SQL editor jika menggunakan storage extension):
--
-- 1. Buat bucket "content" dengan Public = true
--    di: Storage → New bucket → nama: content → Public: ON
--
-- 2. Struktur folder yang direkomendasikan:
--    content/berita/         ← gambar artikel berita
--    content/kisah-sukses/   ← foto alumni kisah sukses
--    content/sertifikasi/    ← logo/icon sertifikasi
--
-- Policy RLS storage (opsional, sudah public bucket):
-- Hanya super_user yang bisa upload/delete:
-- ============================================================

-- Storage: izinkan upload hanya untuk super_user
-- (Jalankan di SQL Editor Supabase jika storage extension aktif)
-- INSERT INTO storage.policies (name, bucket_id, definition)
-- VALUES (
--   'super_user can upload content',
--   'content',
--   'auth.jwt() ->> ''role'' = ''super_user'''
-- );
