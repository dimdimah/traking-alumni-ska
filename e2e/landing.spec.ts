import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should display hero section with title and description', async ({ page }) => {
    await page.goto('/')

    // Verify the main heading
    await expect(
      page.getByRole('heading', { name: /telusuri jejak alumni/i })
    ).toBeVisible()

    // Verify CTA buttons exist
    await expect(
      page.getByRole('link', { name: /mulai sekarang|login/i }).first()
    ).toBeVisible()

    // Verify feature section is present
    await expect(
      page.getByRole('heading', { name: /fitur lengkap/i })
    ).toBeVisible()
  })

  test('should navigate to login page when clicking Masuk', async ({ page }) => {
    await page.goto('/')

    // Click the login/masuk link
    const masukButton = page.getByRole('link', { name: /masuk/i }).first()
    await masukButton.click()

    // Should navigate to /login
    await expect(page).toHaveURL(/\/login/)
  })
})
