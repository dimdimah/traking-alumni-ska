import { RoleGuard } from '@/components/auth/role-guard'

export default function SuperUserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={['super_user']} redirectTo="/dashboard">
      {children}
    </RoleGuard>
  )
}
