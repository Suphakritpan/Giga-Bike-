# ThaiGigaBike — แผนที่โปรเจกต์ (Project Map)
> อัปเดต: 2026-06-06 | Next.js 14 App Router · Supabase · Netlify · Resend
> Phase 1 ✅ · Phase 2 ✅ · Build: ✅ 0 errors

---

## โครงสร้างโดยรวม (Architecture Overview)

```
thaigigabike/
├── src/
│   ├── app/                  ← Next.js App Router (20 pages + 23 API routes)
│   │   ├── (storefront)      ← customer-facing pages
│   │   ├── admin/            ← admin dashboard (auth-guarded)
│   │   └── api/              ← REST API routes (public + admin)
│   ├── components/           ← UI components
│   │   ├── layout/           ← Navbar, Footer, LineFloatButton, PageLoader
│   │   ├── product/          ← ProductCard
│   │   └── admin/            ← ProductModal
│   ├── data/                 ← Static product catalog (822 items, legacy import)
│   └── lib/                  ← Utilities: cart, i18n, theme, supabase, auth, email, csv
├── public/legacy/            ← รูปภาพจาก legacy site (HTTrack)
├── scripts/                  ← Import tools (legacy → JSON → TS)
├── supabase-setup.sql        ← Schema + RLS + Storage + Phase 2 tables (idempotent)
└── supabase-products.sql     ← 822 products seed (21K lines)
```

---

## หน้า (Pages / Routes) — 20 หน้า

### Phase 1: Core Commerce

| Route | File | คำอธิบาย |
|-------|------|----------|
| `/` | `app/page.tsx` | Homepage: hero carousel, bike/category filter, products grid, **reviews strip** |
| `/products` | `app/products/page.tsx` | รายการสินค้าทั้งหมด + sidebar filter รุ่นรถ + category pills + sort + pagination (24/page) |
| `/products/[id]` | `app/products/[id]/page.tsx` | Detail: image carousel + lightbox, color picker, qty, LINE ask, **message link**, reviews section |
| `/categories` | `app/categories/page.tsx` | หน้าหมวดหมู่ |
| `/gallery` | `app/gallery/page.tsx` | แกลเลอรี่รูปภาพโรงงาน |
| `/contact` | `app/contact/page.tsx` | ติดต่อร้าน: LINE, Facebook, โทร, ที่อยู่, วิธีสั่ง |
| `/cart` | `app/cart/page.tsx` | ตะกร้าสินค้า |
| `/checkout` | `app/checkout/page.tsx` | ชำระเงิน: ข้อมูลผู้รับ, ขนส่ง, วิธีชำระ, slip upload |
| `/order` | `app/order/page.tsx` | OTP order lookup: enter ID → email OTP → สถานะ + **vertical timeline** + tracking link |
| `/track-order` | `app/track-order/page.tsx` | Redirect → `/order` (รักษา `?id=` param) |
| `/payment` | `app/payment/page.tsx` | วิธีชำระเงิน, EMS ฟรี, นโยบายคืนเงิน, บัญชีธนาคาร |
| `/dealer` | `app/dealer/page.tsx` | ตัวแทนจำหน่าย 18 ราย + วิธีสมัคร |
| `/racing` | `app/racing/page.tsx` | Racing gallery + สินค้า racing-grade |
| `/search` | `app/search/page.tsx` | ค้นหาสินค้า: category shortcuts (empty state), bike filter pills, grid + pagination |
| `/support` | `app/support/page.tsx` | FAQ accordion 4 หมวด (TH+EN), LINE/โทร CTA |

### Phase 2: Conversion Features

| Route | File | คำอธิบาย |
|-------|------|----------|
| `/notifications` | `app/notifications/page.tsx` | Announcements feed (Supabase + static fallback), order tracking quick-link |
| `/messages` | `app/messages/page.tsx` | Form ส่งข้อความ (name/email/phone/product/message) → API → Supabase |
| `/reviews` | `app/reviews/page.tsx` | รีวิวทั้งหมด + rating summary + filter ดาว + pagination + modal form เขียนรีวิว |

### Admin

| Route | File | คำอธิบาย |
|-------|------|----------|
| `/admin` | `app/admin/page.tsx` | Dashboard 5 แท็บ: สินค้า / สต็อก / ออเดอร์ / ข้อความ / รีวิว |
| `/admin/login` | `app/admin/login/page.tsx` | Admin login (Supabase Auth + ADMIN_EMAILS allowlist) |

---

