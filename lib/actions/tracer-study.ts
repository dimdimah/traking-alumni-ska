'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { SistemAlumniSchema } from '@/lib/schemas/tracer-study'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { withAuth, orThrow } from './helpers'
import type { SistemAlumniQuestion, TracerStudyHistory, TracerStudyHistorySnapshot } from '@/types/database'

const getQuestionsByAngkatanCached = unstable_cache(
  async (angkatan: string): Promise<SistemAlumniQuestion[]> => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('tracer_study_questions')
      .select('*')
      .eq('is_active', true)
      .eq('angkatan', angkatan)
      .order('display_order')
    return (data as SistemAlumniQuestion[]) || []
  },
  ['tracer-questions-by-angkatan'],
  { revalidate: 60, tags: ['tracer-questions'] }
)

export async function getQuestionsByAngkatan(angkatan: string): Promise<SistemAlumniQuestion[]> {
  if (!angkatan) return []
  return getQuestionsByAngkatanCached(angkatan)
}

// BE single-RTT untuk tracer-study: 1 auth + paralel DB (hemat 4× auth + 2× server-action roundtrip)
export async function getTracerStudyInitialData(): Promise<{
  existing: import('@/types/database').SistemAlumniResponse | null
  graduationYear: string
  questions: SistemAlumniQuestion[]
  answers: Record<string, string>
  history: TracerStudyHistory[]
}> {
  const { supabase, user } = await withAuth()
  const userId = user.id

  // Paralel: response + profile gy (untuk fallback)
  const [{ data: existing }, { data: profileGyData }] = await Promise.all([
    supabase.from('tracer_study_responses').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('profiles').select('graduation_year').eq('id', userId).single(),
  ])

  const existingTyped = existing as import('@/types/database').SistemAlumniResponse | null
  const gy = (existingTyped?.graduation_year ?? (profileGyData as { graduation_year: number | null } | null)?.graduation_year ?? null)?.toString() || ''

  // Paralel: questions (cached via admin) + answers + history (dengan admin fallback)
  const [questions, answersMap, history] = await Promise.all([
    gy ? getQuestionsByAngkatanCached(gy) : Promise.resolve([] as SistemAlumniQuestion[]),
    (async () => {
      const { data } = await supabase.from('tracer_study_answers').select('question_id, answer_text').eq('user_id', userId)
      const map: Record<string, string> = {}
      for (const row of (data as { question_id: string; answer_text: string | null }[] || [])) if (row.answer_text) map[row.question_id] = row.answer_text
      return map
    })(),
    (async () => {
      // history via admin client sudah di-cache? tapi di sini pakai supabase auth biasa; fallback sama seperti getTracerStudyHistory
      try {
        const { data, error } = await supabase.from('tracer_study_history').select('id, user_id, angkatan, snapshot, submitted_at').eq('user_id', userId).order('submitted_at', { ascending: false }).limit(15)
        if (!error && data && data.length > 0) return data as TracerStudyHistory[]
      } catch {}
      const { data: response } = await supabase.from('tracer_study_responses').select('*').eq('user_id', userId).maybeSingle()
      if (!response) return [] as TracerStudyHistory[]
      const { data: answersData } = await supabase.from('tracer_study_answers').select(`question_id, answer_text, tracer_study_questions ( question_text, question_type, display_order )`).eq('user_id', userId)
      const answersList = ((answersData as any[]) || []).map((a: any) => ({
        question_text: a.tracer_study_questions?.question_text || 'Pertanyaan',
        question_type: a.tracer_study_questions?.question_type || 'text',
        answer_text: a.answer_text,
        display_order: a.tracer_study_questions?.display_order || 0,
      })).sort((a: any, b: any) => a.display_order - b.display_order)
      const coreFields = {
        education_level: (response as any).education_level || '',
        employment_status: (response as any).employment_status || '',
        company: (response as any).company || null,
        position: (response as any).position || null,
        salary_range: (response as any).salary_range || null,
        study_field_match: (response as any).study_field_match || null,
        suggestions: (response as any).suggestions || null,
      }
      const snapshot = { core_fields: coreFields, answers: answersList }
      const subTime = (response as any).submitted_at ? new Date((response as any).submitted_at).getTime() : 0
      const updTime = (response as any).updated_at ? new Date((response as any).updated_at).getTime() : 0
      if (updTime && subTime && Math.abs(updTime - subTime) > 5000) {
        return [
          { id: `synth-upd-${(response as any).id}`, user_id: userId, angkatan: String((response as any).graduation_year || ''), snapshot, submitted_at: (response as any).updated_at },
          { id: `synth-sub-${(response as any).id}`, user_id: userId, angkatan: String((response as any).graduation_year || ''), snapshot, submitted_at: (response as any).submitted_at },
        ] as TracerStudyHistory[]
      }
      return [{ id: `synth-${(response as any).id}`, user_id: userId, angkatan: String((response as any).graduation_year || ''), snapshot, submitted_at: (response as any).updated_at || (response as any).submitted_at || new Date().toISOString() } as TracerStudyHistory]
    })(),
  ])

  return { existing: existingTyped, graduationYear: gy, questions, answers: answersMap, history }
}

