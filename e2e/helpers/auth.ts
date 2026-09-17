import type { Page } from '@playwright/test'

// ─── Mock Data ───

export const MOCK_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'alumni@amikomsolo.ac.id',
  role: 'user',
  aud: 'authenticated',
  confirmed_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-06-01T00:00:00Z',
  last_sign_in_at: '2024-06-01T00:00:00Z',
  app_metadata: { provider: 'email' },
  user_metadata: {},
}

export const MOCK_PROFILE = {
  id: MOCK_USER.id,
  email: MOCK_USER.email,
  role: MOCK_USER.role,
  full_name: 'Alumni Amikom',
  nim: 'A24.2024.00001',
  tanggal_lahir: '2000-01-15',
  phone: '081234567890',
  bio: 'Fresh graduate Teknik Informatika',
  skills: ['JavaScript', 'React', 'Node.js', 'Python'],
  location: 'Surakarta',
  education_level: 'S1',
  expected_salary: '5-10 juta',
  preferred_type: 'Full-time',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-06-01T00:00:00Z',
}

export const MOCK_TRACK_RECORDS = [
  {
    id: 'tr-001',
    user_id: MOCK_USER.id,
    company: 'PT Teknologi Maju',
    position: 'Junior Developer',
    start_date: '2024-03-01',
    end_date: null,
    description: 'Mengembangkan aplikasi web internal',
    is_current: true,
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z',
  },
]

// ─── Route Interception Setup ───

/**
 * Set up Playwright route interception to mock all Supabase API calls.
 * This handles the CLIENT-SIDE data fetching after the middleware passes.
 *
 * Note: The middleware (`middleware.ts`) runs on the Next.js server and
 * calls `supabase.auth.getUser()` directly via fetch. Playwright's
 * `page.route()` cannot intercept server-side requests. For the middleware
 * to pass, valid `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
 * must be set in `.env.local`.
 */
/**
 * Mock response helpers for Supabase REST API format
 */
function jsonResponse(body: unknown, extraHeaders?: Record<string, string>) {
  return {
    status: 200 as const,
    contentType: 'application/json' as const,
    body: JSON.stringify(body),
    headers: { 'access-control-allow-origin': '*', ...extraHeaders },
  }
}

function pgError(code: string, message: string) {
  return { code, message, details: null, hint: null }
}

export async function setupSupabaseMocks(page: Page) {
  await page.route('**/*.supabase.co/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    // ── CORS preflight ──
    if (method === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET, POST, PATCH, DELETE, HEAD',
          'access-control-allow-headers': '*',
          'access-control-max-age': '86400',
        },
      })
    }

    // ── HEAD requests (used by `head: true` + `count: exact`) ──
    if (method === 'HEAD') {
      if (url.includes('/track_records')) {
        return route.fulfill({ status: 200, headers: { 'content-range': '0-0/1' } })
      }
      if (url.includes('/jobs')) {
        return route.fulfill({ status: 200, headers: { 'content-range': '0-0/3' } })
      }
      return route.fulfill({ status: 200 })
    }

    // ── Auth: GET /auth/v1/user ──
    if (method === 'GET' && url.includes('/auth/v1/user')) {
      return route.fulfill(jsonResponse(MOCK_USER))
    }

    // ── Auth: POST /auth/v1/token (sign-in) ──
    if (method === 'POST' && url.includes('/auth/v1/token')) {
      return route.fulfill(
        jsonResponse({
          access_token: 'mock-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: 'mock-refresh-token',
          user: MOCK_USER,
        })
      )
    }

    // ── REST: profiles ──
    if (url.includes('/rest/v1/profiles')) {
      if (url.includes('select=role')) {
        return route.fulfill(jsonResponse({ role: MOCK_USER.role }))
      }
      return route.fulfill(jsonResponse(MOCK_PROFILE))
    }

    // ── REST: track_records (GET, not HEAD) ──
    if (method === 'GET' && url.includes('/rest/v1/track_records')) {
      return route.fulfill(jsonResponse(MOCK_TRACK_RECORDS))
    }

    // ── REST: tracer_study_responses ──
    if (url.includes('/rest/v1/tracer_study_responses')) {
      // Simulate .single() finding 0 rows → PGRST116
      return route.fulfill({
        status: 406,
        contentType: 'application/json',
        body: JSON.stringify(pgError('PGRST116', 'Rows contain 0 elements')),
        headers: { 'access-control-allow-origin': '*' },
      })
    }

    // ── REST: jobs (GET, not HEAD) ──
    if (method === 'GET' && url.includes('/rest/v1/jobs')) {
      return route.fulfill(jsonResponse([]))
    }

    // ── Default: pass through ──
    return route.continue()
  })
}

/**
 * Try to set auth cookies that the middleware can read.
 * This extracts the project ref from SUPABASE_URL to construct the cookie name.
 */
export async function setAuthCookie(page: Page) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    console.warn('[E2E] NEXT_PUBLIC_SUPABASE_URL not set — skipping auth cookie')
    return false
  }

  // Extract project ref from URL: https://<ref>.supabase.co
  const match = supabaseUrl.match(/https?:\/\/(.+)\.supabase\.co/)
  if (!match) {
    console.warn('[E2E] Could not extract project ref from SUPABASE_URL')
    return false
  }

  const projectRef = match[1]
  const cookieName = `sb-${projectRef}-auth-token`

  // Create a mock session that the SSR client can parse
  const mockSession = {
    access_token: 'mock-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock-refresh-token',
    user: MOCK_USER,
  }

  await page.context().addCookies([
    {
      name: cookieName,
      value: Buffer.from(JSON.stringify(mockSession)).toString('base64'),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax' as const,
    },
  ])

  return true
}
