'use server'

import { createClient } from '@/lib/supabase/server'
import type { Profile, TrackRecord, SistemAlumniResponse } from '@/types/database'

export interface CvData {
  profile: Profile
  trackRecords: TrackRecord[]
  SistemAlumni: SistemAlumniResponse | null
}

export async function getCvData(): Promise<CvData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Destructure directly to avoid Supabase discriminated union narrowing issue
  // (same pattern used in lib/actions/matching.ts)
  const [
    { data: profile },
    { data: trackRecords },
    { data: SistemAlumni },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('track_records')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false }),
    supabase
      .from('tracer_study_responses')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (!profile) {
    console.error('getCvData: profil tidak ditemukan untuk user:', user.id)
    return null
  }

  return {
    profile: profile as Profile,
    trackRecords: (trackRecords ?? []) as TrackRecord[],
    SistemAlumni: (SistemAlumni ?? null) as SistemAlumniResponse | null,
  }
}
