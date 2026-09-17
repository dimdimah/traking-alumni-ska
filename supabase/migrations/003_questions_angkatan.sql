-- ============================================================
-- Migration 003: Add angkatan to tracer_study_questions
-- ============================================================
-- Setiap pertanyaan kuesioner sekarang diikat ke angkatan tertentu.
-- Admin membuat "projek" kuesioner per angkatan, dan alumni hanya
-- melihat pertanyaan yang sesuai dengan tahun lulus mereka.

-- Tambah kolom angkatan (4 digit tahun, misal: '2024')
ALTER TABLE public.tracer_study_questions
  ADD COLUMN IF NOT EXISTS angkatan VARCHAR(4) NOT NULL DEFAULT '2024';

-- Update seed questions agar punya angkatan default
UPDATE public.tracer_study_questions
  SET angkatan = '2024'
  WHERE angkatan IS NULL OR angkatan = '';
