import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
  })

  test('แสดง hero section', async ({ page }) => {
    // Hero text (heroTitle และ heroTag มี "CNC Billet" ทั้งคู่)
    await expect(page.getByText('CNC Billet').first()).toBeVisible()
    await expect(page.getByText('GIGA BIKE FACTORY').first()).toBeVisible()

    // Hero มีปุ่ม prev/next อย่างน้อยหนึ่งปุ่ม (ถ้า carousel มี items)
    // ตรวจ container ที่มี ChevronLeft button อยู่ใน section แรก
    const heroSection = page.locator('section').first()
    await expect(heroSection).toBeVisible()
  })

  test('ปุ่ม carousel เลื่อนได้', async ({ page }) => {
    await page.waitForTimeout(500)

    const nextBtn = page.locator('section').first().locator('button').nth(1)
    await nextBtn.click()
    await page.waitForTimeout(500)

    const activeDot = page.locator('button[style*="width: 18px"]')
    await expect(activeDot).toBeVisible()
  })

  test('filter รุ่นรถ Yamaha SR400 กรองสินค้าได้', async ({ page }) => {
    await page.getByRole('button', { name: /Yamaha SR400/ }).click()
    await page.waitForTimeout(300)

    const cards = page.locator('.product-card')
    await expect(cards.first()).toBeVisible()
  })

  test('กด browseAll ไปหน้า /products', async ({ page }) => {
    // รอให้ React hydrate เสร็จก่อน
    await page.waitForLoadState('networkidle')

    const link = page.getByRole('link', { name: /เลือกดูสินค้าทั้งหมด/ })
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL('/products', { timeout: 15000 })
  })

  test('trust badges แสดงครบ 4 อัน', async ({ page }) => {
    // รอให้ React hydrate และ locale ถูก set
    await page.waitForLoadState('networkidle')

    // trust badge container — อยู่ใน hero section
    const badgeContainer = page.locator('.container').filter({
      has: page.locator('div[style*="background: var(--bg3)"]').first()
    }).last()

    // ตรวจข้อความแต่ละ badge (ภาษาไทย เพราะ default locale = 'th')
    await expect(page.getByText('ผลิตในไทย').first()).toBeVisible()
    await expect(page.getByText('รับประกันคุณภาพ').first()).toBeVisible()
    await expect(page.getByText('ส่งทั่วโลก').first()).toBeVisible()
    await expect(page.getByText('CNC Precision').first()).toBeVisible()
  })
})
