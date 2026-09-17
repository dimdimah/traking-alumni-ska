import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import type { Profile } from '@/types/database'
import { AdminStatsGrid } from '@/components/dashboard/admin-stats'
import { UsersDataTable } from '@/components/dashboard/users-data-table'

export default async function ManajemenUserPage() {
  const supabase = await createClient()

  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="page-container py-8">
        <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4">
          <span className="mt-0.5 text-red-500 text-sm flex-shrink-0">⚠</span>
          <p className="text-sm text-red-600">Gagal memuat data: {error.message}</p>
        </div>
      </div>
    )
  }

  const safeUsers: Profile[] = users ?? []
  const superUserCount = safeUsers.filter((u) => u.role === 'super_user').length
  const regularUserCount = safeUsers.filter((u) => u.role === 'user').length

  return (
    <div className="page-container space-y-8 pb-8">
      <PageHeader
        icon={<span className="text-[11px]">◆</span>}
        label="Admin Panel"
        title="Manajemen User."
        subtitle="Kelola semua pengguna terdaftar dan peran mereka."
      />

      {/* Stats */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <AdminStatsGrid
          totalUsers={users?.length || 0}
          superUserCount={superUserCount}
          regularUserCount={regularUserCount}
        />
      </div>

      {/* Users Table */}
      <div className="space-y-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-sans text-lg font-semibold tracking-[-0.02em] text-slate-900">
              Semua Pengguna
            </h2>
            <p className="mt-1 text-sm text-slate-600 font-mono">
              <span className="text-slate-900 font-medium">{users?.length}</span> total{' · '}
              <span className="text-amikom-purple font-medium">{superUserCount}</span> super user{' · '}
              <span className="text-slate-600">{regularUserCount}</span> user
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/bulk-import"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-400 hover:text-slate-900"
            >
              <span>📋</span>
              Import Massal
            </a>
            <a
              href="/admin/add-user"
              className="inline-flex items-center gap-2 rounded-pill bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm"
            >
              <span>+</span>
              Tambah User
            </a>
          </div>
        </div>
        <UsersDataTable users={safeUsers} />
      </div>
    </div>
  )
}
