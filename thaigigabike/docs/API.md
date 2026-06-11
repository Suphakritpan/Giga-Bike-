# ThaiGigaBike — API Reference

เอกสารสำหรับนักพัฒนาที่มาทำต่อ — ครอบคลุมโครงสร้าง, conventions, error codes, rate limits และรายการ endpoint ทั้งหมด

อัปเดตล่าสุด: 2026-06-11 (หลังเปลี่ยนมาใช้ custom auth เต็มรูปแบบ)

---

## 1. ภาพรวมสถาปัตยกรรม

```
Next.js 14 App Router (Netlify)
├── middleware.ts          → เช็ค session cookie (edge, ไม่แตะ DB)
├── src/app/api/           → Route Handlers ทั้งหมด
│   ├── auth/              → สมัคร / เข้า-ออกระบบ / รีเซ็ตรหัสผ่าน
│   ├── account/           → ข้อมูลส่วนตัวของ user ที่ล็อกอิน
│   ├── admin/             → งานหลังบ้าน (ต้องเป็น admin/owner)
│   └── (public)           → orders, reviews, announcements, order-lookup, messages, health
├── src/lib/api/           → API toolkit กลาง (ดูข้อ 2)
├── src/lib/auth.ts        → getCurrentUser / requireUser / requireAdmin / requireOwner
├── src/lib/session.ts     → สร้าง/อ่าน/ลบ session (token → SHA-256 → DB)
└── src/lib/password.ts    → bcrypt hash/verify (12 rounds)
```

**Auth model:** custom session token (random 32 bytes, เก็บเฉพาะ SHA-256 hash ใน
ตาราง `user_sessions`) ส่งให้ browser ผ่าน httpOnly cookie ชื่อ `tgb_session`
ไม่ใช้ Supabase Auth เลย — Supabase ใช้เป็น Postgres + Storage เท่านั้น

**Database clients:**
| client | ไฟล์ | ใช้เมื่อ |
|---|---|---|
| `createServiceClient()` | `lib/supabase/service.ts` | ทุก route ที่ผ่าน requireUser/requireAdmin แล้ว — **ต้อง filter `user_id` เองเสมอ** เพราะ bypass RLS |
| `createClient()` (anon) | `lib/supabase/server.ts` | เฉพาะข้อมูล public (reviews ที่ published, announcements) |

---

## 2. API Toolkit (`src/lib/api`)

ทุก route ใหม่ให้ import จาก `@/lib/api`:

```ts
import { apiOk, apiError, ERR, apiLog, isRateLimited, recordAttempt, hashIp, readJson } from '@/lib/api'
```

### Response envelope

- **สำเร็จ:** `200/201` + payload ของ route นั้น เช่น `{ user: {...} }`
- **ล้มเหลว:** `{ "error": "<ข้อความภาษาไทย>", "code": "<ERROR_CODE>" }`

### Error codes (`ERR`)

| code | HTTP | ความหมาย |
|---|---|---|
| `BAD_REQUEST` | 400 | ข้อมูล input ผิด/ขาด |
| `UNAUTHORIZED` | 401 | ไม่มี session หรือ session หมดอายุ |
| `FORBIDDEN` | 403 | ล็อกอินแล้วแต่ไม่มีสิทธิ์ (เช่น ไม่ใช่ admin, บัญชีถูกระงับ) |
| `NOT_FOUND` | 404 | ไม่พบข้อมูล หรือไม่ใช่เจ้าของข้อมูล |
| `CONFLICT` | 409 | ข้อมูลซ้ำ (เช่น อีเมลถูกใช้แล้ว) |
| `RATE_LIMITED` | 429 | ยิงคำขอถี่เกินกำหนด |
| `INTERNAL_ERROR` | 500 | ข้อผิดพลาดที่ไม่คาดคิด |

> หมายเหตุ: route เก่าบางตัวยังตอบ `{ error }` โดยไม่มี `code` — เวลาแก้ไฟล์ไหน
> ให้ migrate มาใช้ `apiError()` ไปด้วย

### Logging (`apiLog`)

JSON หนึ่งบรรทัดต่อ event ค้นหาใน Netlify log ได้ด้วย route name:

```ts
apiLog.info('POST /api/auth/login', 'login success', { userId })
apiLog.warn('POST /api/auth/login', 'rate limited', { ipHash: ipHash.slice(0, 16) })
apiLog.error('POST /api/auth/reset-password', err, { userId })
```

**ห้าม log:** password, token, service key, `password_hash`

### Rate limiting

เก็บใน Postgres (ตาราง `login_attempts` + คอลัมน์ `kind`) เพราะ in-memory
counter หายทุก cold start บน serverless:

```ts
if (await isRateLimited({ kind: 'login', ipHash, max: 10, windowMs: 15*60*1000, failuresOnly: true })) {
  return apiError(ERR.RATE_LIMITED, '...')
}
await recordAttempt({ kind: 'login', email, ipHash, success })
```

ลิมิตที่ใช้อยู่:

