import { test, expect } from '@playwright/test'

// Skip entire suite if Supabase is not configured (local dev without .env.local).
// These tests exercise the full middleware + API login flow.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseConfigured = SUPABASE_URL.length > 0 && !SUPABASE_URL.includes('your-project')

test.describe('Admin auth — middleware guard', () => {
  test.skip(!supabaseConfigured, 'Requires Supabase to be configured')

  test('/admin redirects to /admin/login when not authenticated', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies()

    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10000 })
  })

  test('/admin/login page renders form', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/admin/login')

    await expect(page.getByRole('heading', { name: /เข้าสู่ระบบ/ })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /เข้าสู่ระบบ/ })).toBeVisible()
  })

  test('invalid credentials show generic Thai error — no username enumeration', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/admin/login')

    await page.locator('input[type="email"]').fill('notadmin@example.com')
    await page.locator('input[type="password"]').fill('wrongpassword123')
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click()

    // Must show generic Thai error — never reveal if email exists or is allowlisted
    await expect(page.getByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeVisible({ timeout: 10000 })

    // Must stay on login page — not redirected to admin
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('non-existent email shows same generic error as wrong password', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/admin/login')

    await page.locator('input[type="email"]').fill('completely-unknown-9999@example.com')
    await page.locator('input[type="password"]').fill('anypassword123')
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click()

    // Same generic message regardless of whether email exists
    await expect(page.getByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeVisible({ timeout: 10000 })
  })

  test('short password (< 8 chars) blocked client-side before API call', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/admin/login')

    await page.locator('input[type="email"]').fill('admin@example.com')
    await page.locator('input[type="password"]').fill('short')
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click()

    // Client-side validation fires before fetch — no network call made
    await expect(page.getByText(/รหัสผ่านต้องมีอย่างน้อย 8/)).toBeVisible({ timeout: 3000 })
  })

  test('/admin/login is reachable (no redirect loop)', async ({ page }) => {
    await page.context().clearCookies()
    const response = await page.goto('/admin/login')

    // Must load successfully, not loop
    expect(response?.status()).toBeLessThan(400)
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('?error=unauthorized on login page shows not-authorised message', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/admin/login?error=unauthorized')

    await expect(page.getByText('คุณไม่มีสิทธิ์เข้าถึงระบบแอดมิน')).toBeVisible({ timeout: 5000 })
  })
})
