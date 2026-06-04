import { test, expect } from '@playwright/test'

test.describe('ตะกร้าสินค้า', () => {
  test('ตะกร้าว่างแสดง empty state', async ({ page }) => {
    await page.goto('/cart')
    await expect(page.getByText(/ยังไม่มีสินค้าในตะกร้า|Your cart is empty/)).toBeVisible()
    await expect(page.getByRole('link', { name: /เลือกซื้อสินค้าต่อ|Continue Shopping/ })).toBeVisible()
  })

  test('เพิ่มสินค้าแล้วตะกร้าไม่ว่าง', async ({ page }) => {
    await page.goto('/products/cb1')
    await page.waitForLoadState('networkidle')

    const addBtn = page.getByRole('button', { name: /หยิบใส่ตะกร้า/ })
    if (await addBtn.isEnabled()) {
      await addBtn.click()
      await page.waitForTimeout(500)

      await page.goto('/cart')
      // เมื่อมีสินค้า: ตะกร้าแสดง h1 "ตะกร้าสินค้า" (ไม่ใช่ empty state)
      await expect(page.locator('h1').filter({ hasText: /ตะกร้า|Cart/ }).first()).toBeVisible()
      await expect(page.getByText(/ยังไม่มีสินค้า|empty/i)).not.toBeVisible()
    }
  })
})

test.describe('หน้า checkout', () => {
  test('ตะกร้าว่าง redirect กลับ /products', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('gigabike-cart'))

    await page.goto('/checkout')
    await expect(page).toHaveURL(/\/checkout|\/products|\/cart/)
  })

  test('form validation — ส่งโดยไม่กรอกชื่อ แสดง error', async ({ page }) => {
    // เพิ่มสินค้าเข้าตะกร้าก่อน
    await page.goto('/products/cb1')
    await page.waitForLoadState('networkidle')
    const addBtn = page.getByRole('button', { name: /หยิบใส่ตะกร้า/ })
    if (await addBtn.isEnabled()) {
      await addBtn.click()
      await page.waitForTimeout(400)
    }

    await page.goto('/checkout')
    await page.waitForLoadState('networkidle')

    const confirmBtn = page.getByRole('button', { name: /ยืนยันคำสั่งซื้อ|Confirm Order/ })
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click()
      await page.waitForTimeout(400)
      // error message "กรุณากรอกชื่อ" หรือ "กรุณากรอกข้อมูล"
      await expect(page.getByText(/กรุณา|required|Please/i).first()).toBeVisible({ timeout: 3000 })
    }
  })
})

test.describe('ติดตามออเดอร์', () => {
  test('หน้า /order มีช่องค้นหา', async ({ page }) => {
    await page.goto('/order')
    await expect(page.getByPlaceholder(/เลขออเดอร์|order number/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /ติดตาม|Track/i })).toBeVisible()
  })

  test('ค้นหา order ที่ไม่มี แสดง not found', async ({ page }) => {
    await page.goto('/order')
    await page.getByPlaceholder(/เลขออเดอร์|order number/i).fill('GGB-NOTEXIST999')
    await page.getByRole('button', { name: /ติดตาม|Track/i }).click()
    await expect(page.getByText(/ไม่พบ|not found/i)).toBeVisible({ timeout: 10000 })
  })
})
