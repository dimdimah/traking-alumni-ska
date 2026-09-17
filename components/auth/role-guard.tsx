// FILE: components/auth/role-guard.tsx
import { redirect } from 'next/navigation'
import { getUserRole } from '@/utils/get-role'
import type { AppRole } from '@/types/database'

interface RoleGuardProps {
  allowedRoles: AppRole[]
  redirectTo?: string
  children: React.ReactNode
}

/**
 * Server Component guard.
 * Redirect jika role user tidak ada dalam allowedRoles.
 */
export async function RoleGuard({
  allowedRoles,
  redirectTo = '/dashboard',
  children,
}: RoleGuardProps) {
  const role = await getUserRole()

  if (!role || !allowedRoles.includes(role)) {
    redirect(redirectTo)
  }

  return <>{children}</>
}
