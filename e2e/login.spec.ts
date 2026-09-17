import { test, expect } from '@playwright/test'

test.describe('Login Page', () => {
  test('should display login form with email and password fields', async ({ page }) => {
    await page.goto('/login')

    // Verify login form elements
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password|kata sandi/i)).toBeVisible()
    await expect(
      page.getByRole('button', { name: /masuk|login/i })
    ).toBeVisible()
  })

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill with invalid credentials
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password|kata sandi/i).fill('wrongpassword')

    await page.getByRole('button', { name: /masuk|login/i }).click()

    // Should show an error message (either toast or inline error)
    await expect(page.getByText(/gagal|error|tidak ditemukan|invalid/i).first()).toBeVisible({ timeout: 10000 })
  })
})
