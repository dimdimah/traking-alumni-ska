'use server'

import { createClient } from '@/lib/supabase/server'
import type { SurveyRating } from '@/types/database'

export type SurveyState = {
  success: boolean
  error: string | null
}

const RATING_VALUES = ['sangat_baik', 'baik', 'cukup', 'kurang']
const RATING_FIELDS = ['teamwork', 'it_skill', 'english', 'communication', 'self_development', 'leadership', 'work_ethic']

export async function submitCompanySurvey(
  _prevState: SurveyState,
  formData: FormData
): Promise<SurveyState> {
  const fields = {
    pic_name: (formData.get('pic_name') as string)?.trim(),
    company_name: (formData.get('company_name') as string)?.trim(),
    position: (formData.get('position') as string)?.trim(),
    email: (formData.get('email') as string)?.trim(),
    alumni_name: (formData.get('alumni_name') as string)?.trim(),
    alumni_graduation_year: parseInt(formData.get('alumni_graduation_year') as string),
    alumni_major: (formData.get('alumni_major') as string)?.trim(),
    teamwork: formData.get('teamwork') as SurveyRating,
    it_skill: formData.get('it_skill') as SurveyRating,
    english: formData.get('english') as SurveyRating,
    communication: formData.get('communication') as SurveyRating,
    self_development: formData.get('self_development') as SurveyRating,
    leadership: formData.get('leadership') as SurveyRating,
    work_ethic: formData.get('work_ethic') as SurveyRating,
    expectation: (formData.get('expectation') as string)?.trim() || null,
    suggestion: (formData.get('suggestion') as string)?.trim() || null,
  }

  // Validasi field wajib teks
  const requiredText = ['pic_name', 'company_name', 'position', 'email', 'alumni_name', 'alumni_major'] as const
  for (const key of requiredText) {
    if (!fields[key]) {
      return { success: false, error: `Field "${key.replace('_', ' ')}" wajib diisi.` }
    }
  }

  // Validasi tahun lulus
  const currentYear = new Date().getFullYear()
  if (isNaN(fields.alumni_graduation_year) || fields.alumni_graduation_year < 2000 || fields.alumni_graduation_year > currentYear) {
    return { success: false, error: 'Tahun lulus alumni tidak valid.' }
  }

  // Validasi nilai rating
  for (const key of RATING_FIELDS) {
    const val = formData.get(key) as string
    if (!val || !RATING_VALUES.includes(val)) {
      return { success: false, error: `Penilaian aspek "${key.replace('_', ' ')}" wajib dipilih.` }
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('company_surveys').insert(fields)

  if (error) {
    console.error('[Company Survey] Insert error:', error)
    return { success: false, error: 'Terjadi kesalahan saat mengirim data. Silakan coba lagi.' }
  }

  return { success: true, error: null }
}
