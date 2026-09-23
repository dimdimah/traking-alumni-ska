'use server'

// Server actions halaman /admin/roles — kelola role & matrix role × permission.
import { revalidateTag, revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/permissions/guards'
import {
  PERMISSIONS,
  ALL_PERMISSIONS,
  DEFAULT_ROLES,
  LOCKED_ROLES,
  IMMUTABLE_PERMISSION_ROLES,
  isValidRoleName,
} from '@/lib/permissions'
import { getRoleActions } from '@/lib/permissions/can'
import type { PermissionRow, RoleRow } from '@/types/database'

export type PermissionMatrix = {
  permissions: PermissionRow[]
  roles: RoleRow[]
  // role → daftar action yang diizinkan
  roleActions: Record<string, string[]>
}

const FALLBACK_ROLES: RoleRow[] = [
  { name: 'super_user', description: 'Akses penuh ke seluruh fitur admin (dikunci)', is_locked: true, created_at: '' },
  { name: 'user', description: 'Alumni — akses dasar profil, tracer study, dan lowongan', is_locked: true, created_at: '' },
]

const isDefaultRole = (role: string): boolean => DEFAULT_ROLES.includes(role)

/** Role ada di tabel roles; fallback ke DEFAULT_ROLES jika migration 019 belum di-apply. */
async function roleExists(role: string): Promise<boolean> {
  if (isDefaultRole(role)) return true
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('roles')
      .select('name')
      .eq('name', role)
      .maybeSingle()
    if (error) return false // tabel belum ada → role custom mustahil ada
    return !!data
  } catch {
    return false
  }
}

async function loadRoles(): Promise<RoleRow[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('roles')
      .select('name, description, is_locked, created_at')
      .order('name')
    if (error || !data || data.length === 0) return FALLBACK_ROLES
    return data as RoleRow[]
  } catch {
    return FALLBACK_ROLES
  }
}

async function loadMatrix(): Promise<PermissionMatrix> {
  const admin = createAdminClient()
  const [permsRes, mapRes, roles] = await Promise.all([
    admin.from('permissions').select('id, action, description').order('action'),
    admin.from('role_permissions').select('role, permission_id'),
    loadRoles(),
  ])
  if (permsRes.error) throw new Error('Gagal memuat daftar permission')
  if (mapRes.error) throw new Error('Gagal memuat mapping role')

  const permissions = (permsRes.data || []) as PermissionRow[]
  const actionById = new Map(permissions.map((p) => [p.id, p.action]))
  const roleActions: Record<string, string[]> = {}

  for (const row of mapRes.data || []) {
    const action = actionById.get(row.permission_id)
    if (!action) continue
    if (!roleActions[row.role]) roleActions[row.role] = []
    if (!roleActions[row.role].includes(action)) roleActions[row.role].push(action)
  }

  // Pastikan semua role di roles table punya entri (default kosong = deny-all)
  const allRoles: RoleRow[] = [...roles]
  const known = new Set(allRoles.map((r) => r.name))
  for (const role of Object.keys(roleActions)) {
    if (!known.has(role)) {
      allRoles.push({ name: role, description: null, is_locked: false, created_at: '' })
      known.add(role)
    }
  }
  for (const r of allRoles) {
    if (!roleActions[r.name]) roleActions[r.name] = []
  }

  return { permissions, roles: allRoles, roleActions }
}

/** Ambil matrix lengkap — hanya user dengan permission role.manage. */
export async function getPermissionMatrix(): Promise<PermissionMatrix> {
  await requirePermission(PERMISSIONS.ROLE_MANAGE)
  return loadMatrix()
}

/** Daftar role untuk dropdown (add-user & ubah role) — cukup alumni.manage. */
export async function getRoleOptions(): Promise<RoleRow[]> {
  await requirePermission(PERMISSIONS.ALUMNI_MANAGE)
  return loadRoles()
}

