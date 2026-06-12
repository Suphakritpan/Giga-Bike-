# ThaiGigaBike — แผนที่โปรเจกต์ (Project Map)
> อัปเดต: 2026-06-11 | Next.js 14 App Router · Supabase (DB+Storage เท่านั้น) · Netlify · Resend
> Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅ · **Custom Auth ✅ (แทน Supabase Auth ทั้งหมด)** · Build ✅ 0 error (78 หน้า)
> 📘 API spec เต็ม: `thaigigabike/docs/API.md` · 🎨 Frontend guide + UI kit: `thaigigabike/docs/FRONTEND.md`

> 🪨 Doc write caveman. Word short. Meaning same. Code block no touch.

---

## Phase 3: Customer Account System — foundation ✅

ระบบสมาชิกครบ keystone — **custom auth ทั้งระบบ ไม่ใช้ Supabase Auth แล้ว**

### Auth (`/login` `/signup` `/forgot-password` `/reset-password`)
- Email+password signup/login (bcrypt 12 rounds) — ไม่มี Google OAuth / email confirmation แล้ว ✅
- Session = random token → SHA-256 → `user_sessions` table; browser ได้ httpOnly cookie `tgb_session` ✅
- Password reset = token ใช้ครั้งเดียว 30 นาที (`password_reset_tokens`) ส่งลิงก์ผ่าน Resend ✅
- middleware กัน `/admin/*` + `/account/*` (เช็ค cookie อย่างเดียว, DB เช็คจริงใน layout/route) ✅
- ลบบัญชี (ยืนยันรหัสผ่าน) + ดาวน์โหลดข้อมูล (PDPA export JSON) ✅

### Account area (`/account/*` — sidebar layout)
> ทุกหน้าใช้ UI kit (`components/ui`): PageHeader + SkeletonList + EmptyState + VerifyEmailBanner — ดู `docs/FRONTEND.md`
| Page | ทำอะไร |
|------|--------|
| `/account` | dashboard: greeting, member since, นับ order/wishlist/review/message |
| `/account/profile` | แก้ชื่อ/เบอร์, upload avatar (`avatars` bucket), email read-only |
| `/account/addresses` | สมุดที่อยู่: เพิ่ม/แก้/ลบ, ตั้งหลัก, label บ้าน/ที่ทำงาน/ร้าน |
| `/account/orders` | order history (user_id + email guest), reorder, link timeline |
| `/account/wishlist` | สินค้าโปรด, move to cart, ลบ |
| `/account/reviews` | รีวิวตัวเอง + status badge (รออนุมัติ/เผยแพร่), ลบ |
| `/account/messages` | inbox: ข้อความที่ส่ง + status |
| `/account/tickets` | support ticket: เปิด/ดู, topic (order/refund/claim/...), ผูก order |
| `/account/settings` | theme/lang, notification prefs toggle, privacy, danger zone (ลบบัญชี/export) |

### Tables (Phase 3 + Custom Auth) — service-role only, API filter `user_id` เอง
- `users` · `user_sessions` · `login_attempts` · `password_reset_tokens` · `admin_audit_logs`
- `profiles` (1:1 **public.users**, สร้างตอน register/เข้าครั้งแรก) · `addresses` · `wishlists` · `support_tickets`
- `orders.user_id` + `reviews.user_id` (FK → public.users) · bucket `avatars` (upload ผ่าน `/api/account/avatar`)

### Cross-cutting
- **Wishlist** — `WishlistProvider`: DB เมื่อ login, localStorage เมื่อ guest, **merge ตอน login**. Heart button บน ProductCard + product detail ✅
- **Recently viewed** — `lib/recentlyViewed.ts` localStorage, record บน product detail ✅
- **Navbar** — User icon/avatar → /account หรือ /login ✅
- **Logged-in checkout** — prefill profile + saved address picker + ผูก order_id กับ user (server-side session, ไม่ trust client). guest ยังใช้ OTP ได้ ✅

