# ThaiGigaBike — แผนที่โปรเจกต์ (Project Map)
> อัปเดต: 2026-06-04 | Next.js 14 App Router · Supabase · Netlify

---

## โครงสร้างโดยรวม (Architecture Overview)

```
thaigigabike/
├── src/
│   ├── app/                  ← Next.js App Router (pages + API)
│   ├── components/           ← UI components
│   ├── data/                 ← Static product catalog (legacy import)
│   └── lib/                  ← Utilities: cart, lang, theme, supabase
├── public/legacy/            ← รูปภาพจาก legacy site (HTTrack)
├── scripts/                  ← Import tools (legacy → JSON → TS)
├── supabase-setup.sql        ← Schema + RLS + Storage buckets
└── supabase-products.sql     ← 822 products seed (21K lines)
```

---

## หน้า (Pages / Routes)

| Route | File | คำอธิบาย | Status |
|-------|------|----------|--------|
| `/` | `app/page.tsx` | Homepage: hero, featured products, filters | ✅ |
| `/products` | `app/products/page.tsx` | รายการสินค้าทั้งหมด + sidebar filter | ✅ |
| `/products/[id]` | `app/products/[id]/page.tsx` | Detail page: image carousel, color picker, add to cart | ✅ |
| `/categories` | `app/categories/page.tsx` | หน้าหมวดหมู่ | ✅ |
| `/gallery` | `app/gallery/page.tsx` | แกลเลอรี่รูปภาพ | ✅ |
| `/contact` | `app/contact/page.tsx` | ติดต่อร้าน | ✅ |
| `/cart` | `app/cart/page.tsx` | ตะกร้าสินค้า | ✅ |
| `/checkout` | `app/checkout/page.tsx` | ชำระเงิน: ข้อมูล, ขนส่ง, slip upload | ✅ |
| `/order` | `app/order/page.tsx` | ติดตามออเดอร์ (ค้นหาด้วย order ID) | ✅ |
| `/admin` | `app/admin/page.tsx` | Admin dashboard (auth guard) | ✅ |
| `/admin/login` | `app/admin/login/page.tsx` | Admin login (Supabase Auth) | ✅ |

---

## API Routes

| Endpoint | Method | คำอธิบาย |
|----------|--------|----------|
| `/api/orders` | POST | สร้างออเดอร์ใหม่ + upload slip → Supabase |
| `/api/orders/[orderId]` | GET | ดึงข้อมูลออเดอร์ตาม ID (order tracking) |

---

## Components

```
components/
├── layout/
│   ├── Navbar.tsx          ← Navigation + theme/language toggle
│   └── Footer.tsx          ← Footer
├── product/
│   └── ProductCard.tsx     ← Product card (image + name + price + add to cart)
├── admin/
│   └── ProductModal.tsx    ← Add/Edit product modal (3 sections: info/images/spec)
└── PageLoader.tsx          ← Loading screen
```

---

## Admin Dashboard Features

### แท็บ: สินค้า (Products)
- ✅ ตาราง + thumbnail รูปภาพ
- ✅ ค้นหา real-time (รหัส/ชื่อ)
- ✅ Pagination (50 รายการ/หน้า)
- ✅ เพิ่ม / แก้ไข / ลบสินค้า (ProductModal)
- ✅ Auth guard → redirect `/admin/login`

### แท็บ: สต็อก (Stock)
- ✅ ตาราง + thumbnail รูปภาพ
- ✅ ค้นหา real-time
- ✅ Pagination
- ✅ +/- ปุ่ม adjust stock
- ✅ คลิกตัวเลขแก้ไขตรง (inline edit)
- ✅ Toggle สถานะ มีสินค้า/หมด
- ✅ Alert สต็อกต่ำ / หมด
- ✅ Export CSV