| kind | ขอบเขต | ลิมิต | window |
|---|---|---|---|
| `login` | IP และ email (นับเฉพาะ fail) | 10 | 15 นาที |
| `register` | IP | 5 | 1 ชั่วโมง |
| `reset` | IP | 5 | 15 นาที |

### Caching (public GET)

endpoint สาธารณะที่อ่านอย่างเดียวใส่ CDN cache:

```
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```

ใช้แล้วที่ `/api/announcements`, `/api/reviews` (GET)

---

## 3. Auth helpers

```ts
const user = await getCurrentUser()              // CustomUser | null
const { user, error } = await requireUser()      // 401 ถ้าไม่ล็อกอิน
const { user, error } = await requireAdmin()     // + 403 ถ้าไม่ใช่ admin/owner หรือ admin_active=false
const { user, error } = await requireOwner()     // + 403 ถ้าไม่ใช่ owner
if (error) return error                          // error เป็น NextResponse พร้อมใช้
```

`CustomUser` (จาก `src/types/user.ts`): `id, email, full_name, phone, line_id, role('customer'|'admin'|'owner'), admin_active, status('active'|'banned'|'pending')`

---

## 4. Endpoint reference

### 4.1 `/api/auth` — ระบบสมาชิก

| Method + Path | Auth | Body | ตอบกลับ (สำเร็จ) |
|---|---|---|---|
| `POST /api/auth/register` | — | `{ email, password (≥8), full_name? }` | `201 { user: {id, email, full_name} }` + set cookie |
| `POST /api/auth/login` | — | `{ email, password }` | `{ user: {id, email, role} }` + set cookie |
| `POST /api/auth/logout` | cookie | — | `{ ok: true }` + ลบ cookie |
| `POST /api/auth/logout-all` | session | — | `{ ok: true }` ลบทุก session ของ user |
| `GET /api/auth/me` | cookie | — | `{ user: CustomUser }` หรือ 401 `{ user: null }` |
| `POST /api/auth/forgot-password` | — | `{ email }` | `{ ok: true }` เสมอ (ไม่บอกว่ามีบัญชีไหม) |
| `POST /api/auth/reset-password` | — | `{ token, password (≥8) }` | `{ ok: true }` + ลบทุก session |

ความปลอดภัย: login รัน bcrypt เสมอแม้ไม่พบ user (กัน timing attack) ·
register ไม่รับ `role`/`admin_active`/`status` จาก client เด็ดขาด ·
reset token ใช้ครั้งเดียว หมดอายุ 30 นาที เก็บเฉพาะ hash

### 4.2 `/api/account` — ข้อมูลของ user ที่ล็อกอิน (ทุกตัว requireUser)

| Method + Path | ใช้ทำอะไร |
|---|---|
| `GET/PATCH /api/account/profile` | โปรไฟล์ (สร้าง row อัตโนมัติถ้ายังไม่มี) |
| `POST /api/account/avatar` | อัปโหลดรูป (multipart `file`; JPG/PNG/WebP ≤2MB) → `{ avatar_url }` |
| `POST /api/account/change-email` | `{ new_email, password }` — ต้องยืนยันรหัสผ่าน |
| `GET/POST /api/account/addresses` + `PATCH/DELETE /[addressId]` | สมุดที่อยู่ |
| `GET/POST/PATCH/DELETE /api/account/wishlist` | สินค้าที่ถูกใจ (+ตั้งแจ้งเตือน) |
| `GET /api/account/orders` + `GET /[orderId]` + `POST /[orderId]/cancel` | ออเดอร์ของฉัน (รวม guest order ที่อีเมลตรง) |
| `GET /api/account/reviews` + `PATCH/DELETE /[reviewId]` | รีวิวของฉัน |
| `GET/POST /api/account/tickets` + `GET/POST/PATCH /[ticketId]` | ตั๋ว support |
| `GET /api/account/messages` + `/[messageId]` | กล่องข้อความ |
| `GET /api/account/login-events` | ประวัติการล็อกอิน |
| `POST /api/account/tax-invoice` | ขอใบกำกับภาษี |
| `GET /api/account/export` | ดาวน์โหลดข้อมูลทั้งหมด (PDPA) |
| `POST /api/account/delete` | `{ password }` — ลบบัญชีถาวร |

กติกาสำคัญ: ทุก query ใช้ service client + filter `user_id`/`email` ของ session
เสมอ — **ห้าม** รับ user id จาก client

### 4.3 `/api/admin` — หลังบ้าน (requireAdmin ผ่าน `lib/auth/require-admin.ts`)

