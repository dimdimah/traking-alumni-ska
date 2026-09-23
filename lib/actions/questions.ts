'use server'

import { TRACER_STUDY_TEMPLATE } from '@/lib/tracer-study-template'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { orThrow } from './helpers'
import { requirePermission } from '@/lib/permissions/guards'
import { PERMISSIONS } from '@/lib/permissions'

const questionSchema = z.object({
  question_text: z.string().min(1, 'Teks pertanyaan wajib diisi'),
  question_type: z.enum(['text', 'textarea', 'select', 'radio', 'number', 'checkbox', 'scale']),
  options: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  display_order: z.coerce.number().default(0),
  angkatan: z.string().regex(/^\d{4}$/, 'Angkatan harus 4 digit tahun'),
})

export async function createQuestion(formData: FormData) {
  const { supabase } = await requirePermission(PERMISSIONS.QUESTION_MANAGE)

  const raw = {
    question_text: formData.get('question_text') as string,
    question_type: formData.get('question_type') as string,
    options: (formData.get('options') as string) || null,
    is_active: formData.get('is_active') === 'true',
    display_order: Number(formData.get('display_order')) || 0,
    angkatan: (formData.get('angkatan') as string) || '2024',
  }

  const parsed = questionSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(e => e.message).join(', '))
  }

  const optionsArray = parsed.data.options
    ? parsed.data.options.split('\n').map(s => s.trim()).filter(Boolean)
    : null

  const { error } = await supabase
    .from('tracer_study_questions')
    .insert({
      question_text: parsed.data.question_text,
      question_type: parsed.data.question_type,
      options: optionsArray,
      is_active: parsed.data.is_active,
      display_order: parsed.data.display_order,
      angkatan: parsed.data.angkatan,
    })

  orThrow(error, 'Gagal buat pertanyaan', 'Gagal menyimpan pertanyaan. Silakan coba lagi.')
  revalidatePath('/admin/kuesioner')
  revalidateTag('tracer-questions')
}

export async function updateQuestion(id: string, formData: FormData) {
  const { supabase } = await requirePermission(PERMISSIONS.QUESTION_MANAGE)

  const raw = {
    question_text: formData.get('question_text') as string,
    question_type: formData.get('question_type') as string,
    options: (formData.get('options') as string) || null,
    is_active: formData.get('is_active') === 'true',
    display_order: Number(formData.get('display_order')) || 0,
    angkatan: (formData.get('angkatan') as string) || '2024',
  }

  const parsed = questionSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(e => e.message).join(', '))
  }

  const optionsArray = parsed.data.options
    ? parsed.data.options.split('\n').map(s => s.trim()).filter(Boolean)
    : null

  const { error } = await supabase
    .from('tracer_study_questions')
    .update({
      question_text: parsed.data.question_text,
      question_type: parsed.data.question_type,
      options: optionsArray,
      is_active: parsed.data.is_active,
      display_order: parsed.data.display_order,
      angkatan: parsed.data.angkatan,
    })
    .eq('id', id)

  orThrow(error, 'Gagal update pertanyaan', 'Gagal menyimpan pertanyaan. Silakan coba lagi.')
  revalidatePath('/admin/kuesioner')
  revalidateTag('tracer-questions')
}

export async function deleteQuestion(id: string) {
  const { supabase } = await requirePermission(PERMISSIONS.QUESTION_MANAGE)
  const { error } = await supabase
    .from('tracer_study_questions')
    .delete()
    .eq('id', id)
  orThrow(error, 'Gagal hapus pertanyaan', 'Gagal menghapus pertanyaan. Silakan coba lagi.')
  revalidatePath('/admin/kuesioner')
  revalidateTag('tracer-questions')
}

export async function getQuestionAngkatanList(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tracer_study_questions')
    .select('angkatan')
    .order('angkatan', { ascending: false })

  if (!data || data.length === 0) return []

  const unique = [...new Set(data.map((d) => d.angkatan).filter(Boolean) as string[])]
  return unique.sort((a, b) => b.localeCompare(a))
}

export async function getQuestionsByAngkatan(angkatan: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tracer_study_questions')
    .select('id, question_text, question_type, options, is_active, display_order, angkatan')
    .eq('angkatan', angkatan)
    .order('display_order', { ascending: true })

  return data || []
}

export async function getQuestionsByAngkatanPaginated(angkatan: string, page: number, perPage: number = 20) {
  const supabase = await createClient()
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const { data, count } = await supabase
    .from('tracer_study_questions')
    .select('id, question_text, question_type, options, is_active, display_order, angkatan', { count: 'exact' })
    .eq('angkatan', angkatan)
    .order('display_order', { ascending: true })
    .range(from, to)

  return {
    questions: data || [],
    total: count || 0,
    totalPages: Math.ceil((count || 0) / perPage),
  }
}

