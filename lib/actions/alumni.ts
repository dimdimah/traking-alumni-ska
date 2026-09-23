'use server'

import { revalidatePath, unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/permissions/guards'
import { PERMISSIONS, DEFAULT_ROLES } from '@/lib/permissions'
import type { Profile } from '@/types/database'
import { z } from 'zod'

const addUserSchema = z.object({
  email: z.string().email('Email tidak valid').refine(
    (e) => e.toLowerCase().endsWith('@amikomsolo.ac.id'),
    'Harus menggunakan domain @amikomsolo.ac.id'
  ),
  password: z.string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Harus mengandung huruf kapital')
    .regex(/[a-z]/, 'Harus mengandung huruf kecil')
    .regex(/[0-9]/, 'Harus mengandung angka'),
  display_name: z.string().min(1, 'Nama wajib diisi'),
  graduation_year: z.string().nullable().optional(),
})

export async function addUser(
  email: string,
  password: string,
  display_name: string,
  graduation_year?: string | null,
  role: string = 'user'
): Promise<{ success: boolean; error?: string }> {
  await requirePermission(PERMISSIONS.ALUMNI_MANAGE)

  // Role selain 'user' (super_user / role custom) = elevasi akses → wajib role.manage
  if (role !== 'user') {
    await requirePermission(PERMISSIONS.ROLE_MANAGE)
    let valid = DEFAULT_ROLES.includes(role)
    if (!valid) {
      const adminCheck = createAdminClient()
      const { data } = await adminCheck.from('roles').select('name').eq('name', role).maybeSingle()
      valid = !!data
    }
    if (!valid) {
      return { success: false, error: 'Role tidak dikenal' }
    }
  }

  const parsed = addUserSchema.safeParse({ email, password, display_name, graduation_year })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', ') }
  }

  const adminSupabase = createAdminClient()
  const { data: userData, error } = await adminSupabase.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { display_name: parsed.data.display_name },
  })

  if (error) {
    return { success: false, error: 'Gagal membuat user. Email mungkin sudah terdaftar.' }
  }

  if (userData?.user) {
    const graduationYearNum = parsed.data.graduation_year
      ? parseInt(parsed.data.graduation_year, 10)
      : null

    const { error: profileError } = await adminSupabase
      .from('profiles')
      .update({
        full_name: parsed.data.display_name,
        role,
        ...(graduationYearNum && !isNaN(graduationYearNum) ? { graduation_year: graduationYearNum } : {}),
      })
      .eq('id', userData.user.id)

    if (profileError) {
      console.error('Gagal update profil:', profileError.message)
    }
  }

  revalidatePath('/admin/alumni')
  return { success: true }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  await requirePermission(PERMISSIONS.ALUMNI_MANAGE)

  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) {
    console.error('Gagal reset password:', error.message)
    throw new Error('Gagal mereset password. Silakan coba lagi.')
  }
  revalidatePath('/admin/alumni')
}

export async function deleteUser(userId: string) {
  await requirePermission(PERMISSIONS.ALUMNI_MANAGE)

  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase.auth.admin.deleteUser(userId)
  if (error) {
    console.error('Gagal hapus user:', error.message)
    throw new Error('Gagal menghapus user. Silakan coba lagi.')
  }
  revalidatePath('/admin/alumni')
}

const getAlumniStatsCached = unstable_cache(
  async () => {
    // head-only via admin client (tanpa cookies agar bisa di-cache) — plus
    // agregat byAngkatan untuk progress per angkatan di /admin (UI GitHub).
    const supabase = createAdminClient()
    const [{ count: alumniCount }, { count: superCount }, { count: tracerCount }, { data: respRows }, { data: profileRows }, { data: questionYears }] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'super_user'),
      supabase.from('tracer_study_responses').select('id', { count: 'exact', head: true }),
      supabase.from('tracer_study_responses').select('graduation_year'),
      supabase.from('profiles').select('graduation_year').eq('role', 'user'),
      supabase.from('tracer_study_questions').select('angkatan'),
    ])

    const respYearCounts: Record<number, number> = {}
    for (const row of (respRows ?? []) as { graduation_year: number | null }[]) {
      const y = row.graduation_year
      if (y) respYearCounts[y] = (respYearCounts[y] || 0) + 1
    }

    const totalYearCounts: Record<number, number> = {}
    for (const row of (profileRows ?? []) as { graduation_year: number | null }[]) {
      const y = row.graduation_year
      if (y) totalYearCounts[y] = (totalYearCounts[y] || 0) + 1
    }

    // Angkatan tracer study = gabungan tahun pada tracer_study_questions + tracer_study_responses
    const angkatanYearSet = new Set<number>([
      ...Object.keys(respYearCounts).map(Number),
      ...(questionYears ?? []).map((row) => Number(row.angkatan)).filter((y: number) => Number.isFinite(y) && y > 0),
    ])

    const byAngkatan = [...angkatanYearSet]
      .map((year) => ({
        angkatan: year,
        totalAlumni: totalYearCounts[year] || 0,
        filled: respYearCounts[year] || 0,
      }))
      .sort((a, b) => b.angkatan - a.angkatan)

    return {
      totalAlumni: alumniCount || 0,
      totalSuperUsers: superCount || 0,
      totalUsers: (alumniCount || 0) + (superCount || 0),
      SistemAlumniFilled: tracerCount || 0,
      byAngkatan,
    }
  },
  ['alumni-stats'],
  { revalidate: 60, tags: ['admin-stats'] }
)

export async function getAlumniStats() {
  return getAlumniStatsCached()
}

export async function getUsersPaginated(page: number, perPage: number = 20) {
  const supabase = await createClient()
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const { data, count } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, nim, phone, graduation_year, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  return {
    users: (data as Pick<Profile, 'id' | 'email' | 'full_name' | 'role' | 'nim' | 'phone' | 'graduation_year' | 'created_at'>[]) || [],
    total: count || 0,
    totalPages: Math.ceil((count || 0) / perPage),
  }
}
