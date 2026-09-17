import { createClient } from '@/lib/supabase/server'
import { JobList } from '@/components/job-list'
import type { Job } from '@/types/database'
import Link from 'next/link'
import { getJobRecommendations } from '@/lib/actions/matching'
import { getPaginatedActiveJobs } from '@/lib/actions/jobs'
import { Sparkles, MapPin, DollarSign, ArrowRight } from 'lucide-react'

async function RekomendasiCard({ userSkills }: { userSkills: string[] }) {
  try {
    const recs = await getJobRecommendations(3)
    if (!recs || recs.length === 0) return null

    const normalize = (s: string) => s.toLowerCase().trim()
    const skillOwned = (s: string) => userSkills.some((us) => normalize(us) === normalize(s))

    return (
      <div className="rounded-xl border border-amikom-purple/20 bg-gradient-to-br from-amikom-purple/5 to-white p-5 shadow-sm animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amikom-purple/10 text-amikom-purple">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-amikom-purple/70">Smart Match</p>
              <p className="text-sm font-semibold text-slate-900 leading-tight">Rekomendasi Kerja Untukmu</p>
            </div>
          </div>
          <Link
            href="/user/rekomendasi"
            className="flex items-center gap-1.5 text-xs font-semibold text-amikom-purple hover:text-amikom-purple-hover transition-colors"
          >
            Lihat Semua
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Job cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          {recs.map(({ job, score }) => {
            const pct = Math.round(score * 100)
            const skills = job.skills && job.skills.length > 0 ? job.skills.slice(0, 4) : []
            const extra = job.skills && job.skills.length > 4 ? job.skills.length - 4 : 0
            return (
              <div
                key={job.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-2 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">{job.title}</p>
                    <p className="text-xs text-amikom-purple font-medium mt-0.5 truncate">{job.company}</p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold font-mono ${
                      pct >= 70
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : pct >= 40
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-50 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.location}
                    </span>
                  )}
                  {job.salary && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {job.salary}
                    </span>
                  )}
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {skills.map((skill) => {
                      const owned = skillOwned(skill)
                      return (
                        <span
                          key={skill}
                          className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium font-mono ${
                            owned
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200/60 bg-slate-50/60 text-slate-600'
                          }`}
                        >
                          {owned ? '● ' : ''}{skill}
                        </span>
                      )
                    })}
                    {extra > 0 && (
                      <span className="inline-flex items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                        +{extra}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  } catch {
    return null
  }
}

export default async function CareerPage({ searchParams }: { searchParams?: { q?: string; type?: string; page?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userSkills: string[] = []
  if (user?.id) {
    const { data: profile } = await supabase.from('profiles').select('skills').eq('id', user.id).single()
    if ((profile as { skills: string[] | null } | null)?.skills) {
      userSkills.push(...(profile as { skills: string[] }).skills)
    }
  }

  // BE pagination: hanya 12 per halaman (dari 2505 total), type & q difilter di DB via range+count+or+contains
  const page = Math.max(1, parseInt(searchParams?.page || '1', 10) || 1)
  const perPage = 12
  const type = searchParams?.type || 'All'
  const q = searchParams?.q || ''
  const { jobs, total, totalPages } = await getPaginatedActiveJobs({ page, perPage, type, q })

  return (
    <>
      <JobList
        jobs={jobs}
        title="Lowongan Kerja."
        subtitle="Temukan peluang karir terbaik untuk alumni."
        portalLabel="Lowongan Kerja"
        showDetailModal={true}
        userSkills={userSkills}
        pagination={{ total, page, perPage, totalPages }}
        smartMatchSlot={<RekomendasiCard userSkills={userSkills} />}
      />
    </>
  )
}
