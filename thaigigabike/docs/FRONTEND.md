# ThaiGigaBike — Frontend Guide

คู่มือหน้าบ้านสำหรับนักพัฒนาที่มาทำต่อ — design tokens, UI kit, โครงสร้างหน้า, conventions

อัปเดตล่าสุด: 2026-06-11

---

## 1. โครงสร้าง

```
src/
├── app/                      ← หน้าทั้งหมด (App Router)
│   ├── layout.tsx            ← root: fonts, providers, Navbar/Footer, skip-link
│   ├── (storefront pages)    ← /, /products, /cart, /checkout, /order, ...
│   ├── account/              ← layout sidebar + 10 หน้า (ต้องล็อกอิน)
│   ├── admin/                ← dashboard (server-side guard ใน layout.tsx)
│   ├── login|signup|forgot-password|reset-password  ← auth (ใช้ AuthShell)
│   ├── error.tsx not-found.tsx                      ← error boundaries
├── components/
│   ├── ui/                   ← ★ UI kit กลาง (ดูข้อ 3)
│   ├── layout/               ← Navbar, Footer, PageLoader, LineFloatButton
│   ├── auth/AuthShell.tsx    ← กรอบหน้า login/signup/reset
│   ├── product/ProductCard.tsx
│   └── admin/ProductModal.tsx
├── styles/globals.css        ← ★ design tokens + utility classes ทั้งหมด
└── lib/                      ← contexts: cart, lang(i18n), theme, auth, wishlist
```

## 2. Design tokens (globals.css)

**สี — ใช้ CSS variable เท่านั้น ห้าม hard-code hex** (เพื่อรองรับ dark mode อัตโนมัติ):

| ตัวแปร | ใช้กับ |
|---|---|
| `--bg` `--bg2` `--bg3` `--bg4` | พื้นหลัง: หน้า → การ์ด → input → hover |
| `--text` `--text2` `--text3` | ตัวอักษร: หลัก → รอง → จาง |
| `--border` `--border2` | เส้นขอบบาง → เข้ม |
| `--green` `--green-bright` `--green-dim` | สีแบรนด์ / hover / พื้นอ่อน |
| `--orange` `--red` | เตือน / อันตราย-ลบ |

**ฟอนต์:** `--font-display` (Barlow Condensed — heading/ปุ่ม) · `--font-body` (Barlow)
Dark mode สลับด้วย `[data-theme="dark"]` (ThemeProvider + script กัน flash ใน layout)

**Utility classes สำคัญ:** `.container` (max 1200px) · `.section` · `.card` · `.btn-primary/.btn-outline/.btn-ghost/.btn-danger` · `.input` (+ `.field-input` ขนาดฟอร์ม) · `.badge-*` · `.nav-link` · `.icon-btn` · `.spinner` · `.skeleton` · `.toggle` · `.skip-link` · grids: `.grid-checkout/.grid-cart/.grid-products/.grid-detail`

ทุก interactive class มี `:focus-visible` ring และระบบเคารพ `prefers-reduced-motion` แล้ว

## 3. UI kit (`components/ui`) — ใช้ก่อนเขียนเอง

```tsx
import { Button, Field, Card, Toggle, Spinner, Skeleton, SkeletonList, EmptyState, PageHeader, ConfirmDialog } from '@/components/ui'
```

| Component | ใช้เมื่อ | ตัวอย่าง |
|---|---|---|
| `Button` | ปุ่มทุกชนิด (variant: primary/outline/ghost/danger, `loading`, `small`) | `<Button onClick={save} loading={saving}>บันทึก</Button>` |
| `Field` | ฟอร์มทุก input/textarea/select — ผูก label+error อัตโนมัติ (a11y) | `<Field label="อีเมล" type="email" error={err} ... />` |
| `Card` | กล่องเนื้อหา (optional `title` หัวข้อ uppercase) | `<Card title="ความปลอดภัย">...</Card>` |
| `Toggle` | สวิตช์เปิด/ปิด (ต้องส่ง `label` สำหรับ screen reader) | `<Toggle on={x} onClick={...} label="แจ้งเตือน" />` |
| `Spinner` | กำลังโหลด (`center` = block กลางหน้า) | `<Spinner center />` |
| `Skeleton(List)` | placeholder ระหว่างโหลด list/บล็อก | `<SkeletonList rows={3} height={92} />` |
| `EmptyState` | หน้าว่าง — มี icon + title + ปุ่มชวนไปต่อเสมอ | ดู account/wishlist |
| `PageHeader` | h1 มาตรฐานของทุกหน้า account/admin (+`subtitle`, `actions`) | `<PageHeader title={t.account.orders} />` |
| `ConfirmDialog` | ยืนยัน action อันตราย (แทน `confirm()`) — Esc/คลิกพื้นหลังปิด, `danger`, `loading` | `<ConfirmDialog open={x} danger title="ยกเลิกออเดอร์?" confirmLabel="ยกเลิก" cancelLabel="ไม่ใช่ตอนนี้" onConfirm={...} onCancel={...} />` |