/** Buat role baru (tanpa permission sampai di-centang di matrix). */
export async function createRole(name: string, description?: string | null): Promise<void> {
  await requirePermission(PERMISSIONS.ROLE_MANAGE)

  const trimmed = (name || '').trim()
  if (!isValidRoleName(trimmed)) {
    throw new Error(
      'Nama role tidak valid: huruf kecil/angka/underscore, 2–31 karakter, diawali huruf (mis. humas_staff)'
    )
  }
  if (isDefaultRole(trimmed)) {
    throw new Error('Role bawaan sistem sudah ada')
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('roles')
    .insert({ name: trimmed, description: (description || '').trim() || null, is_locked: false })

  if (error) {
    if (error.code === '23505') throw new Error('Role sudah ada')
    throw new Error(`Gagal membuat role — pastikan migration 019 sudah di-apply (${error.message})`)
  }
  revalidateTag('permissions')
}

/** Hapus role custom — ditolak untuk role bawaan / masih dipakai user. */
export async function deleteRole(name: string): Promise<void> {
  await requirePermission(PERMISSIONS.ROLE_MANAGE)

  if (LOCKED_ROLES.includes(name)) {
    throw new Error('Role bawaan sistem tidak bisa dihapus')
  }

  const admin = createAdminClient()
  const { count } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', name)
  if (count && count > 0) {
    throw new Error(`Masih dipakai ${count} user — ubah role mereka dulu lewat Manajemen Alumni`)
  }

  const { error } = await admin.from('roles').delete().eq('name', name)
  if (error) throw new Error(`Gagal menghapus role: ${error.message}`)
  revalidateTag('permissions')
}

/**
 * Ubah role user lain (Manajemen Alumni).
 * Aturan: tidak bisa ubah role sendiri; demote super_user terakhir ditolak;
 * target role harus role bawaan atau ada di tabel roles.
 */
export async function setUserRole(userId: string, newRole: string): Promise<void> {
  const { user } = await requirePermission(PERMISSIONS.ROLE_MANAGE)

  if (!userId || !newRole) throw new Error('User dan role wajib dipilih')
  if (userId === user.id) throw new Error('Tidak bisa mengubah role sendiri')

  if (!(await roleExists(newRole))) {
    throw new Error('Role tidak dikenal')
  }

  const admin = createAdminClient()

  const { data: target } = await admin
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle()
  if (!target) throw new Error('User tidak ditemukan')

  // Jaga selalu ada minimal 1 super_user (anti lockout admin)
  if (target.role === 'super_user' && newRole !== 'super_user') {
    const { count } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'super_user')
    if ((count || 0) <= 1) {
      throw new Error('Minimal harus ada 1 Super User — buat admin lain dulu sebelum menurunkan role ini')
    }
  }

  if (target.role === newRole) return

  const { error } = await admin
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
  if (error) throw new Error(`Gagal mengubah role: ${error.message}`)

  revalidatePath('/admin/alumni')
}

/**
 * Replace seluruh mapping permission untuk satu role.
 * Role dengan IMMUTABLE_PERMISSION_ROLES (super_user) dikunci selalu penuh
 * agar admin tidak terkunci dari halaman ini sendiri.
 */
export async function updateRolePermissions(role: string, actions: string[]): Promise<void> {
  await requirePermission(PERMISSIONS.ROLE_MANAGE)

  if (IMMUTABLE_PERMISSION_ROLES.includes(role)) {
    throw new Error('Role super_user dikunci dan tidak bisa diubah')
  }
  if (!(await roleExists(role))) {
    throw new Error('Role tidak dikenal')
  }

  const validActions = new Set<string>(ALL_PERMISSIONS)
  const cleaned = [...new Set(actions)].filter((a) => validActions.has(a))

  const admin = createAdminClient()

  const { data: perms, error: permErr } = await admin
    .from('permissions')
    .select('id, action')
  if (permErr) throw new Error('Gagal membaca permission')
  const idByAction = new Map((perms || []).map((p) => [p.action, p.id]))

  // Replace: delete dulu semua mapping role ini, lalu insert yang baru
  const { error: delErr } = await admin
    .from('role_permissions')
    .delete()
    .eq('role', role)
  if (delErr) throw new Error(`Gagal menghapus mapping lama: ${delErr.message}`)

  const rows = cleaned
    .map((action) => ({ role, permission_id: idByAction.get(action) }))
    .filter((r): r is { role: string; permission_id: string } => !!r.permission_id)

  if (rows.length > 0) {
    const { error: insErr } = await admin.from('role_permissions').insert(rows)
    if (insErr) throw new Error(`Gagal menyimpan mapping baru: ${insErr.message}`)
  }

  revalidateTag('permissions')
}

/**
 * Daftar permission role user yang sedang login — dipakai sidebar untuk
 * filter nav. Fail-open: error / tanpa session → null (nav tampil tanpa filter).
 */
export async function getMyPermissions(): Promise<string[] | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!profile) return null

    return await getRoleActions(profile.role)
  } catch (err) {
    console.error('getMyPermissions error:', err)
    return null
  }
}
