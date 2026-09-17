-- Migration 015: Add scale question type to tracer_study_questions
-- Menambahkan tipe pertanyaan 'scale' (skala linier 1-5) untuk penilaian
-- kompetensi (Bagian Wajib) dan metode pembelajaran (Bagian Opsional).

ALTER TABLE public.tracer_study_questions
  DROP CONSTRAINT IF EXISTS tracer_study_questions_question_type_check;

ALTER TABLE public.tracer_study_questions
  ADD CONSTRAINT tracer_study_questions_question_type_check
  CHECK (question_type IN ('text', 'textarea', 'select', 'radio', 'number', 'checkbox', 'scale'));