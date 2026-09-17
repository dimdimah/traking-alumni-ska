-- ============================================================
-- Migration 005: Add url and source to jobs
-- ============================================================
-- Kolom untuk link pendaftaran dan sumber lowongan.
-- Dibuat optional agar tidak break data yang sudah ada.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS url text;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS source text default 'Internal';
