// FILE: lib/permissions/index.ts
// Definisi permission (single source of truth di kode — type-safe).
// Mapping role → permission live di tabel role_permissions (DB),
// dengan fallback statis di bawah ini untuk sebelum migration 017 di-apply.
// Daftar role sendiri live di tabel roles (migration 019); DEFAULT_ROLES =
// fallback pre-migration & label hardcoded untuk dropdown add-user.

export const PERMISSIONS = {
  ALUMNI_MANAGE: 'alumni.manage',
  JOB_MANAGE: 'job.manage',
  CONTENT_MANAGE: 'content.manage',
  QUESTION_MANAGE: 'question.manage',
  EXPORT_RUN: 'export.run',
  SURVEY_VIEW: 'survey.view',
  ROLE_MANAGE: 'role.manage',
  PROFILE_EDIT: 'profile.edit',
  TRACK_RECORD_MANAGE: 'track_record.manage',
  TRACER_STUDY_SUBMIT: 'tracer_study.submit',
  JOB_VIEW: 'job.view',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS)

// Permission yang membuka akses area /admin (RoleGuard + filter sidebar).
export const ADMIN_ACTIONS: readonly Permission[] = [
  PERMISSIONS.ALUMNI_MANAGE,
  PERMISSIONS.QUESTION_MANAGE,
  PERMISSIONS.CONTENT_MANAGE,
  PERMISSIONS.JOB_MANAGE,
  PERMISSIONS.EXPORT_RUN,
  PERMISSIONS.SURVEY_VIEW,
  PERMISSIONS.ROLE_MANAGE,
]

// Role hardcoded — selalu ada (fallback pre-019 & opsi awal dropdown add-user).
export const DEFAULT_ROLES: readonly string[] = ['super_user', 'user']

// Role bawaan sistem yang tidak bisa dihapus.
export const LOCKED_ROLES: readonly string[] = ['super_user', 'user']

// Role yang permission-nya dikunci selalu penuh (anti self-lockout di matrix).
export const IMMUTABLE_PERMISSION_ROLES: readonly string[] = ['super_user']

// Fallback pre-migration: dipakai hanya jika query role_permissions gagal
// (tabel belum ada). Setelah migration 017 di-apply, DB jadi sumber utama.
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_user: [...ALL_PERMISSIONS],
  user: [
    PERMISSIONS.PROFILE_EDIT,
    PERMISSIONS.TRACK_RECORD_MANAGE,
    PERMISSIONS.TRACER_STUDY_SUBMIT,
    PERMISSIONS.JOB_VIEW,
  ],
}

// Validasi nama role baru — sinkron dengan check constraint migration 019.
export function isValidRoleName(name: string): boolean {
  return /^[a-z][a-z0-9_]{1,30}$/.test(name)
}

// Label tampilan role (role custom ditampilkan apa adanya).
export function roleLabel(role: string | null | undefined): string {
  if (!role) return '—'
  if (role === 'super_user') return 'Super User'
  if (role === 'user') return 'User'
  return role
}
