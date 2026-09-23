-- Migration 016: Fix tracer_study_responses.study_field_match type
-- Kolom ini sempat diduga ter-drift menjadi BOOLEAN di database live.
-- FAKTA (verified 2026-09-23): kolom live SUDAH text — run pertama gagal
-- dengan "operator does not exist: text = boolean".
-- Versi ini di-guard: hanya konversi jika masih boolean, otherwise no-op.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tracer_study_responses'
      AND column_name = 'study_field_match'
      AND data_type = 'boolean'
  ) THEN
    ALTER TABLE public.tracer_study_responses
      ALTER COLUMN study_field_match TYPE text
      USING CASE
        WHEN study_field_match IS NULL THEN NULL
        WHEN study_field_match = true THEN 'Sesuai'
        ELSE 'Tidak Sesuai'
      END;
  END IF;
END $$;
