'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type LoginState = {
  error: string | null
  redirectTo: string | null
}

const ALLOWED_DOMAIN = 'amikomsolo.ac.id'

const SAFE_NEXT_PREFIXES = ['/dashboard', '/admin', '/user', '/super-user']

function safeNext(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== 'string' || raw.length === 0) return null
  if (raw.startsWith('//') || raw.includes('://')) return null
  return SAFE_NEXT_PREFIXES.some((prefix) => raw.startsWith(prefix)) ? raw : null
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = (formData.get('email') as string) || ''
  const next = safeNext(formData.get('next'))

  if (!email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN.toLowerCase()}`)) {
    return { error: `Hanya email @${ALLOWED_DOMAIN} yang diizinkan`, redirectTo: null }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: formData.get('password') as string,
  })

  if (error) {
    let errorMessage = error.message
    if (errorMessage === 'Invalid login credentials') {
      errorMessage = 'Email atau kata sandi yang Anda masukkan salah.'
    }
    return { error: errorMessage, redirectTo: null }
  }

  const userId = data?.user?.id

  if (userId) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single() as { data: { role: string } | null; error: unknown }

    if (profileData?.role === 'super_user') {
      return { error: null, redirectTo: next ?? '/admin' }
    }
  }

  return { error: null, redirectTo: next ?? '/dashboard' }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
