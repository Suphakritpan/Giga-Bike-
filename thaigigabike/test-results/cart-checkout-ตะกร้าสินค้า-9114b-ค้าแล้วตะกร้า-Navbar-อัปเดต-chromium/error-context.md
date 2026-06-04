# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cart-checkout.spec.ts >> ตะกร้าสินค้า >> เพิ่มสินค้าแล้วตะกร้า Navbar อัปเดต
- Location: tests\cart-checkout.spec.ts:10:7

# Error details

```
Error: locator.isEnabled: Error: strict mode violation: getByRole('button', { name: /หยิบใส่ตะกร้า/ }) resolved to 5 elements:
    1) <button class="btn-primary">…</button> aka getByText('หยิบใส่ตะกร้า')
    2) <button title="หยิบใส่ตะกร้า">…</button> aka getByRole('button', { name: 'หยิบใส่ตะกร้า' }).nth(1)
    3) <button title="หยิบใส่ตะกร้า">…</button> aka getByRole('button', { name: 'หยิบใส่ตะกร้า' }).nth(2)
    4) <button title="หยิบใส่ตะกร้า">…</button> aka getByRole('button', { name: 'หยิบใส่ตะกร้า' }).nth(3)
    5) <button title="หยิบใส่ตะกร้า">…</button> aka getByRole('button', { name: 'หยิบใส่ตะกร้า' }).nth(4)

Call log:
  - waiting for getByRole('button', { name: /หยิบใส่ตะกร้า/ })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - img [ref=e4]
    - generic [ref=e6]: ThaiGigaBike
  - banner [ref=e9]:
    - generic [ref=e10]:
      - link "ThaiGigaBike" [ref=e11] [cursor=pointer]:
        - /url: /
        - img [ref=e12]
        - generic [ref=e14]: ThaiGigaBike
      - navigation [ref=e15]:
        - link "หน้าแรก" [ref=e16] [cursor=pointer]:
          - /url: /
        - link "สินค้า" [ref=e17] [cursor=pointer]:
          - /url: /products
        - link "หมวดหมู่" [ref=e18] [cursor=pointer]:
          - /url: /categories
        - link "ผลงาน" [ref=e19] [cursor=pointer]:
          - /url: /gallery
        - link "ติดต่อ" [ref=e20] [cursor=pointer]:
          - /url: /contact
      - generic [ref=e21]:
        - button [ref=e22] [cursor=pointer]:
          - img [ref=e23]
        - button "ธีมมืด" [ref=e26] [cursor=pointer]:
          - img [ref=e27]
        - generic [ref=e29]:
          - button "TH" [ref=e30] [cursor=pointer]
          - button "EN" [ref=e31] [cursor=pointer]
        - link "ตะกร้า" [ref=e32] [cursor=pointer]:
          - /url: /cart
          - button "ตะกร้า" [ref=e33]:
            - img [ref=e34]
            - text: ตะกร้า
  - main [ref=e38]:
    - generic [ref=e39]:
      - generic [ref=e41]:
        - link "หน้าแรก" [ref=e42] [cursor=pointer]:
          - /url: /
        - img [ref=e43]
        - link "สินค้า" [ref=e45] [cursor=pointer]:
          - /url: /products
        - img [ref=e46]
        - generic [ref=e48]: CB.1
      - generic [ref=e49]:
        - generic [ref=e50]:
          - generic [ref=e52]:
            - img "Top Yoke Bolt Billet น๊อตขันแผงคอบนแต่ง Honda Cb750,GB250-400" [ref=e53]
            - img [ref=e55]
          - generic [ref=e58]:
            - generic [ref=e59]: "รหัสสินค้า: CB.1"
            - heading "Top Yoke Bolt Billet น๊อตขันแผงคอบนแต่ง Honda Cb750,GB250-400" [level=1] [ref=e60]
            - generic [ref=e61]: ฿1,000
            - generic [ref=e62]:
              - generic [ref=e63]:
                - img [ref=e64]
                - text: มีสินค้า
              - generic [ref=e66]: CNC Billet
              - generic [ref=e67]: STAINLESS
            - generic [ref=e68]:
              - generic [ref=e69]: "ใส่ได้กับ:"
              - text: Honda CB750 K0-K7
            - generic [ref=e70]:
              - generic [ref=e71]: "จำนวน:"
              - button [ref=e72] [cursor=pointer]:
                - img [ref=e73]
              - generic [ref=e74]: "1"
              - button [ref=e75] [cursor=pointer]:
                - img [ref=e76]
              - generic [ref=e77]: มี 10 ชิ้น
            - generic [ref=e78]:
              - button "หยิบใส่ตะกร้า" [ref=e79] [cursor=pointer]:
                - img [ref=e80]
                - text: หยิบใส่ตะกร้า
              - link "สอบถาม LINE" [ref=e84] [cursor=pointer]:
                - /url: https://line.me/ti/p/~thaigigabike
            - generic [ref=e85]:
              - generic [ref=e86]: "วัสดุ:"
              - text: STAINLESS + ปิเนียมอย่างดี
        - generic [ref=e88]:
          - heading "รายละเอียดสินค้า" [level=3] [ref=e89]
          - paragraph [ref=e90]: Top Yoke Bolt Billet น๊อตขันแผงคอบนแต่ง Honda Cb750,GB250-400 ผลิตจาก STAINLESS + ปิเนียมอย่างดี อันละ
        - generic [ref=e91]:
          - heading "สินค้าที่เกี่ยวข้อง" [level=3] [ref=e92]
          - generic [ref=e93]:
            - generic [ref=e94]:
              - link "Fender Front Long 500 mm. บังโคลนหน้าแต่ง CB750 k0-k7 ความยาว 500 mm.ผ" [ref=e95] [cursor=pointer]:
                - /url: /products/cb2
                - img "Fender Front Long 500 mm. บังโคลนหน้าแต่ง CB750 k0-k7 ความยาว 500 mm.ผ" [ref=e97]
              - generic [ref=e98]:
                - generic [ref=e99]: CB.2
                - link "Fender Front Long 500 mm. บังโคลนหน้าแต่ง CB750 k0-k7 ความยาว 500 mm.ผ" [ref=e100] [cursor=pointer]:
                  - /url: /products/cb2
                  - generic [ref=e101]: Fender Front Long 500 mm. บังโคลนหน้าแต่ง CB750 k0-k7 ความยาว 500 mm.ผ
                - generic [ref=e102]: cb750
                - generic [ref=e103]:
                  - generic [ref=e104]: ฿2,200
                  - button "หยิบใส่ตะกร้า" [ref=e105] [cursor=pointer]:
                    - img [ref=e106]
            - generic [ref=e107]:
              - link "Nut Valve Cover CNC Machined Billet Alloy น็อตขันฝาครอบตั้งวาล์วแต่ง c" [ref=e108] [cursor=pointer]:
                - /url: /products/cb3
                - img "Nut Valve Cover CNC Machined Billet Alloy น็อตขันฝาครอบตั้งวาล์วแต่ง c" [ref=e110]
              - generic [ref=e111]:
                - generic [ref=e112]: CB.3
                - link "Nut Valve Cover CNC Machined Billet Alloy น็อตขันฝาครอบตั้งวาล์วแต่ง c" [ref=e113] [cursor=pointer]:
                  - /url: /products/cb3
                  - generic [ref=e114]: Nut Valve Cover CNC Machined Billet Alloy น็อตขันฝาครอบตั้งวาล์วแต่ง c
                - generic [ref=e115]: cb750
                - generic [ref=e116]:
                  - generic [ref=e117]: ฿2,000
                  - button "หยิบใส่ตะกร้า" [ref=e118] [cursor=pointer]:
                    - img [ref=e119]
            - generic [ref=e120]:
              - link "Nut Valve Cover CNC Polished Billet Aluminum น็อตฝาวาล์วแต่ง Honda cb7" [ref=e121] [cursor=pointer]:
                - /url: /products/cb4
                - img "Nut Valve Cover CNC Polished Billet Aluminum น็อตฝาวาล์วแต่ง Honda cb7" [ref=e123]
              - generic [ref=e124]:
                - generic [ref=e125]: CB.4
                - link "Nut Valve Cover CNC Polished Billet Aluminum น็อตฝาวาล์วแต่ง Honda cb7" [ref=e126] [cursor=pointer]:
                  - /url: /products/cb4
                  - generic [ref=e127]: Nut Valve Cover CNC Polished Billet Aluminum น็อตฝาวาล์วแต่ง Honda cb7
                - generic [ref=e128]: cb750
                - generic [ref=e129]:
                  - generic [ref=e130]: ฿2,500
                  - button "หยิบใส่ตะกร้า" [ref=e131] [cursor=pointer]:
                    - img [ref=e132]
            - generic [ref=e133]:
              - link "Points Cover Finned Alloy CNC Billet ฝาครอบจานไฟแต่งข้างขวา CB750 k0-k" [ref=e134] [cursor=pointer]:
                - /url: /products/cb5
                - img "Points Cover Finned Alloy CNC Billet ฝาครอบจานไฟแต่งข้างขวา CB750 k0-k" [ref=e136]
              - generic [ref=e137]:
                - generic [ref=e138]: CB.5
                - link "Points Cover Finned Alloy CNC Billet ฝาครอบจานไฟแต่งข้างขวา CB750 k0-k" [ref=e139] [cursor=pointer]:
                  - /url: /products/cb5
                  - generic [ref=e140]: Points Cover Finned Alloy CNC Billet ฝาครอบจานไฟแต่งข้างขวา CB750 k0-k
                - generic [ref=e141]: cb750
                - generic [ref=e142]:
                  - generic [ref=e143]: ฿2,500
                  - button "หยิบใส่ตะกร้า" [ref=e144] [cursor=pointer]:
                    - img [ref=e145]
  - contentinfo [ref=e146]:
    - generic [ref=e147]:
      - generic [ref=e148]:
        - generic [ref=e149]:
          - generic [ref=e150]:
            - img [ref=e151]
            - generic [ref=e153]: ThaiGigaBike
          - paragraph [ref=e154]:
            - text: GIGA BIKE FACTORY
            - text: Racing special Parts
            - text: Custom Part & Accessories
            - text: Product Of Thailand
        - generic [ref=e156]:
          - heading "สินค้า" [level=4] [ref=e157]
          - link "Yamaha SR400/500" [ref=e158] [cursor=pointer]:
            - /url: /products?bike=sr400
          - link "Honda CB750" [ref=e159] [cursor=pointer]:
            - /url: /products?bike=cb750
          - link "Kawasaki W650" [ref=e160] [cursor=pointer]:
            - /url: /products?bike=w650
          - link "Triumph Thruxton" [ref=e161] [cursor=pointer]:
            - /url: /products?bike=thruxton
          - link "BMW S1000RR" [ref=e162] [cursor=pointer]:
            - /url: /products?bike=s1000rr
        - generic [ref=e163]:
          - heading "ติดต่อ" [level=4] [ref=e164]
          - generic [ref=e165]:
            - link "081-424-9407" [ref=e166] [cursor=pointer]:
              - /url: tel:0814249407
              - img [ref=e167]
              - text: 081-424-9407
            - link "aonggb@yahoo.com" [ref=e169] [cursor=pointer]:
              - /url: mailto:aonggb@yahoo.com
              - img [ref=e170]
              - text: aonggb@yahoo.com
            - generic [ref=e173]:
              - img [ref=e174]
              - text: เปิดทุกวัน 9:00–20:00
          - generic [ref=e177]:
            - link "LINE" [ref=e178] [cursor=pointer]:
              - /url: https://line.me/ti/p/~thaigigabike
            - link "Facebook" [ref=e179] [cursor=pointer]:
              - /url: https://www.facebook.com/Aonggigabike
      - generic [ref=e180]:
        - paragraph [ref=e181]: © 2024 ThaiGigaBike — GIGA BIKE FACTORY. All rights reserved.
        - generic [ref=e182]:
          - link "ติดตามออเดอร์" [ref=e183] [cursor=pointer]:
            - /url: /order
          - link "ติดต่อ" [ref=e184] [cursor=pointer]:
            - /url: /contact
  - alert [ref=e185]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('ตะกร้าสินค้า', () => {
  4  |   test('ตะกร้าว่างแสดง empty state', async ({ page }) => {
  5  |     await page.goto('/cart')
  6  |     await expect(page.getByText(/ยังไม่มีสินค้าในตะกร้า|Your cart is empty/)).toBeVisible()
  7  |     await expect(page.getByRole('link', { name: /เลือกซื้อสินค้าต่อ|Continue Shopping/ })).toBeVisible()
  8  |   })
  9  | 
  10 |   test('เพิ่มสินค้าแล้วตะกร้า Navbar อัปเดต', async ({ page }) => {
  11 |     await page.goto('/products/cb1')
  12 | 
  13 |     const addBtn = page.getByRole('button', { name: /หยิบใส่ตะกร้า/ })
> 14 |     if (await addBtn.isEnabled()) {
     |                      ^ Error: locator.isEnabled: Error: strict mode violation: getByRole('button', { name: /หยิบใส่ตะกร้า/ }) resolved to 5 elements:
  15 |       await addBtn.click()
  16 |       await page.waitForTimeout(500)
  17 | 
  18 |       // ไปดูตะกร้า
  19 |       await page.goto('/cart')
  20 |       const items = page.locator('[class*="product"]')
  21 |       await expect(items.first()).toBeVisible()
  22 |     }
  23 |   })
  24 | })
  25 | 
  26 | test.describe('หน้า checkout', () => {
  27 |   test('ตะกร้าว่าง redirect กลับ /products', async ({ page }) => {
  28 |     // ล้าง localStorage ก่อน
  29 |     await page.goto('/')
  30 |     await page.evaluate(() => localStorage.removeItem('gigabike-cart'))
  31 | 
  32 |     await page.goto('/checkout')
  33 |     // ควร redirect หรือแสดง empty state
  34 |     // (ขึ้นอยู่กับ logic ของหน้า)
  35 |     await expect(page).toHaveURL(/\/checkout|\/products|\/cart/)
  36 |   })
  37 | 
  38 |   test('form validation — ส่งโดยไม่กรอกชื่อ แสดง error', async ({ page }) => {
  39 |     // เพิ่มสินค้าเข้าตะกร้าก่อน
  40 |     await page.goto('/products/cb1')
  41 |     const addBtn = page.getByRole('button', { name: /หยิบใส่ตะกร้า/ })
  42 |     if (await addBtn.isEnabled()) {
  43 |       await addBtn.click()
  44 |       await page.waitForTimeout(300)
  45 |     }
  46 | 
  47 |     await page.goto('/checkout')
  48 |     await page.getByRole('button', { name: /ยืนยันคำสั่งซื้อ|Confirm Order/ }).click()
  49 |     await page.waitForTimeout(300)
  50 | 
  51 |     // error message แสดงขึ้น
  52 |     await expect(page.getByText(/กรุณา|required|Please/i)).toBeVisible({ timeout: 3000 })
  53 |   })
  54 | })
  55 | 
  56 | test.describe('ติดตามออเดอร์', () => {
  57 |   test('หน้า /order มีช่องค้นหา', async ({ page }) => {
  58 |     await page.goto('/order')
  59 |     await expect(page.getByPlaceholder(/เลขออเดอร์|order number/i)).toBeVisible()
  60 |     await expect(page.getByRole('button', { name: /ติดตาม|Track/i })).toBeVisible()
  61 |   })
  62 | 
  63 |   test('ค้นหา order ที่ไม่มี แสดง not found', async ({ page }) => {
  64 |     await page.goto('/order')
  65 |     await page.getByPlaceholder(/เลขออเดอร์|order number/i).fill('GGB-NOTEXIST999')
  66 |     await page.getByRole('button', { name: /ติดตาม|Track/i }).click()
  67 |     await expect(page.getByText(/ไม่พบ|not found/i)).toBeVisible({ timeout: 10000 })
  68 |   })
  69 | })
  70 | 
```