import { test, expect } from '@playwright/test'
import { sanitizeNextPath } from '../src/lib/safe-next'

// ── C1: open-redirect guard (sanitizeNextPath) ──────────────────────────────
test.describe('C1 — sanitizeNextPath (open-redirect guard)', () => {
  test('rejects absolute external URL → fallback /account', () => {
    expect(sanitizeNextPath('https://evil.com')).toBe('/account')
  })

  test('rejects protocol-relative //evil.com → fallback /account', () => {
    expect(sanitizeNextPath('//evil.com')).toBe('/account')
  })

  test('rejects backslash trick /\\evil.com → fallback /account', () => {
    expect(sanitizeNextPath('/\\evil.com')).toBe('/account')
  })

  test('rejects null / empty → fallback /account', () => {
    expect(sanitizeNextPath(null)).toBe('/account')
    expect(sanitizeNextPath('')).toBe('/account')
    expect(sanitizeNextPath('account')).toBe('/account') // no leading slash
  })

  test('keeps safe internal paths', () => {
    expect(sanitizeNextPath('/account/orders')).toBe('/account/orders')
    expect(sanitizeNextPath('/wishlist')).toBe('/wishlist')
  })
})

// ── C2: unpublished products must 404 via direct URL ────────────────────────
// cb1 = published, cb10 = unpublished (src/data/products.generated.ts)
test.describe('C2 — unpublished product not reachable by URL', () => {
  test('unpublished product /products/cb10 → 404', async ({ page }) => {
    const res = await page.goto('/products/cb10', { timeout: 60000 })
    expect(res?.status()).toBe(404)
  })

  test('published product /products/cb1 → 200', async ({ page }) => {
    const res = await page.goto('/products/cb1', { timeout: 60000 })
    expect(res?.status()).toBe(200)
  })
})
