-- ============================================================
-- Migration 007: Content Tables — Berita, Sertifikasi, FAQ, Kisah Sukses
-- ============================================================

-- ============================================================
-- 1. TABLE: berita — Manajemen Berita/Artikel
-- ============================================================
create table if not exists public.berita (
  id          uuid default gen_random_uuid() primary key,
  judul       text not null,
  slug        text not null unique,
  kategori    text not null default 'Umum'
               check (kategori in ('Akademik', 'Karir', 'Kampus', 'Teknologi', 'Umum')),
  penulis     text not null,
  tanggal     date not null default current_date,
  status      text not null default 'draft'
               check (status in ('published', 'draft')),
  ringkasan   text not null,
  konten      text not null default '',
  views       integer not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create trigger set_berita_updated_at
  before update on public.berita
  for each row execute procedure public.handle_updated_at();

alter table public.berita enable row level security;

-- RLS: super_user CRUD penuh
create policy "super_user: manage berita"
  on public.berita for all
  using ( public.get_my_role() = 'super_user' );

-- RLS: semua user bisa SELECT published
create policy "all: select published berita"
  on public.berita for select
  using ( status = 'published' );

-- ============================================================
-- 2. TABLE: sertifikasi — Manajemen Sertifikasi
-- ============================================================
create table if not exists public.sertifikasi (
  id              uuid default gen_random_uuid() primary key,
  nama            text not null,
  penyelenggara   text not null,
  kategori        text not null default 'IT & Networking'
                   check (kategori in ('IT & Networking', 'Programming', 'Data Science', 'Cloud', 'Keamanan Siber', 'Manajemen')),
  level           text not null default 'Nasional'
                   check (level in ('Nasional', 'Internasional', 'Vendor')),
  durasi_valid    text not null default '',
  biaya           text not null default '',
  deskripsi       text not null default '',
  url_info        text not null default '',
  status          text not null default 'draft'
                   check (status in ('published', 'draft')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create trigger set_sertifikasi_updated_at
  before update on public.sertifikasi
  for each row execute procedure public.handle_updated_at();

alter table public.sertifikasi enable row level security;

create policy "super_user: manage sertifikasi"
  on public.sertifikasi for all
  using ( public.get_my_role() = 'super_user' );

create policy "all: select published sertifikasi"
  on public.sertifikasi for select
  using ( status = 'published' );

-- ============================================================
-- 3. TABLE: faq — Manajemen FAQ
-- ============================================================
create table if not exists public.faq (
  id          uuid default gen_random_uuid() primary key,
  pertanyaan  text not null,
  jawaban     text not null,
  kategori    text not null default 'Umum'
               check (kategori in ('Akademik', 'Karir', 'Sistem Alumni', 'Teknis', 'Umum')),
  urutan      integer not null default 0,
  aktif       boolean not null default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create trigger set_faq_updated_at
  before update on public.faq
  for each row execute procedure public.handle_updated_at();

alter table public.faq enable row level security;

create policy "super_user: manage faq"
  on public.faq for all
  using ( public.get_my_role() = 'super_user' );

create policy "all: select active faq"
  on public.faq for select
  using ( aktif = true );

-- ============================================================
-- 4. TABLE: kisah_sukses — Manajemen Kisah Sukses Alumni
-- ============================================================
create table if not exists public.kisah_sukses (
  id                uuid default gen_random_uuid() primary key,
  nama_alumni       text not null,
  angkatan          integer not null,
  prodi             text not null
                     check (prodi in ('S1 Informatika', 'S1 Teknologi Informasi', 'D3 Manajemen Informatika', 'D3 Komputerisasi Akuntansi')),
  posisi_sekarang   text not null,
  perusahaan        text not null,
  lokasi            text not null default '',
  foto_url          text not null default '',
  kutipan           text not null,
  cerita            text not null default '',
  status            text not null default 'draft'
                     check (status in ('published', 'draft')),
  featured          boolean not null default false,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create trigger set_kisah_sukses_updated_at
  before update on public.kisah_sukses
  for each row execute procedure public.handle_updated_at();

alter table public.kisah_sukses enable row level security;

create policy "super_user: manage kisah_sukses"
  on public.kisah_sukses for all
  using ( public.get_my_role() = 'super_user' );

create policy "all: select published kisah_sukses"
  on public.kisah_sukses for select
  using ( status = 'published' );