import { test, expect } from '@playwright/test'

// Batch 2 — SEO minimum. Locks in robots/sitemap/metadata behaviour.

test.describe('robots.txt', () => {
  test('disallows private areas + points to sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.status()).toBe(200)
    const body = await res.text()
    for (const p of ['/admin', '/account', '/api', '/checkout', '/cart']) {
      expect(body).toContain(`Disallow: ${p}`)
    }
    expect(body).toMatch(/Sitemap:\s*https?:\/\/[^\s]+\/sitemap\.xml/)
  })
})

test.describe('sitemap.xml', () => {
  test('includes published product, excludes unpublished + admin', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    const xml = await res.text()
    expect(xml).toContain('/products/cb1<')   // published
    expect(xml).not.toContain('/products/cb10<') // unpublished
    expect(xml).not.toContain('/admin')
    expect(xml).toContain('/products<')         // listing page
  })
})

test.describe('page metadata', () => {
  test('home has default title', async ({ page }) => {
    await page.goto('/', { timeout: 60000 })
    await expect(page).toHaveTitle(/ThaiGigaBike/)
  })

  test('/products uses title template', async ({ page }) => {
    await page.goto('/products', { timeout: 60000 })
    await expect(page).toHaveTitle(/· ThaiGigaBike$/)
  })

  test('published product has its own title + og:image', async ({ page }) => {
    await page.goto('/products/cb1', { timeout: 60000 })
    const og = page.locator('meta[property="og:image"]')
    await expect(og).toHaveAttribute('content', /^https?:\/\/.+/) // absolute via metadataBase
  })
})
