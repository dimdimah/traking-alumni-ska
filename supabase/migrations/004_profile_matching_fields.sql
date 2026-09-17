-- ============================================================
-- Migration 004: Add matching fields to profiles
-- ============================================================
-- Menambahkan field yang dibutuhkan untuk content-based filtering
-- agar profil alumni bisa dicocokkan dengan lowongan pekerjaan.

-- Skills alumni (array of skill names)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb;

-- Lokasi domisili / preferensi lokasi kerja
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location text;

-- Tingkat pendidikan (S1, S2, S3, D3, SMA, dll)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS education_level text;

-- Range gaji yang diharapkan (misal: "5-8 juta", "8-12 juta")
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS expected_salary text;

-- Tipe pekerjaan yang diinginkan (Full-time, Part-time, Contract, Internship)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_type text;
