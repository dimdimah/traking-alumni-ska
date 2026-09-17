import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function withAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export function orThrow(error: { message: string } | null, context: string, message: string) {
  if (error) {
    console.error(`${context}:`, error.message)
    throw new Error(message)
  }
}
