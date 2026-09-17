'use client'

import { useState, useEffect, useMemo } from 'react'
import { getCachedProfile } from '@/lib/profile-cache'
import { getJobRecommendations } from '@/lib/actions/matching'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { SkillSuggestions } from '@/components/skill-suggestions'
import type { MatchResult } from '@/types/database'


function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim()
}

function isSkillMatched(skill: string, userSkills: string[]): boolean {
  const s = normalizeSkill(skill)
  return userSkills.some((us) => normalizeSkill(us) === s)
}

function ScoreBar({ score }: { score: number }) {
  const percent = Math.round(score * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            backgroundColor: percent >= 70 ? '#22c55e' : percent >= 40 ? '#f59e0b' : '#ef4444',
          }}
        />
      </div>
      <span className="text-sm font-semibold font-mono text-slate-900 w-10 text-right">
        {percent}%
      </span>
    </div>
  )
}

export default function RekomendasiPage() {
  const [results, setResults] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<MatchResult | null>(null)
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [userSkills, setUserSkills] = useState<string[]>(() => {
    const cached = getCachedProfile()
    return cached?.skills && Array.isArray(cached.skills) ? cached.skills : []
  })

  useEffect(() => {
    // skills diambil dari cache (layout sudah sync); jika kosong, ambil dari hasil rekomendasi pertama kali tanpa query tambahan
    if (userSkills.length > 0) return
    const cached = getCachedProfile()
    if (cached?.skills && Array.isArray(cached.skills) && cached.skills.length > 0) {
      setUserSkills(cached.skills)
    }
    // fallback: biarkan kosong — highlight skill tetap jalan setelah recommendations ter-load via profile di server
  }, [userSkills.length])

  useEffect(() => {
    ;(async () => {
      try {
        const data = await getJobRecommendations(20)
        setResults(data)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
        console.error('Gagal memuat rekomendasi:', err)
        setErrorMsg(msg)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Memoize sort + counts agar tidak recompute tiap render (20 cards × filter 3×)
  const sorted = useMemo(() => [...results].sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score
    return new Date(b.job.created_at).getTime() - new Date(a.job.created_at).getTime()
  }), [results, sortBy])

  const highCount = useMemo(() => results.filter(r => r.score >= 0.7).length, [results])
  const mediumCount = useMemo(() => results.filter(r => r.score >= 0.4 && r.score < 0.7).length, [results])

  return (
    <div className="page-container space-y-8 pb-8">
      <PageHeader
        icon={<span className="text-[11px]">★</span>}
        label="Rekomendasi Kerja"
        title="Rekomendasi Lowongan."
        subtitle="Lowongan yang dipilih berdasarkan profil dan preferensi kamu."
      />

      {/* Sort controls */}
      {!loading && results.length > 0 && (
        <div className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <span className="text-xs font-mono text-slate-500">Urutkan:</span>
          <button
            onClick={() => setSortBy('score')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium font-mono transition-all ${
              sortBy === 'score'
                ? 'bg-amikom-purple text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-400'
            }`}
          >
            Score Tertinggi
          </button>
          <button
            onClick={() => setSortBy('date')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium font-mono transition-all ${
              sortBy === 'date'
                ? 'bg-amikom-purple text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-400'
            }`}
          >
            Terbaru
          </button>
        </div>
      )}

      {/* Stats summary */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-mono text-2xl font-semibold text-slate-900">{results.length}</p>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total</span>
            </div>
            <p className="mt-0.5 text-xs font-medium text-slate-500">Total Match</p>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-mono text-2xl font-semibold text-emerald-600">
                {highCount}
              </p>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-500">Tinggi</span>
            </div>
            <p className="mt-0.5 text-xs font-medium text-emerald-700">High Match</p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-mono text-2xl font-semibold text-amber-500">
                {mediumCount}
              </p>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600">Sedang</span>
            </div>
            <p className="mt-0.5 text-xs font-medium text-amber-700">Medium Match</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amikom-purple border-t-transparent" />
        </div>
      ) : results.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-slate-200 bg-white">
          <span className="text-3xl text-slate-500">★</span>
          <p className="mt-4 text-sm text-slate-500">Belum ada rekomendasi</p>
          <p className="mt-1 text-xs text-slate-400">Lengkapi profil kamu untuk mendapatkan rekomendasi lowongan</p>
          {errorMsg && (
            <p className="mt-2 text-xs text-red-500 font-mono">Error: {errorMsg}</p>
          )}
          <a
            href="/user/profile"
            className="mt-4 rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:border-slate-400 hover:text-slate-900 transition-all"
          >
            Lengkapi Profil
          </a>
          <button
            onClick={async () => {
              setLoading(true)
              setErrorMsg(null)
              try {
                const data = await getJobRecommendations(20)
                setResults(data)
              } catch (err) {
                setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan')
              } finally {
                setLoading(false)
              }
            }}
            className="mt-3 text-xs text-amikom-purple underline underline-offset-2 hover:text-amikom-purple-hover"
          >
            Coba lagi
          </button>
        </div>
      ) : (
        /* Results grid */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {sorted.map((result, index) => {
            return (
              <div
                key={result.job.id}
                className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-sm"
                style={{ animationDelay: `${0.1 + index * 0.03}s` }}
              >
                {/* Main row */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-sans text-sm font-semibold text-slate-900 truncate">
                          {result.job.title}
                        </h3>
                        <Badge variant={result.job.type === 'Full-time' ? 'default' : result.job.type === 'Internship' ? 'warning' : 'secondary'}>
                          {result.job.type}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                        <span className="text-xs text-slate-600">{result.job.company}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-xs text-slate-500">{result.job.location}</span>
                        {result.job.salary && (
                          <>
                            <span className="text-slate-400">·</span>
                            <span className="text-[11px] font-mono text-slate-500">{result.job.salary}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Score display */}
                    <ScoreBar score={result.score} />
                  </div>

                  {/* Skills */}
                  {result.job.skills && result.job.skills.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1.5">
                        {result.job.skills.map((skill) => {
                          const matched = isSkillMatched(skill, userSkills)
                          return (
                            <span
                              key={skill}
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium font-mono ${
                                matched
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-200/60 bg-slate-50/60 text-slate-600'
                              }`}
                            >
                              {matched && (
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              )}
                              {skill}
                            </span>
                          )
                        })}
                      </div>
                      <p className="mt-1.5 text-[10px] font-mono text-slate-400">
                        <span className="text-emerald-600">●</span> skill kamu · <span className="text-slate-400">○</span> belum dimiliki
                      </p>
                      <SkillSuggestions
                        description={result.job.description}
                        jobSkills={result.job.skills}
                        userSkills={userSkills}
                      />
                    </div>
                  )}

                  {/* Toggle detail */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-mono text-slate-400">
                      Skor Cosine Similarity
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedJob(result)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-amikom-purple hover:text-amikom-purple"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                      Lihat Detail
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        title={selectedJob ? selectedJob.job.title : ''}
        description={selectedJob ? `${selectedJob.job.company} · ${selectedJob.job.location}` : ''}
      >
        {selectedJob && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Badge variant={selectedJob.job.type === 'Full-time' ? 'default' : selectedJob.job.type === 'Internship' ? 'warning' : 'secondary'}>
                {selectedJob.job.type}
              </Badge>
              {selectedJob.job.salary && (
                <span className="text-xs font-mono text-slate-500">{selectedJob.job.salary}</span>
              )}
              <span className="ml-auto flex items-center gap-2">
                <span className="text-sm font-semibold font-mono text-slate-900">
                  {Math.round(selectedJob.score * 100)}%
                </span>
              </span>
            </div>

            {/* Skills */}
            {selectedJob.job.skills && selectedJob.job.skills.length > 0 && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                  Skill
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.job.skills.map((skill) => {
                    const matched = isSkillMatched(skill, userSkills)
                    return (
                      <span
                        key={skill}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium font-mono border ${
                          matched
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200/60 bg-slate-50/60 text-slate-600'
                        }`}
                      >
                        {matched && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                        {skill}
                      </span>
                    )
                  })}
                </div>
                <p className="mt-1.5 text-[10px] font-mono text-slate-400">
                  <span className="text-emerald-600">●</span> skill kamu · <span className="text-slate-400">○</span> belum dimiliki
                </p>
                <SkillSuggestions
                  description={selectedJob.job.description}
                  jobSkills={selectedJob.job.skills}
                  userSkills={userSkills}
                />
              </div>
            )}

            {/* Description */}
            {selectedJob.job.description && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                  Deskripsi Lowongan
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">{selectedJob.job.description}</p>
              </div>
            )}

            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                Skor Cosine Similarity
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Skor ini dihitung dari kemiripan konten profil dan pengalaman kerja kamu dengan dokumen lowongan menggunakan TF-IDF dan Cosine Similarity. Nilai 100% berarti vektor teks paling mirip dengan lowongan pada hasil saat ini.
              </p>
            </div>

            {/* Contact */}
            {selectedJob.job.contact_info && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                  Kontak
                </p>
                <p className="text-sm text-slate-600">{selectedJob.job.contact_info}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {selectedJob.job.url && (
                <a
                  href={selectedJob.job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-amikom-purple px-5 py-2 text-xs font-medium text-white transition-all hover:bg-amikom-purple-hover active:scale-[0.98]"
                >
                  Lamar Sekarang
                </a>
              )}
              <span className="text-[10px] font-mono text-slate-400">
                Sumber: {selectedJob.job.source}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
