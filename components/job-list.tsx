'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { SkillSuggestions } from '@/components/skill-suggestions'
import type { Job } from '@/types/database'
import { JOB_TYPES } from '@/lib/constants'

const jobTypes = ['All', ...JOB_TYPES] as const

interface JobListProps {
  jobs: Job[]
  title: string
  subtitle: string
  portalLabel: string
  emptyIcon?: string
  showDetailModal?: boolean
  showFooterStats?: boolean
  smartMatchSlot?: React.ReactNode
  userSkills?: string[]
  // BE pagination (jika ada, JobList tidak filter client-side, melainkan pakai data paginated dari server)
  pagination?: { total: number; page: number; perPage: number; totalPages: number }
  // Footer stats global (dipakai saat paginated agar angka tetap akurat, bukan hitungan per halaman)
  footerStats?: { total: number; fullTime: number; internship: number; remote: number }
}

const normalizeSkill = (s: string) => s.toLowerCase().trim()

export function JobList({ jobs, title, subtitle, portalLabel, emptyIcon = '💼', showDetailModal = true, showFooterStats = false, smartMatchSlot, userSkills = [], pagination, footerStats }: JobListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isBEPaginated = !!pagination
  const [activeFilter, setActiveFilter] = useState<string>(searchParams.get('type') || 'All')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  // Jika BE pagination: jobs sudah difilter & paginated di server, tidak filter lagi di client
  // Jika tidak, filter client-side seperti sebelumnya
  const filteredJobs = useMemo(() => {
    if (isBEPaginated) return jobs
    return jobs.filter((job) => {
      const matchesFilter = activeFilter === 'All' || job.type === activeFilter
      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.skills || []).some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesFilter && matchesSearch
    })
  }, [jobs, activeFilter, searchQuery, isBEPaginated])

  const skillOwned = (skill: string) => userSkills.some((us) => normalizeSkill(us) === normalizeSkill(skill))

  // Sync filter ke URL — BE mode: push page=1 saat ganti filter/search; FE mode: replace saja
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (isBEPaginated) {
      if (searchQuery) params.set('q', searchQuery); else params.delete('q')
      if (activeFilter !== 'All') params.set('type', activeFilter); else params.delete('type')
      // reset ke halaman 1 saat filter/search berubah, tapi jangan loop jika page sudah 1
      const currentQ = searchParams.get('q') || ''
      const currentType = searchParams.get('type') || 'All'
      if (currentQ !== searchQuery || currentType !== activeFilter) {
        params.delete('page')
      }
      const qs = params.toString()
      const target = qs ? `?${qs}` : window.location.pathname
      if (target !== window.location.search && target !== `?${searchParams.toString()}`) {
        router.push(target, { scroll: false })
      }
    } else {
      const p = new URLSearchParams()
      if (searchQuery) p.set('q', searchQuery)
      if (activeFilter !== 'All') p.set('type', activeFilter)
      const qs = p.toString()
      router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeFilter])

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        icon={<span className="text-[11px]">{emptyIcon}</span>}
        label={portalLabel}
        title={title}
        subtitle={subtitle}
      />

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari lowongan, perusahaan, atau skill..."
            className="w-full rounded-md border border-slate-200 bg-white px-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20 shadow-sm"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
        {jobTypes.map((type) => (
          <button
            key={type}
            onClick={() => setActiveFilter(type)}
            className={`rounded-md px-4 py-1.5 text-xs font-medium font-mono uppercase tracking-wider transition-all ${
              activeFilter === type
                ? 'bg-amikom-purple text-amikom-jonquil-warm shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Smart Match Slot */}
      {smartMatchSlot && (
        <div className="animate-fade-in-up" style={{ animationDelay: '0.09s' }}>
          {smartMatchSlot}
        </div>
      )}

      {/* Job count */}
      <p className="text-xs font-mono text-slate-500 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <span className="text-amikom-purple">{isBEPaginated ? (pagination?.total ?? filteredJobs.length) : filteredJobs.length}</span> lowongan ditemukan
        {isBEPaginated && pagination && pagination.totalPages > 1 && (
          <span className="text-slate-400"> · Halaman {pagination.page} dari {pagination.totalPages}</span>
        )}
      </p>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 animate-fade-in-up" style={{ animationDelay: '0.12s' }}>
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job, index) => (
            <div
              key={job.id}
              role={showDetailModal ? 'button' : undefined}
              tabIndex={showDetailModal ? 0 : undefined}
              onKeyDown={showDetailModal ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedJob(job) } } : undefined}
              className="group relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer flex flex-col"
              style={{ animationDelay: `${0.12 + index * 0.03}s` }}
              onClick={showDetailModal ? () => setSelectedJob(job) : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-sans text-sm font-semibold text-slate-900 truncate">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                    <span className="text-xs text-slate-600">{job.company}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-xs text-slate-500">{job.location}</span>
                  </div>
                </div>
                <Badge variant={job.type === 'Full-time' ? 'default' : job.type === 'Internship' ? 'warning' : 'secondary'}>
                  {job.type}
                </Badge>
              </div>

              {job.description && (
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mt-2">{job.description}</p>
              )}

              {job.skills && job.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {job.skills.map((skill) => {
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
                </div>
              )}

              <SkillSuggestions
                description={job.description}
                jobSkills={job.skills || []}
                userSkills={userSkills}
              />

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto gap-2">
                <span className="text-sm font-semibold text-slate-900 font-mono truncate">{job.salary || '—'}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {showDetailModal ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedJob(job) }}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-all hover:border-amikom-purple hover:text-amikom-purple"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                      Lihat Detail
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(job.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <span className="text-3xl text-slate-500">{emptyIcon}</span>
            <p className="mt-4 text-sm text-slate-500">Tidak ada lowongan yang ditemukan</p>
            <button onClick={() => { setSearchQuery(''); setActiveFilter('All') }}
              className="mt-4 rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:border-slate-400 hover:text-slate-900 transition-all">
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* BE Pagination Controls */}
      {isBEPaginated && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4 animate-fade-in-up">
          <button
            onClick={() => {
              const p = new URLSearchParams(searchParams.toString())
              p.set('page', String(Math.max(1, pagination.page - 1)))
              router.push(`?${p.toString()}`, { scroll: false })
            }}
            disabled={pagination.page <= 1}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-400"
          >
            ‹ Prev
          </button>
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            let pageNum: number
            if (pagination.totalPages <= 5) pageNum = i + 1
            else if (pagination.page <= 3) pageNum = i + 1
            else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i
            else pageNum = pagination.page - 2 + i
            return (
              <button
                key={pageNum}
                onClick={() => {
                  const p = new URLSearchParams(searchParams.toString())
                  p.set('page', String(pageNum))
                  router.push(`?${p.toString()}`, { scroll: false })
                }}
                className={`min-w-[32px] rounded-md px-3 py-1.5 text-xs font-medium font-mono ${pageNum === pagination.page ? 'bg-amikom-purple text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-400'}`}
              >
                {pageNum}
              </button>
            )
          })}
          <button
            onClick={() => {
              const p = new URLSearchParams(searchParams.toString())
              p.set('page', String(Math.min(pagination.totalPages, pagination.page + 1)))
              router.push(`?${p.toString()}`, { scroll: false })
            }}
            disabled={pagination.page >= pagination.totalPages}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-400"
          >
            Next ›
          </button>
        </div>
      )}

      {/* Footer stats — pakai footerStats global jika ada (mode BE paginated), fallback hitung dari jobs */}
      {showFooterStats && (footerStats ? footerStats.total > 0 : jobs.length > 0) && (
        <div className="flex items-center justify-center gap-8 pt-4 border-t border-slate-200/30 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900 font-mono">{footerStats ? footerStats.total : jobs.length}</p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Total Lowongan</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-amikom-purple font-mono">{footerStats ? footerStats.fullTime : jobs.filter(j => j.type === 'Full-time').length}</p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Full Time</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-amber-500 font-mono">{footerStats ? footerStats.internship : jobs.filter(j => j.type === 'Internship').length}</p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Internship</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900 font-mono">{footerStats ? footerStats.remote : jobs.filter(j => j.location === 'Remote').length}</p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Remote</p>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <Modal
          open={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          title={selectedJob?.title}
          footer={
            selectedJob?.url ? (
              <a
                href={selectedJob.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-md bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm">
                Lamar
              </a>
            ) : (
              <button onClick={() => setSelectedJob(null)}
                className="rounded-md border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all active:scale-[0.98] hover:border-slate-400">
                Tutup
              </button>
            )
          }
        >
          {selectedJob && (
            <div className="space-y-4">
              <div>
                <Badge variant={selectedJob.type === 'Full-time' ? 'default' : selectedJob.type === 'Internship' ? 'warning' : 'secondary'}>
                  {selectedJob.type}
                </Badge>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-amikom-purple font-medium">{selectedJob.company}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-sm text-slate-500">{selectedJob.location}</span>
                </div>
              </div>

              {selectedJob.salary && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Gaji</p>
                  <p className="text-sm font-semibold text-slate-900 font-mono">{selectedJob.salary}</p>
                </div>
              )}

              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Deskripsi</p>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">{selectedJob.description}</p>
              </div>

              {selectedJob.skills && selectedJob.skills.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Skills</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedJob.skills.map((skill) => (
                      <span key={skill} className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium font-mono text-slate-600">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <SkillSuggestions
                    description={selectedJob.description}
                    jobSkills={selectedJob.skills}
                    userSkills={userSkills}
                  />
                </div>
              )}

              {selectedJob.contact_info && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Kontak</p>
                  <p className="mt-1 text-sm text-slate-600">{selectedJob.contact_info}</p>
                </div>
              )}

              <p className="text-[10px] font-mono text-slate-500">
                Diposting {new Date(selectedJob.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
