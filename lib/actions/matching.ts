'use server'

import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Profile, Job, MatchResult, TrackRecord, MatchDebugPayload, JobMatchDebug, JobDocSample, ProfileSourceField } from '@/types/database'
import { preprocess } from '@/lib/preprocessing'
import { computeSimilarityScores, computeIDF, computeMatchBreakdown, computeCosineBreakdown } from '@/lib/tfidf'
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

// ─── Diagnostic matching (mode debug ?debug=1 di /user/rekomendasi) ───
// Selalu fresh (tanpa cache) agar pantauan akurat saat menyetel ulang profil
// atau saat lowongan baru masuk. Collect IDF yang sama persis dengan perhitungan
// skor asli sehingga breakdown tokennya konsisten dengan urutan rekomendasi.
export async function getMatchDebug(): Promise<MatchDebugPayload> {
  const { user } = await getCachedAuthUser()
  if (!user) throw new Error('User tidak terautentikasi')

  const supabase = createAdminClient()
  const [{ data: profile }, jobs, { data: trackRecords }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    getAllActiveJobsCached(),
    supabase.from('track_records').select('position, company, description').eq('user_id', user.id),
  ])
  if (!profile || !jobs || jobs.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      totalJobs: jobs ? jobs.length : 0,
      profileSource: buildProfileSource(profile ?? null, []),
      profileRaw: '',
      profileTokens: [],
      jobSamples: [],
      entries: [],
    }
  }

  const typedProfile = profile as Profile
  const typedJobs = jobs as Job[]
  const typedRecords = (trackRecords || []) as TrackRecord[]
  const profileRaw = buildProfileDocument(typedProfile, typedRecords)
  const profileTokens = preprocess(profileRaw)
  const allJobTokens = typedJobs.map(job => preprocess(buildJobDocument(job)))

  const idf = computeIDF([profileTokens, ...allJobTokens])
  const scores = computeSimilarityScores(profileTokens, allJobTokens)

  const entries: JobMatchDebug[] = typedJobs.map((job, index) => {
    const breakDown = computeCosineBreakdown(profileTokens, allJobTokens[index], idf)
    return {
      jobId: job.id,
      title: job.title,
      company: job.company,
      location: job.location ?? null,
      score: scores[index] ?? breakDown.score,
      jobTokens: allJobTokens[index],
      matchedTerms: computeMatchBreakdown(profileTokens, allJobTokens[index], idf),
      cosine: breakDown,
    }
  }).sort((a, b) => b.score - a.score)

  // Semua lowongan sesuai urutan di database (bukan skor) — panel preprocessing
  // menampilkan alur pengolahan tiap lowongan sesuai urutan datanya, bukan hasil ranking.
  const jobSamples: JobDocSample[] = typedJobs.map((job, index) => ({
    title: job.title,
    company: job.company,
    raw: buildJobDocument(job),
    tokens: allJobTokens[index],
    score: scores[index] ?? 0,
    fields: {
      title: job.title,
      description: job.description ?? '',
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : '',
      location: job.location ?? '',
      type: job.type ?? '',
    },
  }))

  return {
    generatedAt: new Date().toISOString(),
    totalJobs: typedJobs.length,
    profileSource: buildProfileSource(profile, typedRecords),
    profileRaw,
    profileTokens,
    jobSamples,
    entries,
  }
}

function buildProfileSource(
  profile: Profile | null,
  trackRecords: TrackRecord[],
): ProfileSourceField[] {
  if (!profile) return []
  const formatArray = (value: string[] | null | undefined): string | null => {
    if (!value || value.length === 0) return null
    return value.join(', ')
  }
  const recordText = trackRecords
    .map(r => [r.position, r.company].filter(Boolean).join(' — '))
    .filter(Boolean)
    .join(' | ')
  return [
    { label: 'Program Studi', value: profile.program_studi ?? null },
    { label: 'Skill / Keahlian', value: formatArray(profile.skills) },
    { label: 'Pengalaman Kerja (Track Record)', value: recordText || null },
    { label: 'Sertifikasi', value: formatArray(profile.certifications) },
    { label: 'Bidang / Posisi Diminati', value: formatArray(profile.job_interests) },
    { label: 'Preferensi Lokasi', value: profile.preferred_location ?? null },
    { label: 'Tipe Pekerjaan', value: profile.preferred_type ?? null },
  ]
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
