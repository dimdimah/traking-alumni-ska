'use server'

import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as { role: string } | null)?.role !== 'super_user') {
    throw new Error('Forbidden')
  }

  return getCompanySurveysCached()
}
