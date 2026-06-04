import { test, expect } from '@playwright/test'

test.describe('หน้าสินค้า (/products)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products')
    await page.waitForLoadState('networkidle')
  })

  test('แสดงจำนวนสินค้าที่ published', async ({ page }) => {
    // header แสดง "${products.length} รายการ"
    const headerCount = page.locator('section p').filter({ hasText: /รายการ/ }).first()
    await expect(headerCount).toBeVisible()
    const text = await headerCount.textContent()
    const count = parseInt(text?.match(/\d+/)?.[0] ?? '0')
    expect(count).toBeGreaterThan(0)
  })

  test('ค้นหาด้วยรหัสสินค้า CB.1 ได้', async ({ page }) => {
    await page.getByPlaceholder(/ค้นหาสินค้า/).fill('CB.1')
    await page.waitForTimeout(400)

    const cards = page.locator('.product-card')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThan(50)
  })

  test('กรอง category เบรค แล้วสินค้าลดลง', async ({ page }) => {
    // header count (ไม่เปลี่ยนตามกรอง)
    const headerP = page.locator('section p').filter({ hasText: /รายการ/ }).first()
    const totalText = await headerP.textContent()
    const total = parseInt(totalText?.match(/\d+/)?.[0] ?? '0')

    await page.getByRole('button', { name: 'เบรค' }).click()
    await page.waitForTimeout(400)

    // grid count (เปลี่ยนตามกรอง) — อยู่ใน aside section ที่ 2
    const gridP = page.locator('[class="container section grid-products"] p').filter({ hasText: /รายการ/ }).first()
    const filteredText = await gridP.textContent()
    const filtered = parseInt(filteredText?.match(/\d+/)?.[0] ?? '0')

    expect(filtered).toBeLessThan(total)
    expect(filtered).toBeGreaterThan(0)
  })

  test('กดการ์ดสินค้าไปหน้า detail ได้', async ({ page }) => {
    const firstCard = page.locator('.product-card a').first()
    await firstCard.click()
    await expect(page).toHaveURL(/\/products\/\w+/)
  })
})

test.describe('หน้า product detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products/cb1')
    await page.waitForLoadState('networkidle')
  })

  test('แสดง h1 + ราคา + ปุ่มหยิบใส่ตะกร้า', async ({ page }) => {
    // ชื่อสินค้า
    await expect(page.locator('h1').first()).toBeVisible()

    // ราคา — price div มี ฿ และตัวเลข
    const priceEl = page.locator('div').filter({ hasText: /^฿[\d,]+$/ }).first()
    await expect(priceEl).toBeVisible()

    // ปุ่มหยิบ
    await expect(page.getByRole('button', { name: /หยิบใส่ตะกร้า/ })).toBeVisible()

    // Breadcrumb link สินค้า
    await expect(page.getByRole('link', { name: /สินค้า/ }).first()).toBeVisible()
  })

  test('เพิ่มสินค้าลงตะกร้าได้', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /หยิบใส่ตะกร้า/ })
    await expect(addBtn).toBeVisible()

    if (await addBtn.isEnabled()) {
      await addBtn.click()
      await expect(page.getByText(/เพิ่มแล้ว/)).toBeVisible({ timeout: 3000 })
    }
  })
})
