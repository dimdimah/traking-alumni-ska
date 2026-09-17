// FILE: app/(protected)/user/layout.tsx
import { RoleGuard } from '@/components/auth/role-guard'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={['user', 'super_user']} redirectTo="/login">
      {children}
    </RoleGuard>
  )
}
