'use server'

import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Profile, Job, MatchResult, TrackRecord } from '@/types/database'
import { preprocess } from '@/lib/preprocessing'
import { computeSimilarityScores } from '@/lib/tfidf'
import { buildProfileDocument, buildJobDocument } from '@/lib/recommendation-docs'

// Cache dalam satu request agar CareerPage + RekomendasiCard tidak double-fetch (auth & jobs)
const getCachedAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
})

const getAllActiveJobsUncached = async (): Promise<Job[]> => {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('jobs')
    .select('id, title, company, location, type, salary, description, skills, contact_info, url, is_active, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  return (data || []) as Job[]
}

const getAllActiveJobsCached = unstable_cache(getAllActiveJobsUncached, ['all-active-jobs'], { revalidate: 30, tags: ['jobs'] })

export const getCachedActiveJobs = cache(async (): Promise<Job[]> => {
  return getAllActiveJobsCached()
})

const getRecommendationsForUser = unstable_cache(
  async (userId: string, limit: number): Promise<MatchResult[]> => {
    const supabase = createAdminClient()
    const [{ data: profile }, { data: trackRecords }, jobs] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('track_records').select('*').eq('user_id', userId),
      getAllActiveJobsCached(),
    ])
    if (!profile) throw new Error('Profil alumni tidak ditemukan')
    if (!jobs || jobs.length === 0) throw new Error('Tidak ada lowongan aktif. Total lowongan di database: 0')
    const typedProfile = profile as Profile
    const typedTrackRecords = (trackRecords || []) as TrackRecord[]
    const typedJobs = jobs as Job[]
    const profileRaw = buildProfileDocument(typedProfile, typedTrackRecords)
    const profileTokens = preprocess(profileRaw)
    const jobTokens = typedJobs.map(job => preprocess(buildJobDocument(job)))
    const similarityScores = computeSimilarityScores(profileTokens, jobTokens)
    const results: MatchResult[] = typedJobs.map((job, index) => ({ job, score: similarityScores[index] ?? 0 }))
    return results.sort((a, b) => b.score - a.score).slice(0, limit)
  },
  ['job-recommendations'],
  { revalidate: 60, tags: ['matching'] }
)

export async function getJobRecommendations(
  limit: number = 10,
): Promise<MatchResult[]> {
  const { user } = await getCachedAuthUser()
  if (!user) throw new Error('User tidak terautentikasi')
  return getRecommendationsForUser(user.id, limit)
}

const getMatchingStatsCached = unstable_cache(
  async (): Promise<{
    totalAlumni: number
    withProgramStudi: number
    withSkills: number
    withTrackRecords: number
    withCertifications: number
    withJobInterests: number
    withPreferredLocation: number
    withPreferredType: number
    completeProfile: number
  }> => {
  const supabase = createAdminClient()

  const [{ data: profiles }, { data: trackRecords }] = await Promise.all([
    supabase.from('profiles').select(`
      program_studi,
      skills,
      certifications,
      job_interests,
      preferred_location,
      preferred_type
    `).eq('role', 'user'),
    supabase.from('track_records').select('user_id'),
  ])

  const typedProfiles = (profiles || []) as Pick<
    Profile,
    | 'id'
    | 'program_studi'
    | 'skills'
    | 'certifications'
    | 'job_interests'
    | 'preferred_location'
    | 'preferred_type'
  >[]
  const recordUserIds = new Set(
    (trackRecords || []).map(record => record.user_id),
  )

  const countField = (value: unknown) =>
    Array.isArray(value) ? value.length > 0 : typeof value === 'string' && value.trim().length > 0

  let withProgramStudi = 0
  let withSkills = 0
  let withTrackRecords = 0
  let withCertifications = 0
  let withJobInterests = 0
  let withPreferredLocation = 0
  let withPreferredType = 0
  let completeProfile = 0

  for (const profileItem of typedProfiles) {
    const hasProgramStudi = countField(profileItem.program_studi)
    const hasSkills = countField(profileItem.skills)
    const hasTrackRecords = recordUserIds.has(profileItem.id ?? '')
    const hasCertifications = countField(profileItem.certifications)
    const hasJobInterests = countField(profileItem.job_interests)
    const hasPreferredLocation = countField(profileItem.preferred_location)
    const hasPreferredType = countField(profileItem.preferred_type)

    if (hasProgramStudi) withProgramStudi++
    if (hasSkills) withSkills++
    if (hasTrackRecords) withTrackRecords++
    if (hasCertifications) withCertifications++
    if (hasJobInterests) withJobInterests++
    if (hasPreferredLocation) withPreferredLocation++
    if (hasPreferredType) withPreferredType++
    if (
      hasProgramStudi &&
      hasSkills &&
      hasTrackRecords &&
      hasCertifications &&
      hasJobInterests &&
      hasPreferredLocation &&
      hasPreferredType
    ) {
      completeProfile++
    }
  }

  return {
    totalAlumni: typedProfiles.length,
    withProgramStudi,
    withSkills,
    withTrackRecords,
    withCertifications,
    withJobInterests,
    withPreferredLocation,
    withPreferredType,
    completeProfile,
  }
  },
  ['matching-stats'],
  { revalidate: 60, tags: ['matching'] }
)

export async function getMatchingStats(): Promise<{
  totalAlumni: number
  withProgramStudi: number
  withSkills: number
  withTrackRecords: number
  withCertifications: number
  withJobInterests: number
  withPreferredLocation: number
  withPreferredType: number
  completeProfile: number
}> {
  return getMatchingStatsCached()
}
