-- ============================================================
-- Migration 001: Role-Based Access Control & Profiles
-- ============================================================

-- 1. Enum role
create type public.app_role as enum ('super_user', 'user');

-- 2. Tabel profiles (sync dengan types/database.ts → Profile)
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

-- 3. Trigger: auto-insert profile saat user register (role selalu 'user', tidak dari metadata client)
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

-- 6. Helper: ambil role dari uid (security definer → hindari infinite recursion)
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
