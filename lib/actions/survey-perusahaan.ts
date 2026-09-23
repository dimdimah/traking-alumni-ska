'use server'

import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/permissions/guards'
import { PERMISSIONS } from '@/lib/permissions'
import type { CompanySurvey } from '@/types/database'

const getCompanySurveysCached = unstable_cache(
  async (): Promise<CompanySurvey[]> => {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('company_surveys')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching company surveys:', error)
      throw new Error('Failed to fetch surveys')
    }

    return data as CompanySurvey[]
  },
  ['company-surveys'],
  { revalidate: 60, tags: ['company-surveys'] }
)

export async function getCompanySurveys(): Promise<CompanySurvey[]> {
  await requirePermission(PERMISSIONS.SURVEY_VIEW)
  return getCompanySurveysCached()
}