### API (`/api/account/*` — requireUser guard)
profile (GET/PATCH) · addresses (GET/POST + [id] PATCH/DELETE) · wishlist (GET/POST/DELETE) · orders (GET, merge user_id+email) · reviews (GET + [id] PATCH/DELETE) · messages (GET) · tickets (GET/POST) · export (GET JSON) · delete (POST, ยืนยันรหัสผ่าน)

### รอบ 2 — ครบทุกหมวดแล้ว ✅
- **Order**: `/account/orders/[id]` detail + **พิมพ์ใบเสร็จ** (print) + **ขอใบกำกับภาษี** (`tax_invoice_requests`) + **ยกเลิก** (pending/paid) + reorder
- **Wishlist**: **แยกตามรถ** (group), **แชร์** (`/wishlist/share?ids=`), toggle **แจ้งเตือนลดราคา/ของเข้า** (`notify_price_drop/restock`)
- **Recently viewed**: `/account/history` — สินค้า + คำค้นหา + รุ่นรถ + หมวด + ล้าง + **แนะนำสินค้า** (จาก cat/bike ที่ดู)
- **Reviews**: inline edit UI (แก้แล้ว reset เป็น pending)
- **Messages**: reply thread (`message_replies`) + แนบรูป, re-open ตอนลูกค้าตอบ
- **Tickets**: reply thread (`ticket_replies`) + แนบรูป + **ปิด ticket** + **ให้คะแนน** (rating)
- **Security**: เปลี่ยน email (ยืนยันรหัสผ่าน — `/api/account/change-email`), **login history** (`login_events`), **logout ทุกอุปกรณ์** (`/api/auth/logout-all`)

### Phase 3.5: Admin Customer Care ✅
ปิดช่องว่างฝั่ง admin — ไม่ต้องตอบผ่าน Supabase dashboard อีกต่อไป.
- **ข้อความ**: reply thread (chat bubble) + แนบรูป → admin reply ตั้ง `messages.status='replied'`
- **ซัพพอร์ต (tickets)**: แท็บใหม่ — thread + แนบรูป + ปิด/เปิดตั๋ว, admin reply ตั้ง `status='answered'`, แสดง topic + rating
- **ใบกำกับภาษี**: แท็บ queue — ดู tax_id/company/address + order total/email, mark "ออกแล้ว"/ย้อนกลับ
- Cancel/refund: cancel ผ่านแท็บออเดอร์ (status), refund/claim เข้ามาทาง tickets topic
- audit log ทุก action (reply / status / tax issue)

### เหลือจริง (ต้องมี infra เพิ่ม)
- 2FA (มาร์ค coming soon) · Push notification (ตอนนี้ email + in-app)
- Background cron ส่ง price-drop/restock alert จริง (ตอนนี้เก็บ intent flag แล้ว)
- Login-alert email (customer side พร้อม)

### Table/Storage เพิ่ม (รอบ 2)
`message_replies` · `ticket_replies` · `login_events` · `tax_invoice_requests` · `wishlists.notify_price_drop/restock` · `support_tickets.rating`

### Setup ก่อนใช้ (Custom Auth)
1. รัน SQL ตามลำดับ: `supabase/setup.sql` → `custom-auth.sql` → `custom-auth-phase2.sql` → `custom-auth-phase3.sql`
2. ตั้ง env: `ADMIN_SETUP_SECRET` (ค่า random) + `CUSTOM_AUTH_SESSION_COOKIE/DAYS` + production ต้องเปิด `ALLOW_ADMIN_SETUP=true` ชั่วคราว
3. สมัครที่ `/signup` → `POST /api/admin/setup-owner` `{ secret, email }` → ได้ owner คนแรก → ลบ `ALLOW_ADMIN_SETUP` ทิ้ง (endpoint ตายถาวรเองเมื่อมี owner)
4. Email verification: guest orders/inbox จะแสดงเมื่อ user กดยืนยันอีเมลแล้วเท่านั้น (`users.email_verified_at`)

---

## โครงสร้าง (Architecture)

