'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { profileSchema, changePasswordSchema } from '@/lib/schemas/profile'
import { withAuth } from './helpers'
import type { Profile, TrackRecord } from '@/types/database'

function getProfileErrorMessage(error: { code?: string; message?: string; details?: string } | null): string {
  if (!error) return 'Gagal menyimpan profil. Silakan coba lagi.'
  console.error('Gagal update profil:', error.code, error.message, error.details)
  switch (error.code) {
    case '23505':
      // unique violation — typically NIM
      return 'Data yang diisi sudah ada duplikat. Periksa kembali NIM atau data lainnya.'
    case '23503':
      return 'Referensi data tidak valid.'
    case '23502':
      return 'Ada kolom wajib yang belum terisi.'
    default:
      return 'Gagal menyimpan profil. Silakan coba lagi.'
  }
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await withAuth()

  const raw = {
    full_name: formData.get('full_name') as string,
    phone: (formData.get('phone') as string) || null,
    bio: (formData.get('bio') as string) || null,
    nim: (formData.get('nim') as string) || null,
    skills: (formData.get('skills') as string) || null,
    location: (formData.get('location') as string) || null,
    education_level: (formData.get('education_level') as string) || null,
    program_studi: (formData.get('program_studi') as string) || null,
    certifications: (formData.get('certifications') as string) || null,
    job_interests: (formData.get('job_interests') as string) || null,
    preferred_location: (formData.get('preferred_location') as string) || null,
    expected_salary: (formData.get('expected_salary') as string) || null,
    preferred_type: (formData.get('preferred_type') as string) || null,
  }

  const parsed = profileSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(e => e.message).join(', '))
  }

  const skillsArray = parsed.data.skills
    ? parsed.data.skills.split(/[,;]/).map(s => s.trim()).filter(Boolean)
    : []
  const certificationsArray = parsed.data.certifications
    ? parsed.data.certifications.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
    : []
  const jobInterestsArray = parsed.data.job_interests
    ? parsed.data.job_interests.split(/[,;]/).map(s => s.trim()).filter(Boolean)
    : []

  // Graduation year & tanggal_lahir TIDAK di-update di sini:
  // - graduation_year hanya boleh diubah admin (lihat lib/actions/alumni.ts)
  // - tanggal_lahir dihapus dari profil (tidak lagi dikelola)
  // education_level & expected_salary hanya di-update jika dikirim form
  // (halaman profil GitHub tidak mengirim keduanya — cegah ter-reset ke null).
  const updatePayload: Partial<Omit<Profile, 'id' | 'created_at'>> = {
    full_name: parsed.data.full_name,
    phone: parsed.data.phone,
    bio: parsed.data.bio,
    nim: parsed.data.nim,
    skills: skillsArray,
    location: parsed.data.location,
    program_studi: parsed.data.program_studi,
    certifications: certificationsArray,
    job_interests: jobInterestsArray,
    preferred_location: parsed.data.preferred_location,
    preferred_type: parsed.data.preferred_type,
  }
  if (formData.has('education_level')) updatePayload.education_level = parsed.data.education_level
  if (formData.has('expected_salary')) updatePayload.expected_salary = parsed.data.expected_salary

  const { error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', user.id)

  if (error) {
    throw new Error(getProfileErrorMessage(error))
  }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard/career')
  revalidatePath('/user/rekomendasi')
  revalidateTag('matching')
  revalidateTag('jobs')
}

// BE single-RTT untuk dashboard/profile: 1× auth + paralel profiles + track_records + tracer study
export async function getProfileInitialData(): Promise<{ profile: Profile | null; trackRecords: TrackRecord[]; hasCompletedTracerStudy: boolean }> {
  const { supabase, user } = await withAuth()
  const [{ data: profile }, { data: trackRecords }, { data: tracerResponse }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('track_records').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
    supabase.from('tracer_study_responses').select('id').eq('user_id', user.id).maybeSingle(),
  ])
  return {
    profile: (profile as Profile) || null,
    trackRecords: (trackRecords as TrackRecord[]) || [],
    hasCompletedTracerStudy: !!tracerResponse,
  }
}

export async function changePassword(formData: FormData) {
  const { supabase, user } = await withAuth()

  const raw = {
    current_password: formData.get('current_password') as string,
    new_password: formData.get('new_password') as string,
    confirm_password: formData.get('confirm_password') as string,
  }

  const parsed = changePasswordSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(e => e.message).join(', '))
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: parsed.data.current_password,
  })

  if (signInError) throw new Error('Password saat ini salah')

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.new_password,
  })

  if (updateError) {
    console.error('Gagal ganti password:', updateError.message)
    throw new Error('Gagal mengganti password. Silakan coba lagi.')
  }

  revalidatePath('/dashboard/profile')
}