export async function submitSistemAlumni(formData: FormData) {
  const { supabase, user } = await withAuth()

  const raw = {
    graduation_year: Number(formData.get('graduation_year')),
    education_level: formData.get('education_level') as string,
    employment_status: formData.get('employment_status') as string,
    company: (formData.get('company') as string) || null,
    position: (formData.get('position') as string) || null,
    salary_range: (formData.get('salary_range') as string) || null,
    study_field_match: (formData.get('study_field_match') as string) || null,
    suggestions: (formData.get('suggestions') as string) || null,
  }

  const parsed = SistemAlumniSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(e => e.message).join(', '))
  }

  const { error } = await supabase
    .from('tracer_study_responses')
    .upsert(
      {
        graduation_year: parsed.data.graduation_year,
        education_level: parsed.data.education_level,
        employment_status: parsed.data.employment_status,
        company: parsed.data.company ?? null,
        position: parsed.data.position ?? null,
        salary_range: parsed.data.salary_range ?? null,
        study_field_match: parsed.data.study_field_match ?? null,
        suggestions: parsed.data.suggestions ?? null,
        user_id: user.id,
      },
      { onConflict: 'user_id' }
    )

  orThrow(error, 'Gagal submit sistem alumni', 'Gagal menyimpan data sistem alumni. Silakan coba lagi.')

  revalidatePath('/dashboard/tracer-study')
  revalidateTag('tracer-stats')
}

export async function getSistemAlumniResponse() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('tracer_study_responses')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Gagal ambil sistem alumni:', error.message)
    return null
  }

  return data
}

export async function getProfileGraduationYear(): Promise<number | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('graduation_year')
    .eq('id', user.id)
    .single()

  return (data as { graduation_year: number | null } | null)?.graduation_year ?? null
}

export async function submitTracerStudyAnswers(
  answers: { question_id: string; answer_text: string }[],
) {
  const { supabase, user } = await withAuth()

  const rows = answers.map((a) => ({
    user_id: user.id,
    question_id: a.question_id,
    answer_text: a.answer_text || null,
  }))

  const { error } = await supabase
    .from('tracer_study_answers')
    .upsert(rows, { onConflict: 'user_id, question_id' })

  orThrow(error, 'Gagal simpan jawaban', 'Gagal menyimpan jawaban. Silakan coba lagi.')
  revalidatePath('/dashboard/tracer-study')
}

export async function getTracerStudyAnswers(): Promise<Record<string, string>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const { data } = await supabase
    .from('tracer_study_answers')
    .select('question_id, answer_text')
    .eq('user_id', user.id)

  if (!data) return {}

  const map: Record<string, string> = {}
  for (const row of data as { question_id: string; answer_text: string | null }[]) {
    if (row.answer_text) map[row.question_id] = row.answer_text
  }
  return map
}