```
thaigigabike/
├── src/
│   ├── app/                  ← Next.js App Router (21 page + 25 API route)
│   │   ├── (storefront)      ← page for customer
│   │   ├── admin/            ← admin dashboard (auth guard)
│   │   └── api/              ← REST API (public + admin)
│   ├── components/           ← UI parts
│   │   ├── layout/           ← Navbar, Footer, LineFloatButton, PageLoader
│   │   ├── product/          ← ProductCard
│   │   ├── admin/            ← ProductModal
│   │   └── PromptPayQR.tsx   ← PromptPay QR canvas
│   ├── data/                 ← static catalog (822 item, legacy import)
│   └── lib/                  ← cart, i18n, theme, supabase, auth, email, csv, promptpay
├── public/legacy/            ← รูปจาก legacy site (HTTrack)
├── scripts/                  ← import tool (legacy → JSON → TS)
├── supabase-setup.sql        ← schema + RLS + storage + Phase 2 table (idempotent)
└── supabase-products.sql     ← 822 product seed (21K line)
```

---

## หน้า (Pages / Routes) — 21 หน้า

### Phase 1: Core Commerce

| Route | File | ทำอะไร |
|-------|------|--------|
| `/` | `app/page.tsx` | Home: hero carousel, multi-select bike+category filter, grid + pagination (24/page), **reviews strip** |
| `/products` | `app/products/page.tsx` | สินค้าหมด + **multi-select** bike sidebar + category pill + sort + pagination |
| `/products/[id]` | `app/products/[id]/page.tsx` | Detail: carousel + lightbox, color pick, qty, LINE ask, **message link**, reviews section |
| `/categories` | `app/categories/page.tsx` | หน้าหมวดหมู่ (ลบจาก nav แล้ว, page ยังอยู่) |
| `/gallery` | `app/gallery/page.tsx` | gallery รูปโรงงาน |
| `/contact` | `app/contact/page.tsx` | ติดต่อ: LINE, Facebook, โทร, ที่อยู่ |
| `/cart` | `app/cart/page.tsx` | ตะกร้า |
| `/checkout` | `app/checkout/page.tsx` | จ่ายเงิน: ผู้รับ, ขนส่ง, **PromptPay QR**, slip upload |
| `/order` | `app/order/page.tsx` | OTP lookup: ID → email OTP → status + **timeline** + tracking link |
| `/orders` | `app/orders/page.tsx` | **ประวัติออเดอร์**: email + OTP → ดูทุก order ของ email นั้น |
| `/track-order` | `app/track-order/page.tsx` | redirect → `/order` (เก็บ `?id=`) |
| `/payment` | `app/payment/page.tsx` | วิธีจ่าย, EMS ฟรี, คืนเงิน, บัญชี |
| `/dealer` | `app/dealer/page.tsx` | ตัวแทน 18 ราย + วิธีสมัคร |
| `/racing` | `app/racing/page.tsx` | racing gallery + สินค้า racing |
| `/search` | `app/search/page.tsx` | ค้นหา: category shortcut (empty state), bike pill, grid + pagination |
| `/support` | `app/support/page.tsx` | FAQ accordion 4 หมวด (TH+EN), LINE/โทร CTA |

### Phase 2: Conversion

| Route | File | ทำอะไร |
|-------|------|--------|
| `/notifications` | `app/notifications/page.tsx` | announcement feed (Supabase + static fallback), order quick-link |
| `/messages` | `app/messages/page.tsx` | form ส่งข้อความ → API → Supabase |
| `/reviews` | `app/reviews/page.tsx` | รีวิวหมด + rating summary + filter ดาว + pagination + modal form + **photo upload (3 รูป)** |

### Admin

| Route | File | ทำอะไร |
|-------|------|--------|
| `/admin` | `app/admin/page.tsx` | Dashboard 7 แท็บ: สินค้า / สต็อก / ออเดอร์ / ข้อความ / ซัพพอร์ต / ใบกำกับภาษี / รีวิว |
| `/admin/login` | `app/admin/login/page.tsx` | redirect → `/login?next=/admin` (ใช้ login กลาง) |
| (guard) | `app/admin/layout.tsx` | server-side check: role admin/owner + admin_active จาก DB |

---

## API Routes — 29 endpoint