const getQuestionsPerAngkatanCached = unstable_cache(
  async (): Promise<{ angkatan: string; count: number; active: number }[]> => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('tracer_study_questions')
      .select('angkatan, is_active')

    if (!data || data.length === 0) return []

    const map: Record<string, { count: number; active: number }> = {}
    for (const row of (data as { angkatan: string; is_active: boolean }[])) {
      if (!map[row.angkatan]) {
        map[row.angkatan] = { count: 0, active: 0 }
      }
      map[row.angkatan].count++
      if (row.is_active) map[row.angkatan].active++
    }

    return Object.entries(map)
      .map(([angkatan, stats]) => ({ angkatan, ...stats }))
      .sort((a, b) => b.angkatan.localeCompare(a.angkatan))
  },
  ['questions-per-angkatan'],
  { revalidate: 60, tags: ['tracer-questions'] }
)

export async function getQuestionsPerAngkatan(): Promise<{ angkatan: string; count: number; active: number }[]> {
  return getQuestionsPerAngkatanCached()
}

const getAngkatanResponsesCached = unstable_cache(
  async (angkatan: string) => {
  const supabase = createAdminClient()

  const { data: responses } = await supabase
    .from('tracer_study_responses')
    .select(`
      id,
      user_id,
      graduation_year,
      education_level,
      employment_status,
      company,
      position,
      salary_range,
      study_field_match,
      suggestions,
      submitted_at
    `)
    .eq('graduation_year', Number(angkatan))
    .order('submitted_at', { ascending: false })

  if (!responses || responses.length === 0) return []

  const userIds = responses.map(r => (r as Record<string, unknown>).user_id as string)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, nim, email')
    .in('id', userIds)

  const profileMap = new Map(
    (profiles || []).map(p => [p.id, p])
  )

  return responses.map(r => {
    const row = r as Record<string, unknown>
    const profile = profileMap.get(row.user_id as string) as { full_name: string | null; nim: string | null; email: string } | undefined
    return {
      user_id: row.user_id as string,
      full_name: profile?.full_name || null,
      nim: profile?.nim || null,
      email: profile?.email || '',
      graduation_year: row.graduation_year as number,
      education_level: row.education_level as string | null,
      employment_status: row.employment_status as string,
      company: row.company as string | null,
      position: row.position as string | null,
      salary_range: row.salary_range as string | null,
      study_field_match: row.study_field_match as string | null,
      suggestions: row.suggestions as string | null,
      submitted_at: row.submitted_at as string,
    }
  })
  },
  ['angkatan-responses'],
  { revalidate: 60, tags: ['tracer-stats'] }
)

export async function getAngkatanResponses(angkatan: string) {
  return getAngkatanResponsesCached(angkatan)
}

export async function getUserAnswers(userId: string, angkatan: string) {
  const supabase = await createClient()

  const { data: answers } = await supabase
    .from('tracer_study_answers')
    .select(`
      question_id,
      answer_text,
      tracer_study_questions!inner (
        question_text,
        question_type,
        display_order
      )
    `)
    .eq('user_id', userId)

  if (!answers) return []

  const mapped = answers.map(a => {
    const row = a as {
      question_id: string
      answer_text: string | null
      tracer_study_questions: {
        question_text: string
        question_type: string
        display_order: number
      }
    }
    return {
      question_text: row.tracer_study_questions.question_text,
      question_type: row.tracer_study_questions.question_type,
      display_order: row.tracer_study_questions.display_order,
      answer_text: row.answer_text,
    }
  })

  mapped.sort((a, b) => a.display_order - b.display_order)
  return mapped
}

const getAvailableYearsCached = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('tracer_study_responses')
      .select('graduation_year')
      .order('graduation_year', { ascending: false })

    if (!data || data.length === 0) return []

    const rows = (data as { graduation_year: number }[])
    const years = rows.map(r => String(r.graduation_year))
    return [...new Set(years)].sort((a, b) => b.localeCompare(a))
  },
  ['tracer-available-years'],
  { revalidate: 60, tags: ['tracer-stats'] }
)

export async function getAvailableYears(): Promise<string[]> {
  return getAvailableYearsCached()
}

