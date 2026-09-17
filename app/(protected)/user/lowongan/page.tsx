import { createClient } from '@/lib/supabase/server'
import { JobList } from '@/components/job-list'
import { getPaginatedActiveJobs, getJobsFooterStats } from '@/lib/actions/jobs'

export default async function LowonganPage({ searchParams }: { searchParams?: { q?: string; type?: string; page?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userSkills: string[] = []
  if (user?.id) {
    const { data: profile } = await supabase.from('profiles').select('skills').eq('id', user.id).single()
    if ((profile as { skills: string[] | null } | null)?.skills) {
      userSkills.push(...(profile as { skills: string[] }).skills)
    }
  }

  // BE pagination: 12 per halaman (dari 2505 total), type & q difilter di DB — sama seperti /dashboard/career
  const page = Math.max(1, parseInt(searchParams?.page || '1', 10) || 1)
  const perPage = 12
  const type = searchParams?.type || 'All'
  const q = searchParams?.q || ''
  const [{ jobs, total, totalPages }, footerStats] = await Promise.all([
    getPaginatedActiveJobs({ page, perPage, type, q }),
    getJobsFooterStats(),
  ])

  return (
    <div className="page-container space-y-8 pb-8">
      <JobList
        jobs={jobs}
        title="Daftar Lowongan."
        subtitle="Temukan peluang karir terbaik untuk alumni."
        portalLabel="Alumni Portal"
        emptyIcon="▽"
        showDetailModal={false}
        showFooterStats={true}
        userSkills={userSkills}
        pagination={{ total, page, perPage, totalPages }}
        footerStats={footerStats}
      />
    </div>
  )
}