### Public (ลูกค้า)

| Endpoint | Method | ทำอะไร |
|----------|--------|--------|
| `/api/orders` | POST | สร้าง order + upload slip (magic-bytes) + email ยืนยัน · rate limit 10/ชม./IP |
| `/api/orders/[orderId]` | GET | **ปิดถาวร → 410** (track ผ่าน order-lookup OTP เท่านั้น) |
| `/api/order-lookup/request-otp` | POST | ขอ OTP → email (generic 200 เสมอ กัน enumeration) |
| `/api/order-lookup/verify` | POST | check OTP (TTL 10 นาที, max 5) |
| `/api/order-lookup/history` | POST | **verify OTP → ดึงทุก order ของ email** |
| `/api/messages` | POST | รับข้อความ → `messages` |
| `/api/reviews` | GET | ดึงรีวิว published (filter: productId, rating, page) |
| `/api/reviews` | POST | ส่งรีวิว → `reviews` (published=false รอ approve) |
| `/api/reviews/upload-image` | POST | **upload รูปรีวิว → `review-images` bucket** |
| `/api/announcements` | GET | ดึง announcement published (anon read) |
| `/api/health` | GET | health check |

### Auth (custom — รายละเอียดเต็มใน docs/API.md)

| Endpoint | Method | ทำอะไร |
|----------|--------|--------|
| `/api/auth/register` | POST | สมัคร (rate limit 5/ชม./IP, สร้าง profile, set cookie) |
| `/api/auth/login` | POST | login (rate limit 10 fail/15น./IP+email, bcrypt เสมอกัน timing) |
| `/api/auth/logout` · `/logout-all` | POST | ออกจากระบบ เครื่องนี้ / ทุกเครื่อง |
| `/api/auth/me` | GET | user ปัจจุบันจาก session cookie |
| `/api/auth/forgot-password` · `/reset-password` | POST | reset รหัสผ่านผ่านลิงก์อีเมล (token ครั้งเดียว 30 นาที) |
| `/api/admin/setup-owner` | POST | bootstrap owner คนแรก (secret, timing-safe) |
| `/api/admin/users/[id]/role` | PATCH | owner เปลี่ยน role/admin_active (กัน demote ตัวเอง + audit) |

### Admin (ต้อง session + role admin/owner — `requireAdmin()`)

| Endpoint | Method | ทำอะไร |
|----------|--------|--------|
| `/api/admin/orders` | GET | ดึง order หมด |
| `/api/admin/orders/[orderId]` | PATCH | update status / tracking → **email แจ้งลูกค้า (Resend)** |
| `/api/admin/orders/[orderId]/slip-url` | POST | signed URL slip (private bucket) |
| `/api/admin/products` | GET / POST | ดึงสินค้า / เพิ่มสินค้า |
| `/api/admin/products/[productId]` | PATCH / DELETE | แก้ / ลบ |
| `/api/admin/products/[productId]/stock` | PATCH | update stock / in_stock |
| `/api/admin/product-images/upload` | POST | upload รูป → Storage |
| `/api/admin/product-images/delete` | POST | ลบรูป → Storage |
| `/api/admin/messages` | GET | ดึงข้อความหมด |
| `/api/admin/messages/[messageId]` | GET / POST / PATCH | thread / reply (author='shop', set replied) + แนบรูป / update status |
| `/api/admin/tickets` | GET | ดึงตั๋วซัพพอร์ตหมด |
| `/api/admin/tickets/[ticketId]` | GET / POST / PATCH | thread / reply (set answered) + แนบรูป / status (open/answered/closed) |
| `/api/admin/tax-invoices` | GET | คำขอใบกำกับภาษี + enrich order total/email |
| `/api/admin/tax-invoices/[id]` | PATCH | mark issued/requested |
| `/api/admin/reviews` | GET | ดึงรีวิวหมด (รวม unpublished) |
| `/api/admin/reviews/[reviewId]` | PATCH | approve/reject (published true/false) |
| `/api/admin/reviews/[reviewId]` | DELETE | ลบรีวิว |

---

## Components

