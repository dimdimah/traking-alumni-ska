'use server'

import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export interface AlumniCard {
  id: string
  full_name: string | null
  nim: string | null
  education_level: string | null
  location: string | null
  skills: string[] | null
  bio: string | null
  phone: string | null
  email: string
  graduation_year: number | null
  employment_status: string | null
  company: string | null
  position: string | null
  current_company: string | null
  current_position: string | null
}

const getNetworkRawCached = unstable_cache(
  async (): Promise<AlumniCard[]> => {
    const adminClient = createAdminClient()
    const { data: profiles, error: profileError } = await adminClient
      .from('profiles')
      .select('id, full_name, nim, education_level, location, skills, bio, phone, email, role')
      .eq('role', 'user')
      .order('full_name', { ascending: true })
    if (profileError) throw new Error(profileError.message)
    if (!profiles || profiles.length === 0) return []
    const ids = profiles.map((p) => p.id)
    const [{ data: tracerData }, { data: trackData }] = await Promise.all([
      adminClient.from('tracer_study_responses').select('user_id, employment_status, company, position, graduation_year').in('user_id', ids),
      adminClient.from('track_records').select('user_id, company, position').in('user_id', ids).eq('is_current', true),
    ])
    const tracerMap = new Map((tracerData ?? []).map((t) => [t.user_id, t]))
    const trackMap = new Map((trackData ?? []).map((t) => [t.user_id, t]))
    return profiles.map((p) => {
      const tracer = tracerMap.get(p.id)
      const track = trackMap.get(p.id)
      let graduation_year: number | null = tracer?.graduation_year ?? null
      if (!graduation_year && p.nim && p.nim.length >= 2) {
        const prefix = parseInt(p.nim.substring(0, 2), 10)
        if (!isNaN(prefix)) graduation_year = 2000 + prefix
      }
      return {
        id: p.id,
        full_name: p.full_name,
        nim: p.nim,
        education_level: p.education_level,
        location: p.location,
        skills: p.skills,
        bio: p.bio,
        phone: p.phone,
        email: p.email,
        graduation_year,
        employment_status: tracer?.employment_status ?? null,
        company: tracer?.company ?? null,
        position: tracer?.position ?? null,
        current_company: track?.company ?? null,
        current_position: track?.position ?? null,
      }
    })
  },
  ['network-raw'],
  { revalidate: 60, tags: ['network'] }
)

export async function getNetworkAlumni(currentUserId: string | null): Promise<AlumniCard[]> {
  const all = await getNetworkRawCached()
  if (!currentUserId) return all
  return all.filter((p) => p.id !== currentUserId)
}
