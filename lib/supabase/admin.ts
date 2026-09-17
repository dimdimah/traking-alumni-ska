// FILE: lib/supabase/admin.ts
// Server-only Supabase client dengan service_role key untuk operasi admin.
// HANYA digunakan di Server Actions — jangan pernah di client!
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