// ─── Riwayat Pengisian ───

/**
 * Simpan snapshot riwayat pengisian tracer study.
 * Dipanggil setelah submitSistemAlumni + submitTracerStudyAnswers berhasil.
 * Error disuppress agar tidak mengganggu flow utama.
 */
export async function saveTracerStudyHistory(
  angkatan: string,
  coreFields: TracerStudyHistorySnapshot['core_fields'],
  answerSnapshot: TracerStudyHistorySnapshot['answers'],
) {
  const { supabase, user } = await withAuth()

  const snapshot: TracerStudyHistorySnapshot = {
    core_fields: coreFields,
    answers: answerSnapshot,
  }

  const { error } = await supabase
    .from('tracer_study_history')
    .insert({
      user_id: user.id,
      angkatan,
      snapshot,
    })

  if (error) {
    console.error('Gagal menyimpan riwayat tracer study:', error.message)
  }
}

/**
 * Ambil riwayat pengisian tracer study milik user yang sedang login.
 * Mengambil dari tabel tracer_study_history, atau fallback dari tracer_study_responses.
 */
export async function getTracerStudyHistory(): Promise<TracerStudyHistory[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  try {
    const { data, error } = await supabase
      .from('tracer_study_history')
      .select('id, user_id, angkatan, snapshot, submitted_at')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(15)

    if (!error && data && data.length > 0) {
      return data as TracerStudyHistory[]
    }
  } catch (err) {
    console.error('tracer_study_history query error:', err)
  }

  // Fallback: Jika tabel history belum ada / belum terisi tapi user sudah punya data tracer_study_responses
  const { data: response } = await supabase
    .from('tracer_study_responses')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!response) return []

  // Ambil answers jika ada
  const { data: answersData } = await supabase
    .from('tracer_study_answers')
    .select(`
      question_id,
      answer_text,
      tracer_study_questions (
        question_text,
        question_type,
        display_order
      )
    `)
    .eq('user_id', user.id)

  const answersList = (answersData || []).map((a: any) => ({
    question_text: a.tracer_study_questions?.question_text || 'Pertanyaan',
    question_type: a.tracer_study_questions?.question_type || 'text',
    answer_text: a.answer_text,
    display_order: a.tracer_study_questions?.display_order || 0,
  })).sort((a: any, b: any) => a.display_order - b.display_order)

  const coreFields: TracerStudyHistorySnapshot['core_fields'] = {
    education_level: response.education_level || '',
    employment_status: response.employment_status || '',
    company: response.company || null,
    position: response.position || null,
    salary_range: response.salary_range || null,
    study_field_match: response.study_field_match || null,
    suggestions: response.suggestions || null,
  }

  const snapshot: TracerStudyHistorySnapshot = {
    core_fields: coreFields,
    answers: answersList,
  }

  const items: TracerStudyHistory[] = []
  const subTime = response.submitted_at ? new Date(response.submitted_at).getTime() : 0
  const updTime = response.updated_at ? new Date(response.updated_at).getTime() : 0

  // Jika ada updated_at dan berbeda dengan submitted_at (selisih > 5 detik)
  if (updTime && subTime && Math.abs(updTime - subTime) > 5000) {
    items.push({
      id: `synth-upd-${response.id}`,
      user_id: user.id,
      angkatan: String(response.graduation_year || ''),
      snapshot,
      submitted_at: response.updated_at,
    })
    items.push({
      id: `synth-sub-${response.id}`,
      user_id: user.id,
      angkatan: String(response.graduation_year || ''),
      snapshot,
      submitted_at: response.submitted_at,
    })
  } else {
    items.push({
      id: `synth-${response.id}`,
      user_id: user.id,
      angkatan: String(response.graduation_year || ''),
      snapshot,
      submitted_at: response.updated_at || response.submitted_at || new Date().toISOString(),
    })
  }

  return items
}