const getSistemAlumniStatsCached = unstable_cache(
  async (year?: string) => {
  const supabase = createAdminClient()
  let query = supabase
    .from('tracer_study_responses')
    .select('employment_status, salary_range, study_field_match, graduation_year')
  if (year) {
    query = (query as any).eq('graduation_year', Number(year))
  }

  const { data: responses } = await query

  if (!responses || responses.length === 0) {
    return {
      totalResponses: 0,
      employmentRate: 0,
      studyingRate: 0,
      salaryDistribution: {},
      fieldMatchRate: 0,
    }
  }

  type SistemAlumniRow = { employment_status: string; salary_range: string | null; study_field_match: string | null; graduation_year: number }
  const rows = (responses as SistemAlumniRow[])

  const employed = rows.filter(r => r.employment_status === 'Bekerja').length
  const studying = rows.filter(r => r.employment_status === 'Melanjutkan Studi').length
  const withFieldMatch = rows.filter(r => r.study_field_match !== null)
  const fieldMatch = withFieldMatch.filter(r => r.study_field_match === 'Sangat Sesuai' || r.study_field_match === 'Sesuai').length

  return {
    totalResponses: rows.length,
    employmentRate: rows.length > 0 ? Math.round((employed / rows.length) * 100) : 0,
    studyingRate: rows.length > 0 ? Math.round((studying / rows.length) * 100) : 0,
    salaryDistribution: rows.reduce((acc: Record<string, number>, r) => {
      if (r.salary_range) {
        acc[r.salary_range] = (acc[r.salary_range] || 0) + 1
      }
      return acc
    }, {}),
    fieldMatchRate: withFieldMatch.length > 0 ? Math.round((fieldMatch / withFieldMatch.length) * 100) : 0,
  }
  },
  ['tracer-stats'],
  { revalidate: 60, tags: ['tracer-stats'] }
)

export async function getSistemAlumniStats(year?: string) {
  return getSistemAlumniStatsCached(year)
}

/**
 * Muat template Smart Sistem Alumni ke angkatan tertentu.
 * Jika `overwrite=true`, semua pertanyaan yang ada di angkatan tsb akan dihapus dulu.
 * Seksi A (Data Pribadi) sengaja tidak dimasukkan — sudah ada di profil alumni.
 */
export async function bulkCreateFromTemplate(angkatan: string, overwrite: boolean = false) {
  const { supabase } = await requirePermission(PERMISSIONS.QUESTION_MANAGE)

  if (!/^\d{4}$/.test(angkatan)) {
    throw new Error('Angkatan harus 4 digit tahun')
  }

  if (overwrite) {
    const { error: deleteError } = await supabase
      .from('tracer_study_questions')
      .delete()
      .eq('angkatan', angkatan)

    if (deleteError) {
      throw new Error('Gagal menghapus pertanyaan lama sebelum muat template')
    }
  }

  const questionsToInsert = TRACER_STUDY_TEMPLATE.map((q) => ({
    question_text: q.question_text,
    question_type: q.question_type,
    options: q.options,
    is_active: q.is_active,
    display_order: q.display_order,
    angkatan,
  }))

  const { error } = await supabase
    .from('tracer_study_questions')
    .insert(questionsToInsert)

  if (error) {
    throw new Error(`Gagal menyimpan template pertanyaan. Detail: ${error.message}`)
  }

  revalidatePath('/admin/kuesioner')
  revalidateTag('tracer-questions')
}

export async function deleteQuestionsByAngkatan(angkatan: string) {
  const { supabase } = await requirePermission(PERMISSIONS.QUESTION_MANAGE)

  if (!/^\d{4}$/.test(angkatan)) {
    throw new Error('Angkatan harus 4 digit tahun')
  }

  const { error } = await supabase
    .from('tracer_study_questions')
    .delete()
    .eq('angkatan', angkatan)

  if (error) {
    throw new Error('Gagal menghapus angkatan. Silakan coba lagi.')
  }

  revalidatePath('/admin/kuesioner')
  revalidateTag('tracer-questions')
}

/**
 * Ambil riwayat pengisian tracer study milik user tertentu (untuk admin).
 * Mengembalikan entri dari tracer_study_history atau fallback dari tracer_study_responses.
 */
export async function getUserTracerHistory(userId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('tracer_study_history')
      .select('id, user_id, angkatan, snapshot, submitted_at')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(20)

    if (!error && data && data.length > 0) {
      return data || []
    }
  } catch (err) {
    console.error('Error fetching tracer_study_history for user:', err)
  }

  // Fallback dari tracer_study_responses
  const { data: response } = await supabase
    .from('tracer_study_responses')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!response) return []

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
    .eq('user_id', userId)

  const answersList = (answersData || []).map((a: any) => ({
    question_text: a.tracer_study_questions?.question_text || 'Pertanyaan',
    question_type: a.tracer_study_questions?.question_type || 'text',
    answer_text: a.answer_text,
    display_order: a.tracer_study_questions?.display_order || 0,
  })).sort((a: any, b: any) => a.display_order - b.display_order)

  const snapshot = {
    core_fields: {
      education_level: response.education_level || '',
      employment_status: response.employment_status || '',
      company: response.company || null,
      position: response.position || null,
      salary_range: response.salary_range || null,
      study_field_match: response.study_field_match || null,
      suggestions: response.suggestions || null,
    },
    answers: answersList,
  }

  const items: any[] = []
  const subTime = response.submitted_at ? new Date(response.submitted_at).getTime() : 0
  const updTime = response.updated_at ? new Date(response.updated_at).getTime() : 0

  if (updTime && subTime && Math.abs(updTime - subTime) > 5000) {
    items.push({
      id: `synth-upd-${response.id}`,
      user_id: userId,
      angkatan: String(response.graduation_year || ''),
      snapshot,
      submitted_at: response.updated_at,
    })
    items.push({
      id: `synth-sub-${response.id}`,
      user_id: userId,
      angkatan: String(response.graduation_year || ''),
      snapshot,
      submitted_at: response.submitted_at,
    })
  } else {
    items.push({
      id: `synth-${response.id}`,
      user_id: userId,
      angkatan: String(response.graduation_year || ''),
      snapshot,
      submitted_at: response.updated_at || response.submitted_at || new Date().toISOString(),
    })
  }

  return items
}

