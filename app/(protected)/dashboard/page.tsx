import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calculateProfileCompleteness } from '@/lib/utils/profile-completeness'
import { PageHeader } from '@/components/ui/page-header'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import { QuickActionsGrid } from '@/components/dashboard/quick-actions-grid'
import type { Profile, TrackRecord } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileResult, trackResult, tracerResult, jobResult] = await Promise.all([
    supabase.from('profiles').select('email, role, created_at, program_studi, skills, certifications, job_interests, preferred_location, preferred_type').eq('id', user.id).single(),
    supabase.from('track_records').select('id', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('tracer_study_responses').select('id').eq('user_id', user.id).single(),
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const profile = (profileResult as unknown as { data: Profile | null }).data
  const trackRecords = ((trackResult as unknown as { data: TrackRecord[] | null }).data) ?? []
  const completenessPercentage = calculateProfileCompleteness(profile, trackRecords)
  const trackCount = trackRecords.length
  const tracerData = (tracerResult as { data: unknown }).data
  const jobCount = (jobResult as { count: number | null }).count ?? 0

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<span className="text-[11px]">◇</span>}
        label="Dashboard"
        title="Beranda."
        subtitle={`Selamat datang kembali, ${profile?.email}`}
      />

      {/* Stats Grid */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <StatsGrid
          trackRecordCount={trackCount ?? 0}
          SistemAlumniFilled={!!tracerData}
          jobCount={jobCount ?? 0}
          completenessPercentage={completenessPercentage}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-6 lg:grid-cols-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-sans text-base font-semibold tracking-[-0.02em] text-slate-900">Quick Actions</h3>
                <p className="mt-0.5 text-sm text-slate-600">Mulai dari sini</p>
              </div>
            </div>
            <QuickActionsGrid
              trackCount={trackCount}
              tracerFilled={!!tracerData}
              jobCount={jobCount}
            />
          </div>
        </div>

        {/* User Info Card */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-sans text-base font-semibold tracking-[-0.02em] text-slate-900">Account Info</h3>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Email</p>
              <p className="mt-1.5 text-sm text-slate-900 break-all">{profile?.email}</p>
            </div>
            <div className="h-px bg-slate-200" />
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Role</p>
              <div className="mt-1.5">
                <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold font-mono tracking-wider uppercase border ${
                  profile?.role === 'super_user'
                    ? 'bg-amikom-purple text-amikom-jonquil-warm border-amikom-purple'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                    profile?.role === 'super_user' ? 'bg-amikom-jonquil-warm' : 'bg-amikom-purple'
                  }`} />
                  {profile?.role === 'super_user' ? 'Super User' : profile?.role === 'user' ? 'User' : (profile?.role ?? '—')}
                </span>
              </div>
            </div>
            <div className="h-px bg-slate-200" />
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Member Since</p>
              <p className="mt-1.5 text-sm text-slate-900">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}