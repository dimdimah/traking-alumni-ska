import { test, expect, type Page } from '@playwright/test'
import { setupSupabaseMocks, setAuthCookie, MOCK_PROFILE } from './helpers/auth'

/**
 * Shared helper: set up mock Supabase API, try to set auth cookie for
 * middleware bypass, navigate to path, and skip if middleware blocks.
 *
 * NOTE: Middleware runs server-side and calls real Supabase API to validate
 * the auth token. Playwright's page.route() cannot intercept server-side
 * requests. The fake cookie we set will be rejected by the real API unless
 * valid Supabase credentials are configured in .env.local.
 */
async function authenticated(page: Page, path: string) {
  await setupSupabaseMocks(page)
  await setAuthCookie(page)
  await page.goto(path)

  if (page.url().includes('/login')) {
    test.skip(
      true,
      'Skipping: memerlukan kredensial Supabase valid di .env.local — ' +
        'middleware tidak bisa di-intercept oleh page.route()'
    )
  }
}

test.describe('Dashboard (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await authenticated(page, '/dashboard')
  })

  test('should display dashboard overview page with stats', async ({ page }) => {
    // Wait for the page to render (the protected layout fetches profile)
    await expect(page.getByRole('heading', { name: /overview/i })).toBeVisible({
      timeout: 15000,
    })

    // Verify PageHeader is rendered
    await expect(page.getByText(/dashboard/i)).toBeVisible()

    // Verify stat cards exist
    await expect(page.getByText(/track record/i)).toBeVisible()
    await expect(page.getByText(/kuesioner|tracer study/i)).toBeVisible()
    await expect(page.getByText(/lowongan/i)).toBeVisible()
    await expect(page.getByText(/lengkapi|profil/i)).toBeVisible()
  })

  test('should display Quick Actions grid', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /overview/i })).toBeVisible({
      timeout: 15000,
    })

    await expect(page.getByText(/quick actions/i)).toBeVisible()

    // Quick action links should exist
    await expect(
      page.getByRole('link', { name: /track record/i }).first()
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /tracer study|kuesioner/i }).first()
    ).toBeVisible()
  })

  test('should display Account Info card with email and role', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /overview/i })).toBeVisible({
      timeout: 15000,
    })

    await expect(page.getByText(/account info/i)).toBeVisible()
    await expect(page.getByText(MOCK_PROFILE.email)).toBeVisible()
  })

  test('should have working sidebar navigation', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /overview/i })).toBeVisible({
      timeout: 15000,
    })

    // Sidebar links should be visible on desktop width
    await expect(page.getByRole('link', { name: /beranda/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /track record/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /profil/i })).toBeVisible()
  })

  test('should display user avatar initial in navbar', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /overview/i })).toBeVisible({
      timeout: 15000,
    })

    // User avatar initial (first letter of email) should be visible
    const initial = MOCK_PROFILE.email!.charAt(0).toUpperCase()
    await expect(page.getByText(initial).first()).toBeVisible()

    // User menu trigger should exist
    await expect(page.getByLabel(/menu pengguna|pengguna/i)).toBeVisible()
  })
})

// ── Sub-pages ──

const SUB_PAGES = [
  { path: '/dashboard/track-record', title: /track record/i },
  { path: '/dashboard/profile', title: /profil/i },
  { path: '/dashboard/tracer-study', title: /tracer study|kuesioner/i },
  { path: '/dashboard/career', title: /lowongan|karir/i },
] as const

for (const { path, title } of SUB_PAGES) {
  test.describe(`Page: ${path}`, () => {
    test.beforeEach(async ({ page }) => {
      await authenticated(page, path)
    })

    test('should render the page header', async ({ page }) => {
      await expect(page.getByText(title).first()).toBeVisible({ timeout: 15000 })
    })
  })
}

// ── Admin redirect ──

test.describe('Admin Dashboard (role=user)', () => {
  test.beforeEach(async ({ page }) => {
    await authenticated(page, '/admin')
  })

  test('should redirect non-super_user to /dashboard', async ({ page }) => {
    // Our mock profile has role='user', so if middleware passes, it should
    // redirect to /dashboard. This only works with valid .env.local.
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    await expect(page.getByRole('heading', { name: /overview/i })).toBeVisible({
      timeout: 10000,
    })
  })
})
