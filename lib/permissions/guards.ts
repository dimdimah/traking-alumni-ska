// FILE: lib/permissions/guards.ts
// Guard terpusat untuk Server Action. Ganti inline `role !== 'super_user'`
// dan duplikasi checkAdminRole() dengan requirePermission(PERMISSIONS.X).
// Server-only — jangan import dari client component.
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { can } from './can'
import type { Permission } from './index'
import type { Profile } from '@/types/database'

/** Pastikan ada session; jika tidak → redirect('/login'). */
export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

/**
 * Pastikan user login DAN punya `action`.
 * - Tanpa session → redirect('/login') (sinkron dengan withAuth/middleware)
 * - Login tapi tanpa permission → throw Error('Forbidden') (sinkron dengan checkAdminRole lama)
 */
export async function requirePermission(action: Permission) {
  const { supabase, user } = await requireAuth()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: Pick<Profile, 'role'> | null }

  const role: string | null = profile?.role ?? null
  if (!role || !(await can(role, action))) {
    throw new Error('Forbidden')
  }

  return { supabase, user, profile }
}
