-- ============================================================
-- SITRACK — Full Database Schema
-- Gabungan dari 001–005 dalam satu file.
-- ============================================================

-- ============================================================
-- 001: Role-Based Access Control & Profiles
-- ============================================================

-- 1. Enum role
create type public.app_role as enum ('super_user', 'user');

-- 2. Tabel profiles
create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  email         text not null,
  role          public.app_role not null default 'user',
  full_name     text,
  nim           text unique,
  tanggal_lahir date,
  phone         text,
  bio           text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 3. Trigger: auto-insert profile saat user register
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Trigger: auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- 5. Enable RLS
alter table public.profiles enable row level security;

-- 6. Helper: ambil role dari uid
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
as $$
  select role::text from public.profiles where id = auth.uid();
$$;

-- 7. RLS Policies — Profiles
create policy "super_user: select all profiles"
  on public.profiles for select
  using ( public.get_my_role() = 'super_user' );

create policy "super_user: update all profiles"
  on public.profiles for update
  using ( public.get_my_role() = 'super_user' );

create policy "super_user: delete other profiles"
  on public.profiles for delete
  using ( public.get_my_role() = 'super_user' and id != auth.uid() );

create policy "user: select own profile"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "user: update own profile"
  on public.profiles for update
  using ( auth.uid() = id )
  with check ( role = (select role from public.profiles where id = auth.uid()) );


-- ============================================================
-- 002: Track Records, Tracer Study, Jobs
-- ============================================================

-- 1. TABLE: track_records
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

create policy "user: manage own track records"
  on public.track_records for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

create policy "super_user: select all track records"
  on public.track_records for select
  using ( public.get_my_role() = 'super_user' );

-- 2. TABLE: tracer_study_responses
create table if not exists public.tracer_study_responses (
  id                  uuid default gen_random_uuid() primary key,
  user_id             uuid not null references public.profiles(id) on delete cascade unique,
  graduation_year     integer not null,
  education_level     text not null,
  employment_status   text not null,
  company             text,
  position            text,
  salary_range        text,
  study_field_match   text,
  suggestions         text,
  submitted_at        timestamptz default now(),
  updated_at          timestamptz default now()
);

create trigger set_tracer_study_responses_updated_at
  before update on public.tracer_study_responses
  for each row execute procedure public.handle_updated_at();

alter table public.tracer_study_responses enable row level security;

create policy "user: manage own tracer study response"
  on public.tracer_study_responses for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

create policy "super_user: select all tracer study responses"
  on public.tracer_study_responses for select
  using ( public.get_my_role() = 'super_user' );

-- 3. TABLE: tracer_study_questions
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

create policy "super_user: manage questions"
  on public.tracer_study_questions for all
  using ( public.get_my_role() = 'super_user' );

create policy "user: select active questions"
  on public.tracer_study_questions for select
  using ( is_active = true );

-- 4. TABLE: jobs
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

create policy "super_user: manage jobs"
  on public.jobs for all
  using ( public.get_my_role() = 'super_user' );

create policy "user: select active jobs"
  on public.jobs for select
  using ( is_active = true );

-- 5. Seed: contoh pertanyaan kuesioner default
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


-- ============================================================
-- 003: Add angkatan to tracer_study_questions
-- ============================================================

ALTER TABLE public.tracer_study_questions
  ADD COLUMN IF NOT EXISTS angkatan VARCHAR(4) NOT NULL DEFAULT '2024';

UPDATE public.tracer_study_questions
  SET angkatan = '2024'
  WHERE angkatan IS NULL OR angkatan = '';


-- ============================================================
-- 004: Add matching fields to profiles
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS education_level text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS expected_salary text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_type text;


-- ============================================================
-- 005: Add url and source to jobs
-- ============================================================

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS url text;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS source text default 'Internal';