### แท็บ: ออเดอร์ (Orders)
- ✅ ดึงจาก Supabase จริง (ไม่ใช่ mock)
- ✅ ค้นหา (เลขออเดอร์ / ชื่อ / เบอร์)
- ✅ อัปเดตสถานะ → บันทึก DB
- ✅ ใส่เลขพัสดุ → อัปเดต status เป็น "กำลังส่ง" อัตโนมัติ
- ✅ ดูสลิปโอนเงิน (link)
- ✅ Export CSV

### ProductModal (Add/Edit)
แบ่งเป็น 3 section:
1. **ข้อมูลสินค้า** — รหัส, ชื่อ EN/TH, หมวดหมู่ (card UI), รายละเอียด, flags
2. **รูปภาพ** — drag & drop upload → Supabase Storage, URL paste, carousel preview, thumbnail strip, ตั้งภาพหลัก
3. **สเปค & สต็อก** — วัสดุ, สต็อก, สี (dot preview), รุ่นรถ (grouped by brand, select-all per brand)

---

## Database (Supabase)

### ตาราง: `products`
| Column | Type | คำอธิบาย |
|--------|------|----------|
| id | TEXT PK | |
| code | TEXT | รหัสสินค้า เช่น CB.1 |
| name | TEXT | ชื่อ EN |
| name_th | TEXT | ชื่อ TH |
| price | INTEGER | ราคา (บาท) |
| category | TEXT | brake/engine/suspension/chassis/drivetrain/hardware/accessories/exhaust |
| bike_models | JSONB | ['sr400','cb750',...] |
| colors | JSONB | ['black','silver',...] |
| in_stock | BOOLEAN | |
| stock_count | INTEGER | |
| material | TEXT | |
| description | TEXT | EN |
| description_th | TEXT | TH |
| images | JSONB | [url1, url2,...] |
| featured | BOOLEAN | แสดงหน้าแรก |
| published | BOOLEAN | ลูกค้ามองเห็น |
| review_reasons | JSONB | เหตุผลที่ยังต้อง review (legacy) |
| created_at | TIMESTAMPTZ | |

### ตาราง: `orders`
| Column | Type | คำอธิบาย |
|--------|------|----------|
| id | TEXT PK | เช่น GGB-LB3K8XZA |
| status | TEXT | pending/paid/shipping/delivered/cancelled |
| recipient_name/phone/address | TEXT | |
| shipping_method | TEXT | kerry/flash/pickup |
| shipping_fee | INTEGER | |
| payment_method | TEXT | transfer/cod |
| items | JSONB | [{productId, code, name, price, qty, color}] |
| subtotal/cod_fee/total | INTEGER | |
| slip_url | TEXT | URL รูปสลิปใน Storage |
| tracking_no | TEXT | เลขพัสดุ |
| created_at | TIMESTAMPTZ | |

---

## Storage Buckets (Supabase)

| Bucket | Public | ใช้สำหรับ | ขนาดสูงสุด |
|--------|--------|----------|-----------|
| `order-slips` | ✅ | สลิปโอนเงินจากลูกค้า | 5 MB |
| `product-images` | ✅ | รูปภาพสินค้า (admin upload) | 5 MB |

---

## Data Flow

```
Legacy Site (HTTrack mirror)
        ↓
scripts/import-legacy.mjs   → scripts/out/legacy-products.json
        ↓
scripts/build-catalog.mjs   → src/data/products.generated.ts  (822 products)
        ↓
src/data/products.ts        → re-exports + types + helpers
        ↓
หน้า /products + admin      ← fallback ถ้า Supabase ว่าง
        ↑
Supabase products table     ← แหล่งข้อมูลหลัก (admin CRUD)
```

---

## Lib / Utilities

| ไฟล์ | คำอธิบาย |
|------|----------|
| `lib/cart.tsx` | CartContext: add, remove, clear, quantity, localStorage |
| `lib/lang.tsx` | LangContext: Thai/English, translations object |
| `lib/theme.tsx` | ThemeContext: light/dark, CSS variables |
| `lib/supabase/client.ts` | Browser Supabase client (SSR) |
| `lib/supabase/server.ts` | Server Supabase client |
| `lib/supabase/service.ts` | Service role client (API routes) |