## API Routes — 23 endpoints

### Public (ลูกค้า)

| Endpoint | Method | คำอธิบาย |
|----------|--------|----------|
| `/api/orders` | POST | สร้างออเดอร์ + upload slip + ส่ง email ยืนยัน (Resend) |
| `/api/orders/[orderId]` | GET | ดึงข้อมูลออเดอร์ (order tracking) |
| `/api/order-lookup/request-otp` | POST | ขอ OTP → ส่งทาง email (generic 200 เสมอ ป้องกัน enumeration) |
| `/api/order-lookup/verify` | POST | ตรวจสอบ OTP (TTL 10 นาที, max 5 attempts) |
| `/api/messages` | POST | รับข้อความจากลูกค้า → `messages` table |
| `/api/reviews` | GET | ดึงรีวิวที่ published (filter: productId, rating, page) |
| `/api/reviews` | POST | ส่งรีวิวใหม่ → `reviews` table (published=false รอ admin approve) |
| `/api/announcements` | GET | ดึง announcements ที่ published (public read via anon client) |
| `/api/health` | GET | Health check |

### Admin (ต้อง Supabase session + ADMIN_EMAILS allowlist)

| Endpoint | Method | คำอธิบาย |
|----------|--------|----------|
| `/api/admin/auth/login` | POST | Login + rate limit (5/15 min per IP) + audit log |
| `/api/admin/orders` | GET | ดึงออเดอร์ทั้งหมด |
| `/api/admin/orders/[orderId]` | PATCH | อัปเดตสถานะ / เลขพัสดุ |
| `/api/admin/orders/[orderId]/slip-url` | POST | ดึง signed URL สลิป (private bucket) |
| `/api/admin/products` | GET / POST | ดึงสินค้าทั้งหมด / เพิ่มสินค้าใหม่ |
| `/api/admin/products/[productId]` | PATCH / DELETE | แก้ไข / ลบสินค้า |
| `/api/admin/products/[productId]/stock` | PATCH | อัปเดตสต็อก / in_stock |
| `/api/admin/product-images/upload` | POST | อัปโหลดรูปภาพ → Supabase Storage |
| `/api/admin/product-images/delete` | POST | ลบรูปภาพจาก Storage |
| `/api/admin/messages` | GET | ดึงข้อความลูกค้าทั้งหมด |
| `/api/admin/messages/[messageId]` | PATCH | อัปเดต status (new/replied/closed) |
| `/api/admin/reviews` | GET | ดึงรีวิวทั้งหมด (รวม unpublished) |
| `/api/admin/reviews/[reviewId]` | PATCH | approve/reject (published: true/false) |
| `/api/admin/reviews/[reviewId]` | DELETE | ลบรีวิว |

---

## Components

```
components/
├── layout/
│   ├── Navbar.tsx           ← Nav + search → /search, theme, language, cart, mobile menu
│   ├── Footer.tsx           ← 3-column: ยี่ห้อ/รุ่น · ช่วยเหลือ/ลิงก์ใหม่ · ติดต่อ/social
│   ├── LineFloatButton.tsx  ← Fixed floating LINE button (bottom-right, ทุกหน้า)
│   └── PageLoader.tsx       ← Loading screen
├── product/
│   └── ProductCard.tsx      ← card: รูป, ชื่อ, ราคา, add to cart
└── admin/
    └── ProductModal.tsx     ← Add/Edit product (3 section: info / images / spec+stock)
```

---

## Admin Dashboard — 5 แท็บ

### แท็บ: สินค้า
- ตาราง + thumbnail, ค้นหา real-time, pagination (50/page)
- เพิ่ม / แก้ไข / ลบ (ProductModal), alert สต็อก

### แท็บ: สต็อก
- +/- adjust, inline edit, toggle in_stock, alert สต็อกต่ำ/หมด, Export CSV

### แท็บ: ออเดอร์
- ค้นหา (เลขออเดอร์/ชื่อ/เบอร์), อัปเดตสถานะ, ใส่เลขพัสดุ → auto-set shipping
- ดูสลิป (signed URL), Export CSV

### แท็บ: ข้อความ (Phase 2)
- แสดงข้อความจากลูกค้า, badge "ใหม่"
- ตอบกลับ Email (mailto link), mark replied/closed

### แท็บ: รีวิว (Phase 2)
- แสดงรีวิวทั้งหมด (รวมรอ approve), badge สถานะ
- Approve (published=true) / Reject (published=false) / ลบ

