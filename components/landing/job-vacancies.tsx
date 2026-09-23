import { StaggerContainer, StaggerItem, HoverScale } from './motion-wrapper'
import Link from 'next/link'
import type { Job } from '@/types/database'

function getLogoInitials(company: string): string {
  return company
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function formatSalary(job: Pick<Job, 'salary'>): string {
  return job.salary || 'Negotiable'
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Hari ini'
  if (days === 1) return '1 hari yang lalu'
  if (days < 7) return `${days} hari yang lalu`
  if (days < 14) return '1 minggu yang lalu'
  if (days < 30) return `${Math.floor(days / 7)} minggu yang lalu`
  return `${Math.floor(days / 30)} bulan yang lalu`
}

interface JobVacanciesProps {
  items: Pick<Job, 'id' | 'title' | 'company' | 'location' | 'type' | 'salary' | 'created_at'>[]
  isLoggedIn?: boolean
  dashboardHref?: string
}

export function JobVacancies({ items, isLoggedIn = false, dashboardHref = '/dashboard' }: JobVacanciesProps) {
  const careerHref = isLoggedIn
    ? dashboardHref === '/admin'
      ? '/admin/career-center'
      : '/dashboard/career'
    : '/login?next=%2Fdashboard%2Fcareer'
  return (
    <section id="lowongan" className="bg-white py-[80px] lg:py-[120px] scroll-mt-20">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amikom-purple mb-3">Career Center</p>
          <h2 className="text-[32px] md:text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-amikom-ink">
            Lowongan Pekerjaan.
          </h2>
          <p className="mt-4 text-[18px] font-normal leading-[1.5] text-amikom-ink-muted-48 max-w-[600px] mx-auto">
            Temukan peluang karir terbaik dari perusahaan mitra dan ekosistem alumni Amikom.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-amikom-hairline bg-amikom-pearl p-12 text-center mb-10">
            <p className="text-sm text-amikom-ink-muted-48">Belum ada lowongan yang tersedia saat ini.</p>
          </div>
        ) : (
          <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch mb-10">
            {items.map((job) => (
              <StaggerItem key={job.id}>
                <HoverScale>
                   <div className="flex flex-col h-full p-6 rounded-2xl bg-white border border-amikom-hairline hover:border-amikom-purple/30 hover:shadow-xl hover:shadow-amikom-purple/5 transition-all">
                     <div className="flex items-start justify-between mb-5">
                       <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amikom-purple/10 to-blue-500/10 flex items-center justify-center text-amikom-purple font-bold text-lg border border-amikom-purple/10">
                         {getLogoInitials(job.company)}
                       </div>
                       <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[12px] font-medium">
                         {timeAgo(job.created_at)}
                       </span>
                     </div>

                     <div className="flex-1">
                       <h3 className="text-[18px] font-bold text-amikom-ink mb-1 min-h-[56px] line-clamp-2">{job.title}</h3>
                       <p className="text-[14px] text-amikom-ink-muted-48 mb-4">{job.company}</p>

                       <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-[13px] text-slate-600">
                        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {job.location}
                      </div>
                      <div className="flex items-center gap-2 text-[13px] text-slate-600">
                        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {job.type}
                      </div>
                      <div className="flex items-center gap-2 text-[13px] text-slate-600">
                        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatSalary(job)}
                       </div>
                     </div>
                    </div>

                      <Link
                       href={careerHref}
                       className="mt-auto block w-full text-center py-2.5 rounded-lg bg-amikom-purple/5 text-amikom-purple text-[14px] font-semibold hover:bg-amikom-purple hover:text-white transition-colors"
                     >
                      {isLoggedIn ? 'Lamar di Portal' : 'Lamar Sekarang'}
                    </Link>
                  </div>
                </HoverScale>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        <div className="text-center">
          <Link
            href={careerHref}
            className="inline-flex items-center gap-2 text-[15px] font-semibold text-amikom-purple hover:text-amikom-purple-hover transition-colors"
          >
            {isLoggedIn ? 'Lihat semua lowongan di portal' : 'Lihat lebih banyak lowongan di portal'}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
