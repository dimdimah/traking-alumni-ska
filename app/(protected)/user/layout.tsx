// FILE: app/(protected)/user/layout.tsx
import { RoleGuard } from '@/components/auth/role-guard'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Cukup punya profile — role apa pun (termasuk role custom) boleh masuk area user.
  return (
    <RoleGuard redirectTo="/login">
      {children}
    </RoleGuard>
  )
}
