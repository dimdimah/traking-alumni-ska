// FILE: lib/permissions/can.ts
// Resolve permission role → daftar action via tabel role_permissions (DB),
// di-cache 5 menit dengan tag 'permissions'. Fallback ke ROLE_PERMISSIONS
// di kode jika migration 017 belum di-apply / query gagal.
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { ROLE_PERMISSIONS, type Permission } from './index'

const fetchRolePermissions = async (): Promise<Record<string, string[]>> => {
  try {
    const admin = createAdminClient()
    const [permsRes, rolePermsRes] = await Promise.all([
      admin.from('permissions').select('id, action'),
      admin.from('role_permissions').select('role, permission_id'),
    ])
    if (permsRes.error) throw new Error(permsRes.error.message)
    if (rolePermsRes.error) throw new Error(rolePermsRes.error.message)

    const actionById = new Map((permsRes.data || []).map((p) => [p.id, p.action]))
    const map: Record<string, string[]> = {}
    for (const rp of rolePermsRes.data || []) {
      const action = actionById.get(rp.permission_id)
      if (!action) continue
      if (!map[rp.role]) map[rp.role] = []
      map[rp.role].push(action)
    }
    return map
  } catch (err) {
    console.error('role_permissions fetch fallback:', err)
    const fallback: Record<string, string[]> = {}
    for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
      fallback[role] = [...perms]
    }
    return fallback
  }
}

const getRolePermissionsCached = unstable_cache(
  fetchRolePermissions,
  ['role-permissions'],
  { revalidate: 300, tags: ['permissions'] }
)

/**
 * Apakah role ini punya permission `action`?
 * Default-deny: role tanpa mapping → false.
 */
export async function can(
  role: string | null | undefined,
  action: Permission
): Promise<boolean> {
  if (!role) return false
  const map = await getRolePermissionsCached()
  return (map[role] ?? []).includes(action)
}

/**
 * Daftar semua action yang dimiliki role (dari cache yang sama dengan can()).
 */
export async function getRoleActions(role: string | null | undefined): Promise<string[]> {
  if (!role) return []
  const map = await getRolePermissionsCached()
  return map[role] ?? []
}
