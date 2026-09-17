import type { Profile, Job, TrackRecord } from '@/types/database'

// Pure document builders untuk rekomendasi kerja (Content-Based Filtering).
// Module ini murni (tanpa 'use server') agar bisa dites secara sinkron.

export function buildProfileDocument(
  profile: Profile,
  trackRecords: TrackRecord[],
): string {
  const parts: string[] = []

  if (profile.program_studi) parts.push(profile.program_studi)
  if (Array.isArray(profile.skills) && profile.skills.length > 0) {
    parts.push(profile.skills.join(' '))
  }

  for (const record of trackRecords) {
    if (record.position) parts.push(record.position)
    if (record.description) parts.push(record.description)
  }

  if (Array.isArray(profile.certifications) && profile.certifications.length > 0) {
    parts.push(profile.certifications.join(' '))
  }
  if (Array.isArray(profile.job_interests) && profile.job_interests.length > 0) {
    parts.push(profile.job_interests.join(' '))
  }
  if (profile.preferred_location) parts.push(profile.preferred_location)
  if (profile.preferred_type) parts.push(profile.preferred_type)

  return parts.join(' ')
}

export function buildJobDocument(job: Job): string {
  const parts = [
    job.title,
    job.description,
    Array.isArray(job.skills) ? job.skills.join(' ') : '',
    job.location,
    job.type,
  ]

  return parts.filter(Boolean).join(' ')
}