```
components/
├── layout/
│   ├── Navbar.tsx           ← nav, search → /search, theme, lang, cart, mobile menu, 🔔 notif bell (red dot)
│   ├── Footer.tsx           ← 3-column: ยี่ห้อ/รุ่น · ช่วยเหลือ · ติดต่อ/social
│   ├── LineFloatButton.tsx  ← floating LINE button (bottom-right, ทุกหน้า)
│   └── PageLoader.tsx       ← loading screen
├── product/
│   └── ProductCard.tsx      ← card: รูป, ชื่อ, ราคา, add to cart
├── admin/
│   └── ProductModal.tsx     ← add/edit product (3 section: info / image / spec+stock)
└── PromptPayQR.tsx          ← PromptPay QR (canvas, dynamic amount)
```

---

## Admin Dashboard — 7 แท็บ

### แท็บ สินค้า
- ตาราง + thumbnail, ค้นหา real-time, pagination (50/page)
- เพิ่ม / แก้ / ลบ (ProductModal), alert stock

### แท็บ สต็อก
- +/- adjust, inline edit, toggle in_stock, alert stock ต่ำ/หมด, Export CSV

### แท็บ ออเดอร์
- ค้นหา (เลข/ชื่อ/เบอร์), update status, ใส่ tracking → auto-set shipping + **email แจ้งลูกค้า**
- ดู slip (signed URL), Export CSV

### แท็บ ข้อความ (Phase 2 + 3.5)
- แสดงข้อความลูกค้า, badge "ใหม่"
- **reply thread ในแชต (chat bubble) + แนบรูป** (Phase 3.5), ตอบ Email (mailto), mark replied/closed

### แท็บ ซัพพอร์ต (Phase 3.5)
- ตั๋วซัพพอร์ตทั้งหมด, badge สถานะ (รอตอบ/ตอบแล้ว/ปิด), topic, rating ลูกค้า
- reply thread + แนบรูป (ตอบ → answered), ปิด/เปิดตั๋ว, แสดงรูปแนบจากลูกค้า + order ที่ผูก

### แท็บ ใบกำกับภาษี (Phase 3.5)
- queue คำขอใบกำกับ: tax_id / company / address + order total/email
- mark "ออกใบกำกับแล้ว" / ย้อนเป็นรอออก, badge รอออก/ออกแล้ว

### แท็บ รีวิว (Phase 2)
- แสดงรีวิวหมด (รวมรอ approve), badge status
- Approve (published=true) / Reject / ลบ

### ProductModal — 3 section
1. **ข้อมูล** — รหัส, ชื่อ EN/TH, หมวด (card UI), detail, flags
2. **รูป** — drag & drop upload, URL paste, carousel preview, thumbnail
3. **spec & stock** — วัสดุ, stock, สี (dot), รุ่นรถ (group by brand, select-all)

---

## Database (Supabase) — 11 ตาราง

### `products`
| Column | Type | ทำอะไร |
|--------|------|--------|
| id | TEXT PK | |
| code | TEXT | รหัส เช่น CB.1 |
| name / name_th | TEXT | ชื่อ EN / TH |
| price | INTEGER | ราคา บาท |
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
| Column | Type | ทำอะไร |
|--------|------|--------|
| id | TEXT PK | เช่น GGB-LB3K8XZA |
| status | TEXT | pending/paid/shipping/delivered/cancelled |
| recipient_name/phone/address | TEXT | |
| shipping_method | TEXT | kerry/flash/pickup |
| shipping_fee, cod_fee, subtotal, total | INTEGER | |
| payment_method | TEXT | transfer/cod |
| items | JSONB | [{productId, code, name, price, qty, color}] |
| slip_path | TEXT | Storage path (private bucket) |
| tracking_no, contact_email | TEXT | |
| idempotency_key | TEXT | UUID กัน duplicate checkout |
| created_at | TIMESTAMPTZ | |

### `order_lookup_otps`
| Column | ทำอะไร |
|--------|--------|
| order_id | FK → orders.id |
| otp_hash | SHA-256 ของ OTP 6 หลัก |
| expires_at | TTL 10 นาที |
| attempts | max 5, cooldown 2 นาที |

