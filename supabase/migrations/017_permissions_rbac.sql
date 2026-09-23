-- Migration 017: Permission management (Spatie-style hybrid, phase 1)
-- Definisi permission ada di kode (lib/permissions/index.ts);
-- mapping role → permission di DB supaya bisa diubah tanpa deploy.
-- Nilai enum app_role lama ('super_user', 'user') TIDAK diubah — aman untuk data produksi.

create table if not exists public.permissions (
  id          uuid primary key default gen_random_uuid(),
  action      text not null unique,
  description text
);

create table if not exists public.role_permissions (
  role          public.app_role not null,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role, permission_id)
);

-- RLS: tanpa policy untuk authenticated → hanya service_role (bypass RLS)
-- yang bisa baca/tulis. App memakai createAdminClient() untuk resolve permission.
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

-- Helper untuk RLS masa depan & pemeriksaan server-side.
-- security definer: aman dipanggil dari policy tanpa infinite recursion.
create or replace function public.has_permission(perm text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.role_permissions rp on rp.role = p.role
    join public.permissions pm on pm.id = rp.permission_id
    where p.id = auth.uid()
      and pm.action = perm
  );
$$;

revoke execute on function public.has_permission(text) from public, anon;
grant execute on function public.has_permission(text) to authenticated, service_role;

-- ─── Seed permissions (harus sinkron dengan lib/permissions/index.ts) ───
insert into public.permissions (action, description) values
  ('alumni.manage',       'Kelola akun alumni (tambah, import CSV, reset password, hapus)'),
  ('job.manage',          'Kelola lowongan kerja (CRUD + toggle status)'),
  ('content.manage',      'Kelola konten (berita, sertifikasi, FAQ, kisah sukses, upload gambar)'),
  ('question.manage',     'Kelola pertanyaan kuesioner tracer study (CRUD + template)'),
  ('export.run',          'Export data ke Excel'),
  ('survey.view',         'Lihat data survey perusahaan'),
  ('profile.edit',        'Edit profil sendiri'),
  ('track_record.manage', 'Kelola riwayat kerja sendiri'),
  ('tracer_study.submit', 'Isi kuesioner tracer study'),
  ('job.view',            'Lihat lowongan kerja')
on conflict (action) do nothing;

-- super_user: semua permission (identik dengan perilaku lama)
insert into public.role_permissions (role, permission_id)
select 'super_user', id from public.permissions
on conflict do nothing;

-- user (alumni): hanya permission dasar milik sendiri
insert into public.role_permissions (role, permission_id)
select 'user', id from public.permissions
where action in ('profile.edit', 'track_record.manage', 'tracer_study.submit', 'job.view')
on conflict do nothing;
