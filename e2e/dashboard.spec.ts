import { test, expect } from '@playwright/test'

test.describe('Protected Routes (Unauthenticated)', () => {
  test('should redirect to login when accessing /dashboard', async ({ page }) => {
    await page.goto('/dashboard')

    // Should redirect to /login because not authenticated
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('should redirect to login when accessing /admin', async ({ page }) => {
    await page.goto('/admin')

    // Should redirect to /login because not authenticated
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})
