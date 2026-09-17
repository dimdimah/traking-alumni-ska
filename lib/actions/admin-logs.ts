'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AdminActivityLog, AdminActivityAction } from '@/types/database'

/**
 * Catat aktivitas admin ke tabel admin_activity_logs.
 * Error disuppress agar tidak memutus proses utama jika tabel belum di-migrate.
 */
export async function logAdminActivity(
  action_type: AdminActivityAction | string,
  title: string,
  description?: string,
  metadata?: Record<string, any>
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', user.id)
      .maybeSingle()

    // Gunakan admin client untuk bypass RLS jika diperlukan
    const adminClient = createAdminClient()
    await adminClient.from('admin_activity_logs').insert({
      user_id: user.id,
      user_email: profile?.email || user.email || null,
      user_name: profile?.full_name || null,
      action_type,
      title,
      description: description || null,
      metadata: metadata || null,
    })
  } catch (err) {
    console.error('logAdminActivity error:', err)
  }
}

/**
 * Ambil daftar log aktivitas admin dengan pagination / limit.
 */
export async function getAdminActivityLogs(
  limit = 20,
  actionType?: string
): Promise<AdminActivityLog[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  try {
    let query = supabase
      .from('admin_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (actionType) {
      query = query.eq('action_type', actionType)
    }

    const { data, error } = await query

    if (!error && data && data.length > 0) {
      return data as AdminActivityLog[]
    }
  } catch (err) {
    console.error('getAdminActivityLogs error:', err)
  }

  // Fallback: Jika tabel admin_activity_logs belum ada di DB, buatkan synthetic log dari responses terbaru
  try {
    const { data: latestResponses } = await supabase
      .from('tracer_study_responses')
      .select(`
        id, user_id, graduation_year, employment_status, company, submitted_at, updated_at,
        profiles ( full_name, nim, email )
      `)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (latestResponses && latestResponses.length > 0) {
      return latestResponses.map((r: any) => {
        const name = r.profiles?.full_name || r.profiles?.email || 'Alumni'
        const isUpdate = r.updated_at && r.submitted_at && new Date(r.updated_at).getTime() - new Date(r.submitted_at).getTime() > 5000
        return {
          id: `synth-log-${r.id}`,
          user_id: r.user_id,
          user_email: r.profiles?.email || null,
          user_name: name,
          action_type: isUpdate ? 'TRACER_STUDY_SYNC' : 'SYSTEM',
          title: isUpdate ? `Pembaruan Tracer Study — ${name}` : `Pengisian Kuesioner Baru — ${name}`,
          description: `Alumni Angkatan ${r.graduation_year} (${r.employment_status || 'Mengisi Data'}${r.company ? ` di ${r.company}` : ''})`,
          metadata: {
            angkatan: String(r.graduation_year),
            employment_status: r.employment_status,
            company: r.company,
          },
          created_at: r.updated_at || r.submitted_at || new Date().toISOString(),
        }
      })
    }
  } catch (err) {
    console.error('Fallback activity logs error:', err)
  }

  return []
}
