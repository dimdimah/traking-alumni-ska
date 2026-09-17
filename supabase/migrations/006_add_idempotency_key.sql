-- ============================================================
-- Migration 006: Add idempotency_key to track_records
-- ============================================================
-- Mencegah duplikasi data akibat double-submit / network retry.
-- Nilai NULL diizinkan untuk records lama (tidak di-backfill).

ALTER TABLE public.track_records
  ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;