**กติกา:** ห้ามเขียน inline `@keyframes`, กล่องการ์ด, h1 fontSize เอง หรือใช้ `alert()`/`confirm()` — ใช้ kit (ConfirmDialog สำหรับยืนยัน, inline `role="status"`/`role="alert"` สำหรับ feedback)

**Migrate แล้วทั้ง account section** (ทุกหน้าใช้ PageHeader + SkeletonList + EmptyState):
layout, dashboard, orders (+detail), addresses, wishlist, reviews, messages, tickets, history, profile, settings

**`VerifyEmailBanner`** (`components/account/`) — แบนเนอร์เตือนยืนยันอีเมล แสดงอัตโนมัติเมื่อ
`user.email_verified_at` เป็น null (ใช้ใน dashboard, orders, messages) — render เป็น null เมื่อยืนยันแล้ว

**หน้าโปรไฟล์/ความปลอดภัย:**
- `/account/profile` — ชื่อ, เบอร์, **LINE ID** (เก็บที่ users table ผ่าน profile PATCH), avatar, อีเมล (read-only + badge สถานะยืนยัน ลิงก์ไป settings)
- `/account/settings` Security card — ยืนยันอีเมล, เปลี่ยนอีเมล (ยืนยันรหัสผ่าน), **เปลี่ยนรหัสผ่าน** (`/api/account/change-password` — revoke session อื่นทั้งหมด), ประวัติล็อกอิน, ออกจากระบบทุกอุปกรณ์

## 4. มาตรฐานสร้างหน้าใหม่ (checklist)

1. Page wrapper: `<div className="container section">` (storefront) หรือใช้ layout ของกลุ่ม (account/admin มีอยู่แล้ว)
2. หัวหน้าเพจ: `<PageHeader title={...} />` — h1 เดียวต่อหน้า
3. ทุก state ต้องครบ 4 แบบ: **loading** (`Spinner`/`SkeletonList`) → **error** (ข้อความไทย + ปุ่มลองใหม่) → **empty** (`EmptyState` + action) → **data**
4. ข้อความทุกชิ้นผ่าน i18n: `const { t, locale } = useLang()` — เพิ่ม key ใน `lib/i18n.ts` ทั้ง th/en
5. สี/ฟอนต์จาก CSS vars เท่านั้น; ปุ่ม-ฟอร์มจาก UI kit
6. รูปสินค้า: `<img loading="lazy">` + `alt` เสมอ
7. ปุ่มที่มีแต่ไอคอน → `aria-label`; ฟอร์ม → ใช้ `Field` (จัดการ label ให้)
8. Responsive: ใช้ grid classes ที่มี breakpoint แล้ว (900px / 640px) — mobile-first ตรวจที่ 375px เสมอ
9. fetch ฝั่ง client: จัดการ `.catch` เสมอ, อย่าปล่อย unhandled rejection
10. ห้าม import `@/lib/supabase/client` ในหน้าใหม่ — ข้อมูลทุกอย่างผ่าน API route (ดู docs/API.md)

## 5. Providers ที่มีให้ใช้ (root layout ครอบแล้ว)

| Hook | จาก | ให้อะไร |
|---|---|---|
| `useLang()` | `lib/lang` | `t` (translations), `locale`, `setLocale` |
| `useTheme()` | `lib/theme` | `theme`, `toggle` |
| `useAuth()` | `lib/auth/AuthContext` | `user` (CustomUser), `profile`, `loading`, `signOut`, `refreshUser`, `refreshProfile` |
| `useCart()` | `lib/cart` | cart state + actions (localStorage) |
| `useWishlist()` | `lib/wishlist` | wishlist (DB เมื่อล็อกอิน / localStorage เมื่อ guest, merge ตอน login) |

## 6. Auth pages

ใช้ `AuthShell` (`components/auth/AuthShell.tsx`) + `authInput/authLabel` styles
Flow: login → `POST /api/auth/login` → `refreshUser()` → `router.push(next)` — `?next=` ผ่าน `sanitizeNextPath()` เสมอ (กัน open redirect)

## 7. สิ่งที่รู้ไว้ / หนี้ทางเทคนิค

- ฐาน font-size 24px ใน globals.css ใหญ่กว่ามาตรฐาน — หน้าเก่าชดเชยด้วย inline fontSize; ห้ามแก้ฐานโดยไม่ไล่ตรวจทุกหน้า
- account section migrate เข้า kit ครบแล้ว; หน้า storefront (products, checkout, cart, ฯลฯ) ยังเป็น inline style — เวลาแตะไฟล์ไหน ให้ migrate มาใช้ UI kit ไปด้วย
- ไม่มี `alert()`/`confirm()` แล้ว — ยืนยันใช้ `ConfirmDialog`, feedback ใช้ inline `role="status"`/`role="alert"` ต่อหน้า; ยังไม่มี Toast system กลาง (ตั้งใจ — จุด feedback ยังน้อย)
- รูปใช้ `<img>` ธรรมดา (ไม่ใช่ next/image) — ตั้งใจ เพราะรูป legacy หลากหลายขนาด