| กลุ่ม | endpoint |
|---|---|
| สินค้า | `GET/POST /api/admin/products`, `PATCH/DELETE /[productId]`, `PATCH /[productId]/stock` |
| รูปสินค้า | `POST /api/admin/product-images/upload`, `POST /api/admin/product-images/delete` |
| ออเดอร์ | `GET /api/admin/orders`, `PATCH /[orderId]`, `POST /[orderId]/slip-url` (signed URL 10 นาที) |
| รีวิว | `GET /api/admin/reviews`, `PATCH/DELETE /[reviewId]` |
| ข้อความ | `GET /api/admin/messages`, `PATCH /[messageId]` |
| ตั๋ว | `GET /api/admin/tickets`, `PATCH /[ticketId]` |
| ใบกำกับภาษี | `GET /api/admin/tax-invoices`, `PATCH /[id]` |
| จัดการสิทธิ์ | `PATCH /api/admin/users/[id]/role` — **owner เท่านั้น**; กัน owner ลดสิทธิ์ตัวเอง; เขียน audit log |
| Bootstrap | `POST /api/admin/setup-owner` — `{ secret, email }`; ปิดตัวเองถ้า `ADMIN_SETUP_SECRET` เป็นค่า default; เทียบ secret แบบ timing-safe |

ทุก action สำคัญเขียน audit log (`lib/audit.ts` → `audit_logs`, `lib/admin-audit.ts` → `admin_audit_logs`)

### 4.4 Public

| Method + Path | หมายเหตุ |
|---|---|
| `POST /api/orders` | สร้างออเดอร์ (ราคา/ค่าส่งคำนวณฝั่ง server เท่านั้น; idempotency key; ผูก user อัตโนมัติถ้าล็อกอิน) |
| `GET /api/orders/[orderId]` | ปิดใช้แล้ว → 410 (ใช้ order-lookup แทน) |
| `POST /api/order-lookup/request-otp` → `verify` → `history` | ติดตามออเดอร์ของ guest ผ่าน OTP อีเมล |
| `GET/POST /api/reviews`, `POST /api/reviews/upload-image` | รีวิวสาธารณะ (POST เข้าคิวรอ approve) |
| `GET /api/announcements` | ประกาศ (cache 60s) |
| `POST /api/messages` | ฟอร์มติดต่อ |
| `GET /api/health` | health check |

---

## 5. การเพิ่ม endpoint ใหม่ (checklist)

1. วางไฟล์ใน `src/app/api/<group>/.../route.ts` ตามกลุ่ม (auth / account / admin / public)
2. เริ่มด้วย auth guard ที่ถูกชั้น: `requireUser()` / `requireAdmin()` / `requireOwner()`
3. อ่าน body ด้วย `readJson(req)` — ห้าม `await req.json()` ตรง ๆ (throw ได้)
4. validate ทุก field + `.trim().slice(0, n)` กัน payload ยาว
5. ตอบ error ด้วย `apiError(ERR.X, 'ข้อความไทย')` เท่านั้น
6. query ผ่าน `createServiceClient()` + filter ด้วย id จาก session
7. endpoint ที่โดน abuse ได้ (สร้างข้อมูล, ส่งอีเมล) → ใส่ `isRateLimited`/`recordAttempt`
8. event สำคัญ → `apiLog.info/warn/error` (ห้ามมี secret)
9. แอดมินทำอะไรกับข้อมูล → เขียน audit log
10. อัปเดตตารางในเอกสารนี้ + เพิ่ม test ใน `tests/api-security.spec.ts`

---

## 6. Environment variables

ดู `.env.example` — สรุป:

| ตัวแปร | ใช้ทำอะไร |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client สาธารณะ (อ่าน public data) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server เท่านั้น** — service client |
| `CUSTOM_AUTH_SESSION_COOKIE` (default `tgb_session`) | ชื่อ session cookie |
| `CUSTOM_AUTH_SESSION_DAYS` (default 14) | อายุ session |
| `ADMIN_SETUP_SECRET` | bootstrap owner คนแรก (เปลี่ยนจากค่า default ก่อนใช้) |
| `RESEND_API_KEY` + `EMAIL_FROM` | ส่งอีเมล (ยืนยันออเดอร์ / OTP / reset password) |
| `NEXT_PUBLIC_SITE_URL` | origin ของเว็บ (ใช้สร้างลิงก์ reset password ฯลฯ) |

## 7. Database (ตาราง auth)

migration ตามลำดับ: `supabase/setup.sql` → `supabase/custom-auth.sql` → `supabase/custom-auth-phase2.sql`

| ตาราง | เก็บอะไร |
|---|---|
| `users` | บัญชี + `password_hash` (bcrypt) + role/status |
| `user_sessions` | SHA-256 ของ session token + expiry |
| `login_attempts` | rate limiting (`kind`: login/register/reset) |
| `password_reset_tokens` | SHA-256 ของ reset token, ใช้ครั้งเดียว |
| `login_events` | ประวัติการล็อกอิน (โชว์ใน settings) |
| `admin_audit_logs` | การกระทำของแอดมิน |

ทุกตาราง auth เปิด RLS โดยไม่มี policy = เข้าถึงได้ผ่าน service role เท่านั้น
ตารางฝั่ง account (profiles, addresses, …) FK ไป `public.users` และเข้าถึงผ่าน
API route เท่านั้น (phase2 migration ลบ policy `auth.uid()` ทิ้งแล้ว)
