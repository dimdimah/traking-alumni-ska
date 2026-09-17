-- Migration 013: Add checkbox question type to tracer_study_questions
-- Menambahkan tipe pertanyaan 'checkbox' untuk pertanyaan pilihan ganda (multiple choice)

ALTER TABLE public.tracer_study_questions
  DROP CONSTRAINT IF EXISTS tracer_study_questions_question_type_check;

ALTER TABLE public.tracer_study_questions
  ADD CONSTRAINT tracer_study_questions_question_type_check
  CHECK (question_type IN ('text', 'textarea', 'select', 'radio', 'number', 'checkbox'));