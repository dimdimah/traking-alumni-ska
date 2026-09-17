-- Migration: 011_company_surveys.sql
-- Tabel untuk menyimpan survey penilaian alumni oleh perusahaan

CREATE TABLE IF NOT EXISTS public.company_surveys (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Data PIC / Perusahaan
  pic_name         text NOT NULL,
  company_name     text NOT NULL,
  position         text NOT NULL,
  email            text NOT NULL,

  -- Data Alumni yang dinilai
  alumni_name            text NOT NULL,
  alumni_graduation_year integer NOT NULL,
  alumni_major           text NOT NULL,

  -- Penilaian kompetensi (skala: 'sangat_baik' | 'baik' | 'cukup' | 'kurang')
  teamwork          text NOT NULL,
  it_skill          text NOT NULL,
  english           text NOT NULL,
  communication     text NOT NULL,
  self_development  text NOT NULL,
  leadership        text NOT NULL,
  work_ethic        text NOT NULL,

  -- Isian bebas
  expectation  text,
  suggestion   text,

  created_at   timestamptz DEFAULT now() NOT NULL
);

-- RLS: Publik boleh INSERT (karena diisi oleh pihak perusahaan / anonim)
ALTER TABLE public.company_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit company survey"
  ON public.company_surveys
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Hanya admin (service_role) yang bisa SELECT
CREATE POLICY "Admins can view company surveys"
  ON public.company_surveys
  FOR SELECT
  USING (auth.role() = 'service_role');
