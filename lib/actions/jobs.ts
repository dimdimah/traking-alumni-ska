'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { jobSchema } from '@/lib/schemas/jobs'
import type { Job } from '@/types/database'

async function checkAdminRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null; error: unknown }
  if (profile?.role !== 'super_user') throw new Error('Forbidden')
  return supabase
}

export async function createJob(formData: FormData) {
  const supabase = await checkAdminRole()

  const raw = {
    title: formData.get('title') as string,
    company: formData.get('company') as string,
    location: formData.get('location') as string,
    type: formData.get('type') as 'Full-time' | 'Part-time' | 'Contract' | 'Internship',
    salary: (formData.get('salary') as string) || null,
    description: formData.get('description') as string,
    skills: (formData.get('skills') as string) || null,
    contact_info: (formData.get('contact_info') as string) || null,
    url: formData.get('url') as string,
    source: formData.get('source') as string,
    is_active: formData.get('is_active') === 'true',
  }

  const parsed = jobSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(e => e.message).join(', '))
  }

  const skillsArray = parsed.data.skills
    ? parsed.data.skills.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const { error } = await supabase
    .from('jobs')
    .insert({
      title: parsed.data.title,
      company: parsed.data.company,
      location: parsed.data.location,
      type: parsed.data.type,
      salary: parsed.data.salary ?? null,
      description: parsed.data.description,
      skills: skillsArray,
      contact_info: parsed.data.contact_info ?? null,
      url: parsed.data.url,
      source: parsed.data.source,
      is_active: parsed.data.is_active,
    })

  if (error) {
    console.error('Gagal buat job:', error.message)
    throw new Error('Gagal menyimpan lowongan. Silakan coba lagi.')
  }

  revalidatePath('/admin/career-center')
  revalidateTag('jobs')
}

export async function updateJob(id: string, formData: FormData) {
  const supabase = await checkAdminRole()

  const raw = {
    title: formData.get('title') as string,
    company: formData.get('company') as string,
    location: formData.get('location') as string,
    type: formData.get('type') as 'Full-time' | 'Part-time' | 'Contract' | 'Internship',
    salary: (formData.get('salary') as string) || null,
    description: formData.get('description') as string,
    skills: (formData.get('skills') as string) || null,
    contact_info: (formData.get('contact_info') as string) || null,
    url: formData.get('url') as string,
    source: formData.get('source') as string,
    is_active: formData.get('is_active') === 'true',
  }

  const parsed = jobSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(e => e.message).join(', '))
  }

  const skillsArray = parsed.data.skills
    ? parsed.data.skills.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const { error } = await supabase
    .from('jobs')
    .update({
      title: parsed.data.title,
      company: parsed.data.company,
      location: parsed.data.location,
      type: parsed.data.type,
      salary: parsed.data.salary ?? null,
      description: parsed.data.description,
      skills: skillsArray,
      contact_info: parsed.data.contact_info ?? null,
      is_active: parsed.data.is_active,
    })
    .eq('id', id)

  if (error) {
    console.error('Gagal update job:', error.message)
    throw new Error('Gagal menyimpan lowongan. Silakan coba lagi.')
  }

  revalidatePath('/admin/career-center')
  revalidateTag('jobs')
}

export async function deleteJob(id: string) {
  const supabase = await checkAdminRole()

  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Gagal hapus job:', error.message)
    throw new Error('Gagal menghapus lowongan. Silakan coba lagi.')
  }

  revalidatePath('/admin/career-center')
  revalidateTag('jobs')
}

export async function toggleJobStatus(id: string, isActive: boolean) {
  const supabase = await checkAdminRole()

  const { error } = await supabase
    .from('jobs')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    console.error('Gagal toggle job:', error.message)
    throw new Error('Gagal mengubah status lowongan. Silakan coba lagi.')
  }

  revalidatePath('/admin/career-center')
  revalidateTag('jobs')
}

export async function getActiveJobs() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('jobs')
    .select('id, title, company, location, type, salary, description, skills, contact_info, is_active, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  return data || []
}

export async function getAllJobs() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('jobs')
    .select('id, title, company, location, type, salary, description, skills, contact_info, is_active, created_at')
    .order('created_at', { ascending: false })
  return data || []
}

