import { RoleGuard } from '@/components/auth/role-guard'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['super_user']} redirectTo="/dashboard">
      <div className="page-container py-8">
        {children}
      </div>
    </RoleGuard>
  )
}
