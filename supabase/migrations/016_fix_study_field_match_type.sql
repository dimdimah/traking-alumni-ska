-- Migration 016: Fix tracer_study_responses.study_field_match type
-- Kolom ini sempat ter-drift menjadi BOOLEAN di database live, padahal sesuai
-- migrasi 000/002 dan seluruh kode (types, analytics, export, history snapshot)
-- seharusnya TEXT berisi nilai deskriptif seperti 'Sangat Erat' / 'Sesuai'.
-- Data lama (jika boola) dipetakan ke teks deskriptif.

ALTER TABLE public.tracer_study_responses
  ALTER COLUMN study_field_match TYPE text
  USING CASE
    WHEN study_field_match IS NULL THEN NULL
    WHEN study_field_match = true THEN 'Sesuai'
    ELSE 'Tidak Sesuai'
  END;