### `admin_login_attempts` — rate limit (5/15min per IP hash)

### `stock_movements` — log stock เปลี่ยนทุกครั้ง

### `audit_logs` — admin action trail (actor_email, action, entity, before/after JSON, ip_hash)

### `messages` *(Phase 2)*
| Column | ทำอะไร |
|--------|--------|
| sender_name, sender_email, sender_phone | คนส่ง |
| subject, body | เนื้อหา |
| product_code | รหัสสินค้า (optional) |
| status | new / replied / closed |

### `reviews` *(Phase 2)*
| Column | ทำอะไร |
|--------|--------|
| product_id | FK → products.id |
| reviewer_name, rating (1-5), comment | เนื้อหา |
| order_id | optional (ยืนยันซื้อ) |
| images | JSONB (รูปรีวิว, สูงสุด 3) |
| helpful_count | counter |
| published | false จนกว่า admin approve |

### `announcements` *(Phase 2)*
| Column | ทำอะไร |
|--------|--------|
| title_th, title_en, body_th, body_en | เนื้อหา 2 ภาษา |
| type | info / promo / update / shipping |
| published, pinned | visibility flag |

---

## Storage Buckets (Supabase)

| Bucket | Public | ใช้ทำ | Max |
|--------|--------|-------|-----|
| `order-slips` | ❌ Private | slip โอน (admin อ่านผ่าน signed URL) | 5 MB |
| `product-images` | ✅ Public | รูปสินค้า (admin upload) | 5 MB |
| `review-images` | ✅ Public | รูปรีวิวลูกค้า | 5 MB |

---

## Lib / Utilities

| ไฟล์ | ทำอะไร |
|------|--------|
| `lib/cart.tsx` | CartContext: add, remove, clear, qty, localStorage |
| `lib/lang.tsx` | LangContext: TH/EN, wrap i18n.ts |
| `lib/i18n.ts` | translation ทุกหน้า (Phase 1+2): nav/home/product/cart/checkout/order/contact/categories/gallery/dealer/payment/racing/search/support/notifications/messages/reviews/colors |
| `lib/theme.tsx` | ThemeContext: light/dark, CSS var |
| `lib/supabase/client.ts` | browser client (SSR) |
| `lib/supabase/server.ts` | server client |
| `lib/supabase/service.ts` | service role client — bypass RLS |
| `lib/auth.ts` | `getCurrentUser()` / `requireUser()` / `requireAdmin()` / `requireOwner()` |
| `lib/session.ts` | custom session: token → SHA-256 → `user_sessions` + httpOnly cookie |
| `lib/password.ts` | bcrypt hash/verify (12 rounds) |
| `lib/auth/require-admin.ts` `require-user.ts` | guard เก่า — delegate ไป `lib/auth.ts` |
| `lib/api/` | **API toolkit**: `apiOk/apiError+ERR` (error codes) · `apiLog` (JSON log) · `isRateLimited/recordAttempt` (DB-backed) · `readJson` |
| `lib/audit.ts` | `writeAuditLog()` → audit_logs (server-only, never throw) |
| `lib/admin-audit.ts` | `logAdminAction()` → admin_audit_logs |
| `lib/email.ts` | order confirm + OTP + status update + **password reset** via Resend |
| `lib/csv.ts` | `escapeCsvCell()` + `toCsvRow()` — กัน formula injection |
| `lib/promptpay.ts` | `buildPromptPayPayload()` — EMV QR (CRC16, TLV), static + dynamic amount |

---

## Security Architecture

### Auth Flow (custom)
```
POST /api/auth/login
  → rate limit: 10 fails / 15 min per IP + per email (DB-backed, login_attempts)
  → bcrypt.compare เสมอ (แม้ไม่พบ user — กัน timing attack)
  → check status='active'
  → random token 32 bytes → SHA-256 → user_sessions
  → httpOnly cookie tgb_session (secure, sameSite=lax)

/admin → middleware เช็ค cookie → admin/layout.tsx เช็ค role+admin_active จาก DB
```