### ProductModal (Add/Edit) — 3 sections
1. **ข้อมูลสินค้า** — รหัส, ชื่อ EN/TH, หมวดหมู่ (card UI), รายละเอียด, flags
2. **รูปภาพ** — drag & drop upload, URL paste, carousel preview, thumbnail strip
3. **สเปค & สต็อก** — วัสดุ, สต็อก, สี (dot preview), รุ่นรถ (grouped by brand, select-all)

---

## Database (Supabase) — 9 ตาราง

### `products`
| Column | Type | คำอธิบาย |
|--------|------|----------|
| id | TEXT PK | |
| code | TEXT | รหัสสินค้า เช่น CB.1 |
| name / name_th | TEXT | ชื่อ EN / TH |
| price | INTEGER | ราคา (บาท) |
| category | TEXT | brake/engine/suspension/chassis/drivetrain/hardware/accessories/exhaust |
| bike_models | JSONB | ['sr400','cb750',...] |
| colors | JSONB | ['black','silver',...] |
| in_stock | BOOLEAN | |
| stock_count | INTEGER | |
| material, description, description_th | TEXT | |
| images | JSONB | [url,...] |
| featured, published | BOOLEAN | |
| review_reasons | JSONB | legacy |
| created_at | TIMESTAMPTZ | |

### `orders`
| Column | Type | คำอธิบาย |
|--------|------|----------|
| id | TEXT PK | เช่น GGB-LB3K8XZA |
| status | TEXT | pending/paid/shipping/delivered/cancelled |
| recipient_name/phone/address | TEXT | |
| shipping_method | TEXT | kerry/flash/pickup |
| shipping_fee, cod_fee, subtotal, total | INTEGER | |
| payment_method | TEXT | transfer/cod |
| items | JSONB | [{productId, code, name, price, qty, color}] |
| slip_path | TEXT | Storage path (private bucket) |
| tracking_no, contact_email | TEXT | |
| idempotency_key | TEXT | UUID ป้องกัน duplicate checkout |
| created_at | TIMESTAMPTZ | |

### `order_lookup_otps`
| Column | คำอธิบาย |
|--------|----------|
| order_id | FK → orders.id |
| otp_hash | SHA-256 hash ของ OTP 6 หลัก |
| expires_at | TTL 10 นาที |
| attempts | max 5, cooldown 2 นาที |

### `admin_login_attempts` — rate limiting (5/15 min per IP hash)

### `stock_movements` — log การเปลี่ยนแปลง stock ทุกครั้ง

### `audit_logs` — admin action trail (actor_email, action, entity, before/after JSON, ip_hash)

### `messages` *(Phase 2)*
| Column | คำอธิบาย |
|--------|----------|
| sender_name, sender_email, sender_phone | ผู้ส่ง |
| subject, body | เนื้อหา |
| product_code | รหัสสินค้า (optional) |
| status | new / replied / closed |

### `reviews` *(Phase 2)*
| Column | คำอธิบาย |
|--------|----------|
| product_id | FK → products.id |
| reviewer_name, rating (1-5), comment | เนื้อหา |
| order_id | optional (ยืนยันการซื้อ) |
| images | JSONB |
| helpful_count | counter |
| published | false จนกว่า admin approve |

### `announcements` *(Phase 2)*
| Column | คำอธิบาย |
|--------|----------|
| title_th, title_en, body_th, body_en | เนื้อหา bilingual |
| type | info / promo / update / shipping |
| published, pinned | visibility flags |

---

## Storage Buckets (Supabase)

| Bucket | Public | ใช้สำหรับ | ขนาดสูงสุด |
|--------|--------|----------|-----------|
| `order-slips` | ❌ Private | สลิปโอนเงิน (admin อ่านผ่าน signed URL) | 5 MB |
| `product-images` | ✅ Public | รูปภาพสินค้า (admin upload) | 5 MB |

---

## Lib / Utilities

