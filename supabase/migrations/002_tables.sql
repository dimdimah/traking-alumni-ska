-- ============================================================
-- Migration 002: Track Records, Tracer Study, Jobs
-- ============================================================

-- ============================================================
-- 1. TABLE: track_records — Riwayat Kerja Alumni
-- ============================================================
create table if not exists public.track_records (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  company     text not null,
  position    text not null,
  start_date  date not null,
  end_date    date,
  description text,
  is_current  boolean not null default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create trigger set_track_records_updated_at
  before update on public.track_records
  for each row execute procedure public.handle_updated_at();

alter table public.track_records enable row level security;

-- RLS: user manage own records
create policy "user: manage own track records"
  on public.track_records for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- RLS: super_user bisa SELECT semua
create policy "super_user: select all track records"
  on public.track_records for select
  using ( public.get_my_role() = 'super_user' );

-- ============================================================
-- 2. TABLE: tracer_study_responses — Jawaban Kuesioner Alumni
-- ============================================================
create table if not exists public.tracer_study_responses (
  id                  uuid default gen_random_uuid() primary key,
  user_id             uuid not null references public.profiles(id) on delete cascade unique,
  graduation_year     integer not null,
  education_level     text not null,
  employment_status   text not null,
  company             text,
  position            text,
  salary_range        text,
  study_field_match   text,  -- nilai deskriptif: 'Sangat Sesuai','Sesuai','Kurang Sesuai','Tidak Sesuai'
  suggestions         text,
  submitted_at        timestamptz default now(),
  updated_at          timestamptz default now()
);

create trigger set_tracer_study_responses_updated_at
  before update on public.tracer_study_responses
  for each row execute procedure public.handle_updated_at();

alter table public.tracer_study_responses enable row level security;

-- RLS: user bisa INSERT/UPDATE response milik sendiri (unique constraint → max 1)
create policy "user: manage own tracer study response"
  on public.tracer_study_responses for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- RLS: super_user bisa SELECT semua
create policy "super_user: select all tracer study responses"
  on public.tracer_study_responses for select
  using ( public.get_my_role() = 'super_user' );

-- ============================================================
-- 3. TABLE: tracer_study_questions — Manajemen Pertanyaan (Admin)
-- ============================================================
create table if not exists public.tracer_study_questions (
  id            uuid default gen_random_uuid() primary key,
  question_text text not null,
  question_type text not null default 'text'
                 check (question_type in ('text', 'textarea', 'select', 'radio', 'number')),
  options       jsonb,
  is_active     boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create trigger set_tracer_study_questions_updated_at
  before update on public.tracer_study_questions
  for each row execute procedure public.handle_updated_at();

alter table public.tracer_study_questions enable row level security;

-- RLS: super_user CRUD penuh
create policy "super_user: manage questions"
  on public.tracer_study_questions for all
  using ( public.get_my_role() = 'super_user' );

-- RLS: user SELECT pertanyaan aktif saja
create policy "user: select active questions"
  on public.tracer_study_questions for select
  using ( is_active = true );

-- ============================================================
-- 4. TABLE: jobs — Lowongan Kerja (Career Center)
-- ============================================================
create table if not exists public.jobs (
  id            uuid default gen_random_uuid() primary key,
  title         text not null,
  company       text not null,
  location      text not null,
  type          text not null default 'Full-time'
                 check (type in ('Full-time', 'Part-time', 'Contract', 'Internship')),
  salary        text,
  description   text not null,
  skills        jsonb default '[]'::jsonb,
  contact_info  text,
  is_active     boolean not null default true,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create trigger set_jobs_updated_at
  before update on public.jobs
  for each row execute procedure public.handle_updated_at();

alter table public.jobs enable row level security;

-- RLS: super_user CRUD penuh
create policy "super_user: manage jobs"
  on public.jobs for all
  using ( public.get_my_role() = 'super_user' );

-- RLS: user SELECT lowongan aktif saja
create policy "user: select active jobs"
  on public.jobs for select
  using ( is_active = true );

-- ============================================================
-- 5. Seed: contoh pertanyaan kuesioner default
-- ============================================================
insert into public.tracer_study_questions (question_text, question_type, options, display_order) values
  ('Tahun Berapa Anda Lulus?', 'number', null, 1),
  ('Apa Pendidikan Terakhir Anda?', 'select', '["D3", "S1", "S2", "S3"]', 2),
  ('Apa Status Pekerjaan Anda Saat Ini?', 'select', '["Bekerja", "Belum Bekerja", "Wirausaha", "Melanjutkan Studi", "Tidak bekerja / Mencari pekerjaan"]', 3),
  ('Di Mana Anda Bekerja Saat Ini?', 'text', null, 4),
  ('Apa Posisi/Jabatan Anda?', 'text', null, 5),
  ('Berapa Kisaran Gaji Anda?', 'select', '["< 3 juta", "3-5 juta", "5-10 juta", "10-20 juta", "> 20 juta"]', 6),
  ('Apakah Pekerjaan Anda Sesuai dengan Bidang Studi?', 'radio', '["Sangat Sesuai", "Sesuai", "Kurang Sesuai", "Tidak Sesuai"]', 7),
  ('Kritik dan Saran untuk Almamater', 'textarea', null, 8)
on conflict do nothing;
