# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: products.spec.ts >> หน้า product detail >> แสดง carousel รูป + ราคา + ปุ่มหยิบใส่ตะกร้า
- Location: tests\products.spec.ts:44:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/฿\d+/)
Expected: visible
Error: strict mode violation: getByText(/฿\d+/) resolved to 5 elements:
    1) <div>…</div> aka getByText('฿1,000')
    2) <span>…</span> aka getByText('฿2,200')
    3) <span>…</span> aka getByText('฿2,000')
    4) <span>…</span> aka getByText('฿').nth(3)
    5) <span>…</span> aka getByText('฿').nth(4)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/฿\d+/)

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
  3  | test.describe('หน้าสินค้า (/products)', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/products')
  6  |   })
  7  | 
  8  |   test('แสดงรายการสินค้า 822 รายการ', async ({ page }) => {
  9  |     await expect(page.getByText(/822 รายการ/)).toBeVisible()
  10 |   })
  11 | 
  12 |   test('ค้นหาด้วยรหัสสินค้า CB.1 ได้', async ({ page }) => {
  13 |     await page.getByPlaceholder(/ค้นหาสินค้า/).fill('CB.1')
  14 |     await page.waitForTimeout(300)
  15 | 
  16 |     const cards = page.locator('.product-card')
  17 |     const count = await cards.count()
  18 |     expect(count).toBeGreaterThan(0)
  19 |     expect(count).toBeLessThan(50)
  20 |   })
  21 | 
  22 |   test('กรอง category เบรค แล้วสินค้าลดลง', async ({ page }) => {
  23 |     const totalText = await page.locator('p').filter({ hasText: /รายการ/ }).first().textContent()
  24 |     const total = parseInt(totalText?.match(/\d+/)?.[0] ?? '0')
  25 | 
  26 |     await page.getByRole('button', { name: 'เบรค' }).click()
  27 |     await page.waitForTimeout(300)
  28 | 
  29 |     const filteredText = await page.locator('p').filter({ hasText: /รายการ/ }).first().textContent()
  30 |     const filtered = parseInt(filteredText?.match(/\d+/)?.[0] ?? '0')
  31 | 
  32 |     expect(filtered).toBeLessThan(total)
  33 |     expect(filtered).toBeGreaterThan(0)
  34 |   })
  35 | 
  36 |   test('กดการ์ดสินค้าไปหน้า detail ได้', async ({ page }) => {
  37 |     const firstCard = page.locator('.product-card a').first()
  38 |     await firstCard.click()
  39 |     await expect(page).toHaveURL(/\/products\/\w+/)
  40 |   })
  41 | })
  42 | 
  43 | test.describe('หน้า product detail', () => {
  44 |   test('แสดง carousel รูป + ราคา + ปุ่มหยิบใส่ตะกร้า', async ({ page }) => {
  45 |     await page.goto('/products/cb1')
  46 | 
  47 |     // ชื่อสินค้า
  48 |     await expect(page.locator('h1')).toBeVisible()
  49 | 
  50 |     // ราคา
> 51 |     await expect(page.getByText(/฿\d+/)).toBeVisible()
     |                                          ^ Error: expect(locator).toBeVisible() failed
  52 | 
  53 |     // ปุ่มหยิบ
  54 |     await expect(page.getByRole('button', { name: /หยิบใส่ตะกร้า/ })).toBeVisible()
  55 | 
  56 |     // Breadcrumb
  57 |     await expect(page.getByText('สินค้า')).toBeVisible()
  58 |   })
  59 | 
  60 |   test('เพิ่มสินค้าลงตะกร้าได้', async ({ page }) => {
  61 |     await page.goto('/products/cb1')
  62 |     const addBtn = page.getByRole('button', { name: /หยิบใส่ตะกร้า/ })
  63 | 
  64 |     if (await addBtn.isEnabled()) {
  65 |       await addBtn.click()
  66 |       // ปุ่มเปลี่ยนเป็น "เพิ่มแล้ว!"
  67 |       await expect(page.getByText(/เพิ่มแล้ว!/)).toBeVisible({ timeout: 3000 })
  68 |     }
  69 |   })
  70 | })
  71 | 
```