| ไฟล์ | คำอธิบาย |
|------|----------|
| `lib/cart.tsx` | CartContext: add, remove, clear, quantity, localStorage |
| `lib/lang.tsx` | LangContext: Thai/English, wraps i18n.ts |
| `lib/i18n.ts` | Translations object ครอบคลุมทุกหน้า (Phase 1 + 2): nav/home/product/cart/checkout/order/contact/categories/gallery/dealer/payment/racing/search/support/notifications/messages/reviews/colors |
| `lib/theme.tsx` | ThemeContext: light/dark, CSS variables |
| `lib/supabase/client.ts` | Browser Supabase client (SSR) |
| `lib/supabase/server.ts` | Server Supabase client |
| `lib/supabase/service.ts` | Service role client — bypasses RLS |
| `lib/auth/admin.ts` | `isAdminEmail()` — ADMIN_EMAILS env var allowlist |
| `lib/auth/require-admin.ts` | `requireAdmin()` — auth guard สำหรับ API routes |
| `lib/audit.ts` | `writeAuditLog()` → audit_logs (server-only, never throws) |
| `lib/email.ts` | `sendOrderConfirmationEmail()` + `sendOtpEmail()` via Resend |
| `lib/csv.ts` | `escapeCsvCell()` + `toCsvRow()` — formula injection prevention |

---

## Security Architecture

### Admin Auth Flow
```
POST /api/admin/auth/login
  → rate limit: 5 attempts / 15 min per IP (SHA-256 hashed)
  → isAdminEmail() checks ADMIN_EMAILS env var
  → Supabase signInWithPassword
  → writeAuditLog({ action: 'login' })
  → cookie session
```

### Order Lookup OTP Flow
```
POST /api/order-lookup/request-otp  ← always 200 (prevents enumeration)
  → SHA-256 OTP hash → order_lookup_otps (TTL 10 min, cooldown 2 min)
  → sendOtpEmail() via Resend

POST /api/order-lookup/verify
  → verify hash, check TTL + attempts (max 5) → return order
```

### RLS Matrix
| Table | anon | authenticated | service_role |
|-------|------|--------------|--------------|
| products | SELECT published=true | blocked | all |
| orders | blocked | blocked | all |
| reviews | SELECT published=true | blocked | all |
| announcements | SELECT published=true | blocked | all |
| messages | blocked | blocked | all |
| order_lookup_otps | blocked | blocked | all |
| audit_logs | blocked | blocked | all |
| admin_login_attempts | blocked | blocked | all |

---

## Data Flow

```
Legacy Site (HTTrack)
        ↓
scripts/import-legacy.mjs   → scripts/out/legacy-products.json
        ↓
scripts/build-catalog.mjs   → src/data/products.generated.ts (822 items)
        ↓
src/data/products.ts        → re-exports + types + helpers
        ↓
หน้า /products /search /home  ← static fallback + Supabase
        ↑
Supabase products table       ← source of truth (admin CRUD)
```

### Phase 2 Data Flow
```
Customer submits form (/messages, /reviews)
  → POST /api/messages → Supabase messages table (service role)
  → POST /api/reviews  → Supabase reviews table  (published=false)

Admin opens dashboard
  → GET /api/admin/messages → messages list
  → PATCH /api/admin/messages/[id] → mark replied/closed
  → GET /api/admin/reviews  → reviews list
  → PATCH /api/admin/reviews/[id] → toggle published

Shop owner adds announcement
  → Supabase dashboard → announcements table
  → GET /api/announcements → /notifications page reads (anon client)
```

---

## UX Features

### Global
- **Floating LINE button** — fixed bottom-right ทุกหน้า (`LineFloatButton.tsx`)
- **Dark/Light theme** — CSS variables, localStorage
- **Bilingual TH/EN** — localStorage, ครอบคลุมทุกหน้า

### Storefront
- `/products` — pagination 24/page, bike sidebar filter, category pills, sort, active filter chips
- `/search` — empty state แสดง 8 category shortcuts + 16 bike pills, instant filter
- `/products/[id]` — lightbox zoom, เขียนรีวิว inline, "ส่งข้อความถามสินค้านี้" → `/messages?product=CODE`
- `/order` — vertical timeline + clickable Kerry/Flash tracking links

### Homepage
- Hero carousel (auto-rotate 3.5s) + trust badges
- Bike model filter + category tabs + product grid
- **ReviewsStrip** — แสดง 4 รีวิวล่าสุด + "เขียนรีวิว" card (โหลดจาก `/api/reviews`)

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

## Customer Flows

### Checkout
```
/cart → /checkout → POST /api/orders → /order?id=GGB-XXXXX
          ↓                ↓                    ↓
      form+slip      Supabase DB          email ยืนยัน
       upload         +Storage            (Resend)
```

### Order Tracking
```
/order → กรอก order ID → POST request-otp → email OTP
       → กรอก OTP → POST verify → สถานะ + timeline + tracking link
```