/**
 * Ambil seluruh riwayat pengisian dan pembaruan tracer study untuk satu angkatan tertentu.
 * Digunakan oleh admin pada tab Riwayat Log di halaman kelola kuesioner.
 */
export async function getAngkatanTracerHistory(angkatan: string) {
  const supabase = await createClient()

  // 1. Coba ambil dari tracer_study_history jika ada
  try {
    const { data: histData, error } = await supabase
      .from('tracer_study_history')
      .select(`
        id,
        user_id,
        angkatan,
        snapshot,
        submitted_at,
        profiles (
          full_name,
          nim,
          email
        )
      `)
      .eq('angkatan', angkatan)
      .order('submitted_at', { ascending: false })

    if (!error && histData && histData.length > 0) {
      return histData.map((h: any) => ({
        id: h.id,
        user_id: h.user_id,
        full_name: h.profiles?.full_name || h.profiles?.email || 'Alumni',
        nim: h.profiles?.nim || null,
        email: h.profiles?.email || '',
        angkatan: h.angkatan,
        type: 'Tersimpan (Snapshot)',
        submitted_at: h.submitted_at,
        status: h.snapshot?.core_fields?.employment_status || '—',
        company: h.snapshot?.core_fields?.company || null,
        position: h.snapshot?.core_fields?.position || null,
        education_level: h.snapshot?.core_fields?.education_level || '—',
        snapshot: h.snapshot,
      }))
    }
  } catch (err) {
    console.error('getAngkatanTracerHistory tracer_study_history error:', err)
  }

  // 2. Fallback: Ambil dari tracer_study_responses untuk angkatan ini
  const { data: responses, error: respErr } = await supabase
    .from('tracer_study_responses')
    .select(`
      id,
      user_id,
      graduation_year,
      education_level,
      employment_status,
      company,
      position,
      salary_range,
      study_field_match,
      suggestions,
      submitted_at,
      updated_at,
      profiles (
        full_name,
        nim,
        email
      )
    `)
    .eq('graduation_year', Number(angkatan))
    .order('updated_at', { ascending: false })

  if (respErr || !responses || responses.length === 0) return []

  const historyItems: any[] = []

  for (const r of responses as any[]) {
    const name = r.profiles?.full_name || r.profiles?.email || 'Alumni'
    const subTime = r.submitted_at ? new Date(r.submitted_at).getTime() : 0
    const updTime = r.updated_at ? new Date(r.updated_at).getTime() : 0
    const isUpdated = updTime && subTime && Math.abs(updTime - subTime) > 5000

    const snapshot = {
      core_fields: {
        education_level: r.education_level || '',
        employment_status: r.employment_status || '',
        company: r.company || null,
        position: r.position || null,
        salary_range: r.salary_range || null,
        study_field_match: r.study_field_match || null,
        suggestions: r.suggestions || null,
      },
      answers: [],
    }

    if (isUpdated) {
      historyItems.push({
        id: `synth-upd-${r.id}`,
        user_id: r.user_id,
        full_name: name,
        nim: r.profiles?.nim || null,
        email: r.profiles?.email || '',
        angkatan: String(r.graduation_year),
        type: 'Pembaruan Data',
        submitted_at: r.updated_at,
        status: r.employment_status || '—',
        company: r.company || null,
        position: r.position || null,
        education_level: r.education_level || '—',
        snapshot,
      })
    }

    historyItems.push({
      id: `synth-sub-${r.id}`,
      user_id: r.user_id,
      full_name: name,
      nim: r.profiles?.nim || null,
      email: r.profiles?.email || '',
      angkatan: String(r.graduation_year),
      type: isUpdated ? 'Pengisian Awal' : 'Pengisian Kuesioner',
      submitted_at: r.submitted_at || r.updated_at || new Date().toISOString(),
      status: r.employment_status || '—',
      company: r.company || null,
      position: r.position || null,
      education_level: r.education_level || '—',
      snapshot,
    })
  }

  return historyItems.sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  )
}


