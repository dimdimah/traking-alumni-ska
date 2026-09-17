'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSistemAlumniStats, getAvailableYears } from '@/lib/actions/questions'
import { getMatchingStats } from '@/lib/actions/matching'
import { exportAnalyticsSummaryToExcelClient } from '@/lib/utils/export-client'
import { PageHeader } from '@/components/ui/page-header'
import { BarChart3, PieChart, TrendingUp, Users, Target, Briefcase, Filter, Award, MapPin, Clock } from 'lucide-react'

interface MatchingStats {
  totalAlumni: number
  withProgramStudi: number
  withSkills: number
  withTrackRecords: number
  withCertifications: number
  withJobInterests: number
  withPreferredLocation: number
  withPreferredType: number
  completeProfile: number
}

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [stats, setStats] = useState<{
    totalResponses: number
    employmentRate: number
    studyingRate: number
    salaryDistribution: Record<string, number>
    fieldMatchRate: number
  } | null>(null)
  const [matchingStats, setMatchingStats] = useState<MatchingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [isFilteredStats, setIsFilteredStats] = useState(false)

  useEffect(() => {
    const urlYear = searchParams.get('year')
    if (urlYear) {
      setSelectedYear(urlYear)
      setIsFilteredStats(true)
    }
    getAvailableYears().then(years => {
      setAvailableYears(years)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getSistemAlumniStats(selectedYear || undefined),
      getMatchingStats(),
    ]).then(([tracerData, matchingData]) => {
      setStats(tracerData)
      setMatchingStats(matchingData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [selectedYear])

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
    setIsFilteredStats(year !== '')
    if (year) {
      router.replace(`/admin/analytics?year=${year}`, { scroll: false })
    } else {
      router.replace('/admin/analytics', { scroll: false })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amikom-purple border-t-transparent" />
      </div>
    )
  }

  const salaryEntries = stats?.salaryDistribution
    ? Object.entries(stats.salaryDistribution).sort()
    : []
  const maxSalaryCount = salaryEntries.length > 0
    ? Math.max(...salaryEntries.map(([, count]) => count))
    : 1

  return (
    <div className="space-y-8">
      <div className="space-y-1.5 animate-fade-in-up">
        <PageHeader
          icon={<span className="text-[11px]">📊</span>}
          label="Dashboard"
          title="Analitik."
          subtitle="Visualisasi data tracer study alumni untuk kebutuhan akreditasi."
          action={
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-700 shadow-sm transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-amikom-purple/20 focus:border-amikom-purple"
              >
                <option value="">Semua Tahun</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          }
        />
        {isFilteredStats && (
          <p className="text-xs font-mono text-amikom-purple">
            Menampilkan data untuk tahun {selectedYear}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 font-mono">Total Responden</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-900">{stats?.totalResponses || 0}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 font-mono">Bekerja</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-900">{stats?.employmentRate || 0}%</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amikom-purple/10 text-amikom-purple border border-amikom-purple/20">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 font-mono">Melanjutkan Studi</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-900">{stats?.studyingRate || 0}%</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 font-mono">Kesesuaian Bidang</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-900">{stats?.fieldMatchRate || 0}%</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              <PieChart className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Matching Profile Stats */}
      {matchingStats && matchingStats.totalAlumni > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
          <div className="mb-6">
            <h3 className="font-sans text-base font-semibold tracking-[-0.02em] text-slate-900">Kelengkapan Profil Rekomendasi</h3>
            <p className="mt-0.5 text-sm text-slate-600">Persentase alumni yang telah melengkapi tujuh kriteria rekomendasi lowongan</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amikom-purple/10 text-amikom-purple">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{matchingStats.completeProfile}</p>
                  <p className="text-xs font-mono text-slate-500">Profil Lengkap</p>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amikom-purple transition-all duration-500"
                  style={{ width: `${matchingStats.totalAlumni > 0 ? (matchingStats.completeProfile / matchingStats.totalAlumni) * 100 : 0}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {matchingStats.totalAlumni > 0 ? Math.round((matchingStats.completeProfile / matchingStats.totalAlumni) * 100) : 0}% dari {matchingStats.totalAlumni} alumni
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{matchingStats.withProgramStudi}</p>
                  <p className="text-xs font-mono text-slate-500">Program Studi</p>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${matchingStats.totalAlumni > 0 ? (matchingStats.withProgramStudi / matchingStats.totalAlumni) * 100 : 0}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {matchingStats.totalAlumni > 0 ? Math.round((matchingStats.withProgramStudi / matchingStats.totalAlumni) * 100) : 0}% dari {matchingStats.totalAlumni} alumni
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{matchingStats.withSkills}</p>
                  <p className="text-xs font-mono text-slate-500">Skills</p>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${matchingStats.totalAlumni > 0 ? (matchingStats.withSkills / matchingStats.totalAlumni) * 100 : 0}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {matchingStats.totalAlumni > 0 ? Math.round((matchingStats.withSkills / matchingStats.totalAlumni) * 100) : 0}% dari {matchingStats.totalAlumni} alumni
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-100 text-amber-600">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{matchingStats.withTrackRecords}</p>
                  <p className="text-xs font-mono text-slate-500">Pengalaman Kerja</p>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${matchingStats.totalAlumni > 0 ? (matchingStats.withTrackRecords / matchingStats.totalAlumni) * 100 : 0}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {matchingStats.totalAlumni > 0 ? Math.round((matchingStats.withTrackRecords / matchingStats.totalAlumni) * 100) : 0}% dari {matchingStats.totalAlumni} alumni
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-100 text-amber-600">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{matchingStats.withCertifications}</p>
                  <p className="text-xs font-mono text-slate-500">Sertifikasi</p>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${matchingStats.totalAlumni > 0 ? (matchingStats.withCertifications / matchingStats.totalAlumni) * 100 : 0}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {matchingStats.totalAlumni > 0 ? Math.round((matchingStats.withCertifications / matchingStats.totalAlumni) * 100) : 0}% dari {matchingStats.totalAlumni} alumni
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{matchingStats.withJobInterests}</p>
                  <p className="text-xs font-mono text-slate-500">Bidang Pekerjaan</p>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${matchingStats.totalAlumni > 0 ? (matchingStats.withJobInterests / matchingStats.totalAlumni) * 100 : 0}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {matchingStats.totalAlumni > 0 ? Math.round((matchingStats.withJobInterests / matchingStats.totalAlumni) * 100) : 0}% dari {matchingStats.totalAlumni} alumni
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{matchingStats.withPreferredLocation}</p>
                  <p className="text-xs font-mono text-slate-500">Preferensi Lokasi</p>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${matchingStats.totalAlumni > 0 ? (matchingStats.withPreferredLocation / matchingStats.totalAlumni) * 100 : 0}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {matchingStats.totalAlumni > 0 ? Math.round((matchingStats.withPreferredLocation / matchingStats.totalAlumni) * 100) : 0}% dari {matchingStats.totalAlumni} alumni
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-200 text-slate-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{matchingStats.withPreferredType}</p>
                  <p className="text-xs font-mono text-slate-500">Tipe Pekerjaan</p>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-500 transition-all duration-500"
                  style={{ width: `${matchingStats.totalAlumni > 0 ? (matchingStats.withPreferredType / matchingStats.totalAlumni) * 100 : 0}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {matchingStats.totalAlumni > 0 ? Math.round((matchingStats.withPreferredType / matchingStats.totalAlumni) * 100) : 0}% dari {matchingStats.totalAlumni} alumni
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Salary Distribution Chart */}
      {salaryEntries.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="mb-6">
            <h3 className="font-sans text-base font-semibold tracking-[-0.02em] text-slate-900">Distribusi Gaji</h3>
            <p className="mt-0.5 text-sm text-slate-600">Persebaran kisaran gaji alumni yang bekerja</p>
          </div>
          <div className="space-y-3">
            {salaryEntries.map(([range, count]) => (
              <div key={range} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{range}</span>
                  <span className="text-slate-900 font-medium font-mono">{count} alumni</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amikom-purple/70 transition-all duration-500"
                    style={{ width: `${(count / maxSalaryCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employment Status Summary */}
      {stats && stats.totalResponses > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="mb-6">
            <h3 className="font-sans text-base font-semibold tracking-[-0.02em] text-slate-900">Ringkasan Status</h3>
            <p className="mt-0.5 text-sm text-slate-600">Distribusi status pekerjaan alumni</p>
          </div>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amikom-purple/10 border-4 border-amikom-purple/20">
                <span className="text-2xl font-semibold text-amikom-purple">{stats.employmentRate}%</span>
              </div>
              <p className="mt-2 text-xs font-mono text-slate-500 font-medium">Bekerja</p>
            </div>
            <div className="text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 border-4 border-amber-200">
                <span className="text-2xl font-semibold text-amber-600">{stats.studyingRate}%</span>
              </div>
              <p className="mt-2 text-xs font-mono text-slate-500 font-medium">Studi</p>
            </div>
            <div className="text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 border-4 border-green-200">
                <span className="text-2xl font-semibold text-green-600">{stats.fieldMatchRate}%</span>
              </div>
              <p className="mt-2 text-xs font-mono text-slate-500 font-medium">Sesuai Bidang</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!stats?.totalResponses && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-16 shadow-sm">
          <span className="text-3xl text-slate-500">📊</span>
          <p className="mt-4 text-sm text-slate-500">Belum ada data sistem alumni</p>
          <p className="text-xs text-slate-400 mt-1">Data akan muncul setelah alumni mengisi kuesioner</p>
        </div>
      )}
    </div>
  )
}