### Reviews
```
/reviews → เขียนรีวิว (modal) → POST /api/reviews (published=false)
Admin dashboard Reviews tab → Approve → published=true → แสดงบนเว็บ
Homepage ReviewsStrip + /products/[id] reviews section แสดงรีวิวที่ approve แล้ว
```

### Messages
```
/messages (หรือ /products/[id] → ส่งข้อความ) → POST /api/messages
Admin dashboard ข้อความ tab → ตอบกลับ Email → PATCH mark replied
```

---

## สถานะ Feature (Status)

| Feature | Status | หมายเหตุ |
|---------|--------|----------|
| Product catalog (822 items) | ✅ | legacy import สมบูรณ์ |
| Product images | ✅ | legacy + admin upload |
| Shopping cart | ✅ | localStorage, color variants |
| Checkout + slip upload | ✅ | Supabase Storage private |
| Order tracking + OTP | ✅ | 6-digit email OTP, TTL 10 min |
| Vertical order timeline | ✅ | status steps + timestamps |
| Tracking link (Kerry/Flash) | ✅ | clickable ใน /order |
| Email: order confirm + OTP | ✅ | Resend |
| Admin auth (allowlist) | ✅ | ADMIN_EMAILS + rate limit + audit |
| Admin: Products CRUD | ✅ | ProductModal 3-section |
| Admin: Stock management | ✅ | inline edit, +/-, Export CSV |
| Admin: Orders | ✅ | status + tracking, Export CSV |
| Admin: Messages tab | ✅ | view, reply email, mark status |
| Admin: Reviews tab | ✅ | approve/reject/delete |
| Audit logging | ✅ | audit_logs table |
| CSV formula-injection safe | ✅ | escapeCsvCell() |
| Search page `/search` | ✅ | category shortcuts + bike pills |
| Support / FAQ | ✅ | 4-group accordion TH+EN |
| `/notifications` | ✅ | announcements + static fallback |
| `/messages` | ✅ | form → Supabase messages table |
| `/reviews` | ✅ | list + rating summary + form modal |
| Reviews on product detail | ✅ | mini-section + avg rating |
| Reviews on homepage | ✅ | ReviewsStrip widget |
| Floating LINE button | ✅ | global, all pages |
| Dealer page | ✅ | 18 ตัวแทน |
| Payment info page | ✅ | EMS ฟรี, นโยบาย, บัญชีธนาคาร |
| Racing gallery | ✅ | gallery + racing products |
| Bilingual TH/EN | ✅ | i18n.ts ครอบคลุมทุกหน้า |
| Dark/Light theme | ✅ | CSS variables |
| Netlify deploy | ✅ | netlify.toml + build-catalog |
| Payment gateway | ❌ | slip upload only, no gateway |
| Customer order history | ❌ | ต้อง login สำหรับลูกค้า |
| Review photos upload | ❌ | form รองรับ images[] แต่ยังไม่มี upload UI |
| Push notifications | ❌ | email only |

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=       # project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # anon key (browser-safe)
SUPABASE_SERVICE_ROLE_KEY=      # service role key (server only)

# Admin auth
ADMIN_EMAILS=                   # comma-separated เช่น admin@example.com,dev@example.com

# Email (Resend)
RESEND_API_KEY=                 # order confirmation + OTP emails
EMAIL_FROM=                     # sender เช่น orders@thaigigabike.com
```

---

## Supabase Setup

**รันไฟล์ครั้งเดียว (idempotent — รันซ้ำได้):**
```
supabase-setup.sql   ← tables + RLS + policies + storage buckets + Phase 2 tables
supabase-products.sql ← 822 products seed
```

**Phase 2 tables ที่เพิ่ม (อยู่ท้าย supabase-setup.sql):**
- `messages` — RLS on, service_role only
- `reviews` — anon reads published=true, admin approves
- `announcements` — anon reads published=true, admin creates via dashboard

---

## Scripts & Build

| Script | คำสั่ง | ทำอะไร |
|--------|--------|--------|
| import-legacy | `node scripts/import-legacy.mjs` | Parse HTTrack mirror → legacy-products.json |
| build-catalog | `npm run build-catalog` | JSON → products.generated.ts |
| dev | `npm run dev` | Next.js dev server |
| build | `npm run build` | Production build (verified ✅ 0 errors) |

### Netlify Build Config

```toml
[build]
  base    = "thaigigabike"
  command = "npm ci && npm run build-catalog && npm run build"
  publish = ".next"
  
[build.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

ตั้ง env vars ทั้งหมดใน Netlify Dashboard → Site Settings → Environment Variables