const getPaginatedCache = unstable_cache(
  async (page: number, perPage: number, type: string, q: string): Promise<{ jobs: Job[]; total: number }> => {
    const supabase = createAdminClient()
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    let query = supabase
      .from('jobs')
      .select('id, title, company, location, type, salary, description, skills, contact_info, url, is_active, created_at', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (type && type !== 'All') {
      query = (query as any).eq('type', type)
    }
    if (q) {
      const esc = q.replace(/%/g, '\\%').replace(/,/g, '\\,')
      // BE search untuk title/company/description via ilike; skills via contains exact (lowercase) sebagai tambahan
      // Jika skills exact match, akan tertangkap via or tambahan di bawah, tapi untuk substring skills tetap tertangkap via title/desc jika ada
      query = query.or(`title.ilike.%${esc}%,company.ilike.%${esc}%,description.ilike.%${esc}%`)
    }

    const { data, count, error } = await query.range(from, to)
    if (error) throw new Error(error.message)

    // Jika q ada dan skills exact match (mis. "react"), gabungkan hasil contains agar skill-only jobs tidak hilang
    // Hanya untuk q tanpa spasi dan lowercase skill
    let extraJobs: Job[] = []
    if (q && q.trim() && !q.includes(' ') && q.length >= 2) {
      const lowerQ = q.toLowerCase().trim()
      if (/^[a-z0-9.\-+#]+$/.test(lowerQ)) {
        let skillQuery: any = supabase
          .from('jobs')
          .select('id, title, company, location, type, salary, description, skills, contact_info, url, is_active, created_at')
          .eq('is_active', true)
          .contains('skills', JSON.stringify([lowerQ]))
        if (type && type !== 'All') skillQuery = skillQuery.eq('type', type)
        const { data: skillJobs } = await skillQuery.limit(perPage)
        if (skillJobs && skillJobs.length > 0) {
          const existingIds = new Set(((data as unknown as Job[]) || []).map((j) => j.id))
          extraJobs = (skillJobs as unknown as Job[]).filter(j => !existingIds.has(j.id))
        }
      }
    }

    const merged = [...((data as unknown as Job[]) || []), ...extraJobs].slice(0, perPage)
    // Total: jika ada extra, total tidak presisi tapi cukup untuk pagination; pakai count dari query utama
    return { jobs: merged, total: count || 0 }
  },
  ['paginated-jobs'],
  { revalidate: 30, tags: ['jobs'] }
)

export async function getPaginatedActiveJobs(opts: { page: number; perPage: number; type?: string; q?: string }): Promise<{ jobs: Job[]; total: number; totalPages: number }> {
  const page = Math.max(1, opts.page || 1)
  const perPage = Math.max(1, Math.min(50, opts.perPage || 12))
  const type = opts.type || 'All'
  const q = (opts.q || '').trim()
  const { jobs, total } = await getPaginatedCache(page, perPage, type, q)
  return { jobs, total, totalPages: Math.ceil(total / perPage) }
}

// Admin career-center: semua jobs (aktif + nonaktif) paginated via admin client — tanpa fetch 2505 rows
const getAdminJobsCache = unstable_cache(
  async (page: number, perPage: number): Promise<{ jobs: Job[]; total: number }> => {
    const supabase = createAdminClient()
    const from = (page - 1) * perPage
    const to = from + perPage - 1
    const { data, count, error } = await supabase
      .from('jobs')
      .select('id, title, company, location, type, salary, description, skills, contact_info, url, source, is_active, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return { jobs: (data as unknown as Job[]) || [], total: count || 0 }
  },
  ['admin-jobs'],
  { revalidate: 30, tags: ['jobs'] }
)

export async function getAdminJobsPaginated(page: number, perPage: number = 20): Promise<{ jobs: Job[]; total: number; totalPages: number }> {
  const p = Math.max(1, page || 1)
  const pp = Math.max(1, Math.min(50, perPage || 20))
  const { jobs, total } = await getAdminJobsCache(p, pp)
  return { jobs, total, totalPages: Math.ceil(total / pp) }
}

// Overview global untuk stats + auto-fill notice admin (head-count ringan, cached 60s)
const getAdminJobsOverviewCached = unstable_cache(
  async (): Promise<{ total: number; active: number; inactive: number; added30: number; added7: number; sourceCount: number; lastUpdated: string | null }> => {
    const supabase = createAdminClient()
    const now = Date.now()
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
    const [{ count: total }, { count: active }, { count: added30 }, { count: added7 }, { data: sources }, { data: latest }] = await Promise.all([
      supabase.from('jobs').select('id', { count: 'exact', head: true }),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).gte('created_at', monthAgo),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('jobs').select('source'),
      supabase.from('jobs').select('created_at').order('created_at', { ascending: false }).limit(1).single(),
    ])
    const sourceCount = new Set(((sources as { source: string | null }[]) || []).map(s => s.source).filter(Boolean)).size
    return {
      total: total || 0,
      active: active || 0,
      inactive: (total || 0) - (active || 0),
      added30: added30 || 0,
      added7: added7 || 0,
      sourceCount,
      lastUpdated: (latest as { created_at: string } | null)?.created_at || null,
    }
  },
  ['admin-jobs-overview'],
  { revalidate: 60, tags: ['jobs'] }
)

export async function getAdminJobsOverview(): Promise<{ total: number; active: number; inactive: number; added30: number; added7: number; sourceCount: number; lastUpdated: string | null }> {
  return getAdminJobsOverviewCached()
}

// Footer stats global (4× count head-only, ringan) — dipakai /user/lowongan agar tetap akurat saat paginated
const getJobsStatsCached = unstable_cache(
  async (): Promise<{ total: number; fullTime: number; internship: number; remote: number }> => {
    const supabase = createAdminClient()
    const [totalRes, ftRes, internRes, remoteRes] = await Promise.all([
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('type', 'Full-time'),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('type', 'Internship'),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('location', 'Remote'),
    ])
    return {
      total: totalRes.count || 0,
      fullTime: ftRes.count || 0,
      internship: internRes.count || 0,
      remote: remoteRes.count || 0,
    }
  },
  ['jobs-footer-stats'],
  { revalidate: 60, tags: ['jobs'] }
)

export async function getJobsFooterStats(): Promise<{ total: number; fullTime: number; internship: number; remote: number }> {
  return getJobsStatsCached()
}
