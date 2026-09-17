-- ============================================================
-- Migration 014: Add extended recommendation profile fields
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS program_studi text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS job_interests jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_location text;
