-- Migration 019: Dynamic roles (phase 3, opsi B)
-- Tabel roles generik, konversi enum app_role → text, RLS profiles berbasis permission.
-- Nilai data TIDAK berubah: 'super_user' & 'user' tetap, semua profil existing aman.
-- Fitur role baru hanya aktif ketika admin membuat role + menugaskan user baru.

-- ─── 1. Tabel roles ───
create table if not exists public.roles (
  name        text primary key check (name ~ '^[a-z][a-z0-9_]{1,30}$'),
  description text,
  is_locked   boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.roles enable row level security;
-- Tanpa policy → hanya service_role (createAdminClient) yang baca/tulis,
-- konsisten dengan permissions & role_permissions.

insert into public.roles (name, description, is_locked) values
  ('super_user', 'Akses penuh ke seluruh fitur admin (dikunci)', true),
  ('user',       'Alumni — akses dasar profil, tracer study, dan lowongan', true)
on conflict (name) do nothing;

-- ─── 2. Konversi profiles.role: enum → text ───
-- Policy "user: update own profile" punya WITH CHECK yang mereferensikan
-- kolom role → Postgres menolak ALTER TYPE selama policy ada (error 0A000).
-- Drop dulu, recreate identik di langkah akhir (setelah kolom jadi text).
drop policy if exists "user: update own profile" on public.profiles;

alter table public.profiles alter column role drop default;
alter table public.profiles alter column role type text using role::text;
alter table public.profiles alter column role set default 'user';
alter table public.profiles alter column role set not null;

alter table public.profiles
  add constraint profiles_role_fkey
  foreign key (role) references public.roles (name)
  on update cascade on delete restrict;

-- ─── 3. Konversi role_permissions.role: enum → text + FK ───
alter table public.role_permissions alter column role type text using role::text;

alter table public.role_permissions
  add constraint role_permissions_role_fkey
  foreign key (role) references public.roles (name)
  on update cascade on delete cascade;

-- ─── 4. Drop enum (tidak ada dependensi tersisa) ───
drop type if exists public.app_role;

-- ─── 5. Recreate helper functions di atas kolom text ───
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

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

-- ─── 6. RLS profiles: super_user-only → permission-based ───
-- super_user tetap lolos karena memegang seluruh permission (seed 017).
-- Role custom dengan alumni.manage kini bisa baca daftar alumni;
-- role tanpa alumni.manage tetap hanya lihat profilnya sendiri.
drop policy if exists "super_user: select all profiles" on public.profiles;
drop policy if exists "super_user: update all profiles" on public.profiles;
drop policy if exists "super_user: delete other profiles" on public.profiles;

create policy "admin: select all profiles"
  on public.profiles for select
  using ( public.has_permission('alumni.manage') );

-- WITH CHECK: role tetap 'user' boleh untuk admin biasa (alumni.manage);
-- elevasi role lain (super_user / role custom) wajib pegang role.manage
-- → cegah privilege-escalation via update langsung dari browser client.
create policy "admin: update all profiles"
  on public.profiles for update
  using ( public.has_permission('alumni.manage') )
  with check (
    public.has_permission('alumni.manage')
    and (role = 'user' or public.has_permission('role.manage'))
  );

create policy "admin: delete other profiles"
  on public.profiles for delete
  using ( public.has_permission('alumni.manage') and id != auth.uid() );

-- Policy lama untuk profil sendiri: "user: select own profile" tidak tersentuh
-- (tidak mereferensikan role). "user: update own profile" di-drop di awal
-- langkah 2 karena menghalangi ALTER TYPE → recreate di sini, definisi identik
-- (role kini text; WITH CHECK tetap mencegah user ganti role-nya sendiri).
create policy "user: update own profile"
  on public.profiles for update
  using ( auth.uid() = id )
  with check ( role = (select role from public.profiles where id = auth.uid()) );