### Order Lookup OTP Flow
```
POST /api/order-lookup/request-otp  ← always 200 (prevents enumeration)
  → SHA-256 OTP hash → order_lookup_otps (TTL 10 min, cooldown 2 min)
  → sendOtpEmail() via Resend

POST /api/order-lookup/verify
  → verify hash, check TTL + attempts (max 5) → return order

POST /api/order-lookup/history
  → verify OTP → return all orders WHERE contact_email = email
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

Admin updates order status
  → PATCH /api/admin/orders/[id] → sendStatusUpdateEmail() to customer

Shop owner adds announcement
  → Supabase dashboard → announcements table
  → GET /api/announcements → /notifications + 🔔 bell red dot
```

---

## UX Features

### Global
- **Floating LINE button** — fixed bottom-right ทุกหน้า (`LineFloatButton.tsx`)
- **🔔 Notification bell** — Navbar, red dot เมื่อมี announcement ใหม่ (compare localStorage `gigabike-notif-seen`)
- **Dark/Light theme** — CSS var, localStorage
- **Bilingual TH/EN** — localStorage, ทุกหน้า

### Storefront
- `/products` — **multi-select** bike + category (Set state, checkbox sidebar, chip ลบทีละอัน), pagination 24/page, sort
- `/` home — **multi-select** bike pill + category tab, pagination 24/page
- `/search` — empty state แสดง 8 category shortcut + 16 bike pill, instant filter
- `/products/[id]` — lightbox zoom, รีวิว inline, "ส่งข้อความถามสินค้านี้" → `/messages?product=CODE`
- `/order` — vertical timeline + clickable Kerry/Flash tracking link
- `/checkout` — **PromptPay QR** (auto amount) + bank transfer + slip upload

### Homepage
- Hero carousel (auto 3.5s) + trust badge
- bike + category filter + grid + pagination
- **ReviewsStrip** — 4 รีวิวล่าสุด + "เขียนรีวิว" card (load จาก `/api/reviews`)

---

## หมวดหมู่ (Categories)

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

## รุ่นรถ (Bike Models) — 26 รุ่น

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
   PromptPay QR        Supabase DB          email ยืนยัน
   + slip upload        +Storage            (Resend)
```

### Order Tracking
```
/order  → กรอก order ID → POST request-otp → email OTP
        → กรอก OTP → POST verify → status + timeline + tracking link

