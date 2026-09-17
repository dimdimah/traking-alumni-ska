'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface VerifyResult {
  found: boolean
  full_name?: string | null
  nim?: string | null
  education_level?: string | null
  graduation_year?: number | null
}

const NIM_PATTERN = /^[A-Za-z0-9.\-/]{4,20}$/

function extractYearFromNim(nim: string): number | null {
  const digits = nim.replace(/[^0-9]/g, '')
  if (digits.length >= 2) {
    const prefix = parseInt(digits.substring(0, 2), 10)
    if (!isNaN(prefix)) return 2000 + prefix
  }
  return null
}

export async function verifyAlumni(query: string): Promise<VerifyResult[]> {
  const q = query.trim()
  if (!q) return []

  const adminClient = createAdminClient()
  const isLikelyNim = NIM_PATTERN.test(q) && /\d/.test(q)
  
  let data: { id: string; full_name: string | null; nim: string | null; education_level: string | null; graduation_year: number | null }[] = []

  // Cek by NIM terlebih dahulu
  if (isLikelyNim) {
    const { data: nimResult } = await adminClient
      .from('profiles')
      .select('id, full_name, nim, education_level, graduation_year')
      .eq('nim', q)
      .eq('role', 'user')
      .maybeSingle()
      
    if (nimResult) data = [nimResult]
  }

  // Jika tidak ditemukan by NIM, cek by nama (Pencarian mirip/Ilike)
  if (data.length === 0) {
    const { data: nameResults } = await adminClient
      .from('profiles')
      .select('id, full_name, nim, education_level, graduation_year')
      .ilike('full_name', `%${q}%`)
      .eq('role', 'user')
      .limit(5)
      
    data = nameResults ?? []
  }

  if (data.length > 0) {
    // Lookup tracer_study_responses jika graduation_year atau education_level kosong di profil
    const userIds = data.map((d) => d.id)
    const { data: tracerResponses } = await adminClient
      .from('tracer_study_responses')
      .select('user_id, graduation_year, education_level')
      .in('user_id', userIds)

    const tracerMap = new Map(
      (tracerResponses || []).map((t) => [t.user_id, t])
    )

    return data.map((d) => {
      const tracer = tracerMap.get(d.id)
      const gradYear = d.graduation_year ?? tracer?.graduation_year ?? (d.nim ? extractYearFromNim(d.nim) : null)
      const eduLevel = d.education_level ?? tracer?.education_level ?? null

      return {
        found: true,
        full_name: d.full_name,
        nim: d.nim,
        education_level: eduLevel,
        graduation_year: gradYear,
      }
    })
  }

  return []
}
