import type { Profile, Job, TrackRecord } from '@/types/database'
import { getCertificationNames } from '@/lib/utils/certifications'

// Pure document builders untuk rekomendasi kerja (Content-Based Filtering).
// Module ini murni (tanpa 'use server') agar bisa dites secara sinkron.
//
// Tingkat kecocokan dihitung dari ATRIBUT profil alumni:
//   1. Program Studi
//   2. Skill / Keahlian
//   3. Pengalaman Kerja (riwayat kerja)
//   4. Sertifikasi
//   5. Bidang / Posisi Pekerjaan yang Diminati
//   6. Preferensi Lokasi Kerja
//   7. Tipe Pekerjaan yang Diinginkan
// Tidak ada filterisasi (gaji/lokasi/tipe tidak dipakai sebagai filter).

export function buildProfileDocument(profile: Profile, trackRecords: TrackRecord[] = []): string {
  const parts: string[] = []

  if (profile.program_studi) parts.push(profile.program_studi)
  if (Array.isArray(profile.skills) && profile.skills.length > 0) {
    parts.push(profile.skills.join(' '))
  }

  const certificationNames = getCertificationNames(profile.certifications)
  if (certificationNames.length > 0) {
    parts.push(certificationNames.join(' '))
  }

  if (Array.isArray(profile.job_interests) && profile.job_interests.length > 0) {
    parts.push(profile.job_interests.join(' '))
  }

  if (profile.preferred_location) parts.push(profile.preferred_location)
  if (profile.preferred_type) parts.push(profile.preferred_type)

  if (trackRecords.length > 0) {
    const experience = trackRecords
      .map((record) => [record.position, record.company, record.description].filter(Boolean).join(' '))
      .filter(Boolean)
    if (experience.length > 0) parts.push(experience.join(' '))
  }

  return parts.join(' ')
}

export function buildJobDocument(job: Job): string {
  const parts = [
    job.title,
    job.location ?? '',
    job.type ?? '',
    Array.isArray(job.skills) ? job.skills.join(' ') : '',
    job.description,
  ]

  return parts.filter(Boolean).join(' ')
}