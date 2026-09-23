// FILE: components/auth/role-guard.tsx
import { redirect } from 'next/navigation'
import { getUserRole } from '@/utils/get-role'
import { can } from '@/lib/permissions/can'
import type { Permission } from '@/lib/permissions'

interface RoleGuardProps {
  /** Role yang diizinkan masuk (mis. ['super_user']). */
  allowedRoles?: readonly string[]
  /**
   * Permission yang dibutuhkan — pass jika user punya SATU SAJA dari daftar
   * (super_user selalu lolos karena memegang semua permission).
   */
  requiredActions?: readonly Permission[]
  redirectTo?: string
  children: React.ReactNode
}

/**
 * Server Component guard.
 * - Tanpa kriteria → cukup punya profile (role apa pun).
 * - allowedRoles → cek keanggotaan role.
 * - requiredActions → cek permission via can() (cache 5 menit).
 */
export async function RoleGuard({
  allowedRoles,
  requiredActions,
  redirectTo = '/dashboard',
  children,
}: RoleGuardProps) {
  const role = await getUserRole()

  if (!role) {
    redirect(redirectTo)
  }

  // Tanpa kriteria = butuh session saja
  if (!allowedRoles?.length && !requiredActions?.length) {
    return <>{children}</>
  }

  if (allowedRoles?.includes(role)) {
    return <>{children}</>
  }

  if (requiredActions?.length) {
    for (const action of requiredActions) {
      if (await can(role, action)) {
        return <>{children}</>
      }
    }
  }

  redirect(redirectTo)
}
