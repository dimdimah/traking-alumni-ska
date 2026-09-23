import { RoleGuard } from '@/components/auth/role-guard'
import { ADMIN_ACTIONS } from '@/lib/permissions'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Permission-based: role custom dengan minimal 1 permission admin boleh masuk;
  // aksi di dalam halaman tetap dijaga requirePermission per server action.
  return (
    <RoleGuard requiredActions={ADMIN_ACTIONS} redirectTo="/dashboard">
      <div className="page-container py-8">
        {children}
      </div>
    </RoleGuard>
  )
}
