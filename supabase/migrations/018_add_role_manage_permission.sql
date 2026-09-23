-- Migration 018: Tambah permission role.manage (halaman /admin/roles)
-- Idempotent — aman di-run ulang.

insert into public.permissions (action, description)
values ('role.manage', 'Kelola role & permission (matrix akses)')
on conflict (action) do nothing;

insert into public.role_permissions (role, permission_id)
select 'super_user', id from public.permissions
where action = 'role.manage'
on conflict do nothing;