/orders → กรอก email + order ID → OTP → POST history → ทุก order ของ email
```

### Reviews
```
/reviews → เขียนรีวิว (modal) + upload รูป → POST /api/reviews (published=false)
Admin Reviews tab → Approve → published=true → โผล่บนเว็บ
Home ReviewsStrip + /products/[id] reviews → แสดงรีวิว approve แล้ว
```

### Messages
```
/messages (หรือ /products/[id] → ส่งข้อความ) → POST /api/messages
Admin ข้อความ tab → ตอบ Email → PATCH mark replied
```

---

## สถานะ Feature (Status)

| Feature | Status | หมายเหตุ |
|---------|--------|----------|
| Product catalog (822 item) | ✅ | legacy import ครบ |
| Product image | ✅ | legacy + admin upload |
| Shopping cart | ✅ | localStorage, color variant |
| Checkout + slip upload | ✅ | Supabase Storage private |
| **PromptPay QR** | ✅ | EMV QR auto amount, `lib/promptpay.ts` |
| Order tracking + OTP | ✅ | 6-digit email OTP, TTL 10 min |
| **Order history** | ✅ | `/orders` email+OTP → ทุก order |
| Vertical order timeline | ✅ | status step + timestamp |
| Tracking link (Kerry/Flash) | ✅ | clickable ใน /order |
| Email: confirm + OTP + **status update** | ✅ | Resend, แจ้งลูกค้าตอน status เปลี่ยน |
| Auth (custom, ไม่ใช้ Supabase Auth) | ✅ | bcrypt + session token + rate limit + audit |
| Admin: Products CRUD | ✅ | ProductModal 3-section |
| Admin: Stock | ✅ | inline edit, +/-, Export CSV |
| Admin: Orders | ✅ | status + tracking, Export CSV |
| Admin: Messages tab | ✅ | view, reply email, mark status |
| Admin: Reviews tab | ✅ | approve/reject/delete |
| Audit logging | ✅ | audit_logs table |
| CSV formula-injection safe | ✅ | escapeCsvCell() |
| **Multi-select filter** | ✅ | bike + category, home + /products |
| Search page `/search` | ✅ | category shortcut + bike pill |
| Support / FAQ | ✅ | accordion 4 หมวด TH+EN |
| `/notifications` + 🔔 bell | ✅ | announcement + static fallback + red dot |
| `/messages` | ✅ | form → messages table |
| `/reviews` + **photo upload** | ✅ | list + rating + form + 3 รูป |
| Reviews on product detail | ✅ | mini-section + avg rating |
| Reviews on homepage | ✅ | ReviewsStrip |
| Floating LINE button | ✅ | global ทุกหน้า |
| Dealer page | ✅ | 18 ตัวแทน |
| Payment info page | ✅ | EMS ฟรี, นโยบาย, บัญชี |
| Racing gallery | ✅ | gallery + racing product |
| Bilingual TH/EN | ✅ | i18n.ts ทุกหน้า |
| Dark/Light theme | ✅ | CSS var |
| Netlify deploy | ✅ | netlify.toml + build-catalog |
| Payment gateway (real) | ❌ | มี PromptPay QR + slip, ยังไม่มี gateway ตัด auto |
| Push notification | ❌ | email only (เลือก email-on-status แทน) |

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=       # project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # anon key (browser-safe)
SUPABASE_SERVICE_ROLE_KEY=      # service role key (server only)

# Custom auth
CUSTOM_AUTH_SESSION_COOKIE=tgb_session
CUSTOM_AUTH_SESSION_DAYS=14
ADMIN_SETUP_SECRET=             # ค่า random — ใช้ bootstrap owner คนแรก (endpoint ปิดถาวรเมื่อมี owner)
# ALLOW_ADMIN_SETUP=true        # production เท่านั้น: เปิดชั่วคราวตอน bootstrap แล้วลบทิ้ง

# Site
NEXT_PUBLIC_SITE_URL=           # origin จริง เช่น https://www.thaigigabike.com (ใช้สร้างลิงก์ reset password)

# Email (Resend)
RESEND_API_KEY=                 # order confirm + OTP + status email
EMAIL_FROM=                     # sender เช่น orders@thaigigabike.com
```

---

## Supabase Setup

**รันครั้งเดียว (idempotent — รันซ้ำได้):**
```
supabase-setup.sql    ← table + RLS + policy + storage bucket + Phase 2 table
supabase-products.sql ← 822 product seed
```

**Phase 2 table ท้ายไฟล์ supabase-setup.sql:**
- `messages` — RLS on, service_role only
- `reviews` — anon read published=true, admin approve
- `announcements` — anon read published=true, admin สร้างผ่าน dashboard
- bucket `review-images` — public read

---

## Scripts & Build

| Script | คำสั่ง | ทำอะไร |
|--------|--------|--------|
| predev | (auto) | `kill-port 3000` ก่อน dev ทุกครั้ง — กัน stale process |
| dev | `npm run dev` | dev server (predev kill port เอง) |
| dev:clean | `npm run dev:clean` | kill port + rimraf `.next` + cache → dev (ปุ่มฉุกเฉิน) |
| prebuild | (auto) | `kill-port 3000` ก่อน build |
| build | `npm run build` | rimraf `.next` → production build (✅ 0 error) |
| import-legacy | `node scripts/import-legacy.mjs` | parse HTTrack → legacy-products.json |
| build-catalog | `npm run build-catalog` | JSON → products.generated.ts |

> 🪨 dev cache พัง (404 / MIME error) = process เก่าค้าง port 3000. `predev` kill ให้เอง. พังหนัก → `npm run dev:clean`. helper: `kill-port` + `rimraf` (devDep).

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

ตั้ง env var หมดใน Netlify Dashboard → Site Settings → Environment Variables
