// FILE: utils/get-role.ts
import { createClient } from '@/lib/supabase/server'
import type { AppRole, Profile } from '@/types/database'

/**
 * Ambil role user yang sedang login (server-side).
 * Return null jika tidak ada session.
 */
export async function getUserRole(): Promise<AppRole | null> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: Profile | null; error: unknown }

  if (profileError || !profile) return null

  return profile.role
}

/**
 * Ambil profile lengkap user yang sedang login.
 * Return null jika tidak ada session.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: Profile | null }

  return profile
}