---

## หมวดหมู่สินค้า (Categories)

| ID | EN | TH |
|----|----|----|
| brake | Brakes | เบรค |
| engine | Engine | เครื่องยนต์ |
| suspension | Suspension | โช๊ค/แผงคอ |
| chassis | Chassis | ตัวถัง |
| drivetrain | Drivetrain | สเตอร์/โซ่ |
| hardware | Bolts & Nuts | น็อต/สกรู |
| accessories | Accessories | อุปกรณ์เสริม |
| exhaust | Exhaust | ท่อไอเสีย |

---

## รุ่นรถที่รองรับ (Bike Models) — 26 รุ่น

| Brand | Models |
|-------|--------|
| Yamaha | SR400/500, SRX400-600, XS650, XT/TT500, TDR220, R15/XSR155/XMAX300, R3/MT-03, R1/R6/R7 |
| Honda | CB750, GB250/400/CB400SS, NC30/NC35/CB1300, CBR150R/250RR/300, CBR600RR/1000RR, Monkey/MSX125/DAX125, NSR150SP |
| Kawasaki | W650/W800, Estrella250, KSR110/KR150, Ninja250/300/400, ZX-10RR |
| Suzuki | Tempter 400, Volty 250 |
| Triumph | Thruxton900/T100/T120, Daytona 675 |
| BMW | S1000RR |

---

## Checkout Flow

```
/cart → /checkout → POST /api/orders → /order?id=GGB-XXXXX
   ↓           ↓              ↓
ตะกร้า    form + slip    Supabase DB
          upload         + Storage
```

1. ลูกค้ากรอกชื่อ/เบอร์/ที่อยู่
2. เลือกขนส่ง (Kerry ฿60 / Flash ฿80 / รับเอง ฿0)
3. เลือกชำระ (โอน + แนบสลิป / COD +฿50)
4. Submit → API สร้าง order ID → redirect `/order?id=...`
5. Admin เห็นออเดอร์ใหม่ → อัปเดตสถานะ + ใส่เลขพัสดุ

---

## สถานะ Feature (Status)

| Feature | Status | หมายเหตุ |
|---------|--------|----------|
| Product catalog (822 items) | ✅ Done | legacy import สมบูรณ์ |
| Product images | ✅ Done | แสดงรูปจาก legacy + upload ใหม่ |
| Shopping cart | ✅ Done | localStorage, color variants |
| Checkout + slip upload | ✅ Done | Supabase Storage |
| Order tracking | ✅ Done | ค้นหาด้วย order ID |
| Admin auth guard | ✅ Done | Supabase Auth |
| Admin CRUD products | ✅ Done | ProductModal 3-section |
| Admin image upload | ✅ Done | drag & drop → Supabase Storage |
| Admin stock management | ✅ Done | inline edit, +/- |
| Admin orders (real DB) | ✅ Done | status + tracking number |
| Bilingual (TH/EN) | ✅ Done | localStorage |
| Dark/Light theme | ✅ Done | CSS variables |
| Payment processing | ❌ Missing | slip upload only, no gateway |
| Email notifications | ❌ Missing | order confirmation email |
| Customer order history | ❌ Missing | ต้อง login |
| Product pagination (storefront) | ❌ Missing | โหลด 822 ทีเดียว |
| Netlify deploy config | ⚠️ Partial | env vars ต้องตั้งใน Netlify |

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Anon key (browser-safe)
SUPABASE_SERVICE_ROLE_KEY=      # Service role key (server only, never expose)
```

---

## Scripts

| Script | คำสั่ง | ทำอะไร |
|--------|--------|--------|
| import-legacy | `node scripts/import-legacy.mjs` | Parse HTTrack mirror → legacy-products.json |
| build-catalog | `node scripts/build-catalog.mjs` | JSON → products.generated.ts |
| dev | `npm run dev` | Next.js dev server |
| build | `npm run build` | Production build |
