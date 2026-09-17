import type { Profile, TrackRecord } from '@/types/database'

const RECOMMENDATION_FIELDS = [
  { key: 'program_studi', label: 'Program Studi' },
  { key: 'skills', label: 'Skill / Keahlian' },
  { key: 'track_records', label: 'Pengalaman Kerja' },
  { key: 'certifications', label: 'Sertifikasi Kompetensi' },
  { key: 'job_interests', label: 'Bidang / Posisi Pekerjaan yang Diminati' },
  { key: 'preferred_location', label: 'Preferensi Lokasi Kerja' },
  { key: 'preferred_type', label: 'Tipe Pekerjaan yang Diinginkan' },
] as const

function isFieldFilled(
  key: typeof RECOMMENDATION_FIELDS[number]['key'],
  profile: Profile,
  trackRecords: TrackRecord[],
): boolean {
  if (key === 'track_records') return trackRecords.length > 0

  const value = profile[key as keyof Profile]
  if (Array.isArray(value)) return value.length > 0
  return typeof value === 'string' && value.trim().length > 0
}

export function calculateProfileCompleteness(
  profile: Profile | null,
  trackRecords: TrackRecord[] = [],
): number {
  if (!profile) return 0

  const filled = RECOMMENDATION_FIELDS.filter(field =>
    isFieldFilled(field.key, profile, trackRecords),
  ).length

  return Math.round((filled / RECOMMENDATION_FIELDS.length) * 100)
}

export function getProfileCompletenessDetails(
  profile: Profile | null,
  trackRecords: TrackRecord[] = [],
) {
  if (!profile) {
    return {
      percentage: 0,
      filled: 0,
      total: RECOMMENDATION_FIELDS.length,
      missingFields: RECOMMENDATION_FIELDS.map(field => field.label),
    }
  }

  const missingFields = RECOMMENDATION_FIELDS
    .filter(field => !isFieldFilled(field.key, profile, trackRecords))
    .map(field => field.label)
  const filled = RECOMMENDATION_FIELDS.length - missingFields.length

  return {
    percentage: Math.round((filled / RECOMMENDATION_FIELDS.length) * 100),
    filled,
    total: RECOMMENDATION_FIELDS.length,
    missingFields,
  }
}
