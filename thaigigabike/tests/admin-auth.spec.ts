import { test, expect } from '@playwright/test'

// Skip entire suite if Supabase is not configured (local dev without .env.local).
// These tests exercise the middleware guard + the custom-auth login flow.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseConfigured = SUPABASE_URL.length > 0 && !SUPABASE_URL.includes('your-project')

test.describe('Admin auth — middleware guard (custom auth)', () => {
  test.skip(!supabaseConfigured, 'Requires Supabase to be configured')

  test('/admin redirects to /login when not authenticated', async ({ page }) => {
    await page.context().clearCookies()

    await page.goto('/admin')
    // Middleware sends unauthenticated visitors to /login?next=/admin
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin/, { timeout: 10000 })
  })

  test('/admin/login redirects to the unified /login page', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/admin/login')

    // Old admin login page is a server-side redirect now
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('/login page renders form', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/login')

    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /เข้าสู่ระบบ|Login|Sign in/i })).toBeVisible()
  })

  test('invalid credentials show generic Thai error — no username enumeration', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/login')

    await page.locator('input[type="email"]').fill('notadmin@example.com')
    await page.locator('input[type="password"]').fill('wrongpassword123')
    await page.getByRole('button', { name: /เข้าสู่ระบบ|Login|Sign in/i }).click()

    // Must show generic Thai error — never reveal if email exists
    await expect(page.getByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeVisible({ timeout: 10000 })

    // Must stay on login page — not redirected
    await expect(page).toHaveURL(/\/login/)
  })

  test('non-existent email shows same generic error as wrong password', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/login')

    await page.locator('input[type="email"]').fill('completely-unknown-9999@example.com')
    await page.locator('input[type="password"]').fill('anypassword123')
    await page.getByRole('button', { name: /เข้าสู่ระบบ|Login|Sign in/i }).click()

    // Same generic message regardless of whether email exists
    await expect(page.getByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeVisible({ timeout: 10000 })
  })

  test('/login is reachable (no redirect loop)', async ({ page }) => {
    await page.context().clearCookies()
    const response = await page.goto('/login')

    expect(response?.status()).toBeLessThan(400)
    await expect(page).toHaveURL(/\/login/)
  })

  test('/account redirects to /login when not authenticated', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/account')
    await expect(page).toHaveURL(/\/login\?next=%2Faccount/, { timeout: 10000 })
  })
})
