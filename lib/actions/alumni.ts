'use server'

import { revalidatePath, unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

export async function addUser(email: string, password: string, display_name: string, graduation_year?: string | null): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null; error: unknown }

  if (profile?.role !== 'super_user') {
    throw new Error('Forbidden: Hanya admin yang bisa menambah user')
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
        role: 'user',
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
    // 3× count head-only via admin client (tanpa cookies agar bisa di-cache) — tanpa fetch rows
    const supabase = createAdminClient()
    const [{ count: alumniCount }, { count: superCount }, { count: tracerCount }] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'super_user'),
      supabase.from('tracer_study_responses').select('id', { count: 'exact', head: true }),
    ])
    return {
      totalAlumni: alumniCount || 0,
      totalSuperUsers: superCount || 0,
      totalUsers: (alumniCount || 0) + (superCount || 0),
      SistemAlumniFilled: tracerCount || 0,
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
