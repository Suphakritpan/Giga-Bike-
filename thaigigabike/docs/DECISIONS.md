# Architecture Decision Records (ADR) — ThaiGigaBike

บันทึกการตัดสินใจเชิงสถาปัตยกรรม + เหตุผล สำหรับคนที่มาทำต่อ
(สรุปจาก Council review 2026-06-12 — สถานะ ณ commit a3f46ae)

---

## ADR-001: ใช้ Custom Auth แทน Supabase Auth ทั้งหมด

**สถานะ:** ใช้งานจริงแล้ว (มิ.ย. 2026)

**บริบท:** เดิมใช้ Supabase Auth (auth.users + Google OAuth) ต้องการควบคุม
ระบบสมาชิกเองทั้งหมด ไม่ผูกกับ vendor auth

**ตัดสินใจ:** bcryptjs (12 rounds) + session token สุ่ม 32 bytes → เก็บเฉพาะ
SHA-256 ใน `user_sessions` → browser ได้ httpOnly cookie (`tgb_session`,
sameSite=lax) · ไม่มี JWT · ไม่มี OAuth

**เหตุผล:** ควบคุม schema/flow เองเต็มที่, ไม่มี dependency กับ auth.users,
ตาราง users อยู่ใน public schema จัดการได้ตรง ๆ

**แลกกับ:** ทีมรับภาระ security เอง (ไม่มี vendor patch ให้) — จึงต้องมี:
timing-safe compare, bcrypt เสมอแม้ไม่พบ user, rate limit ทุกจุด, token
ใช้ครั้งเดียว ทั้งหมด implement แล้ว

---

## ADR-002: Service-role only + filter ใน API (ไม่ใช้ RLS per-user)

**สถานะ:** ใช้งานจริงแล้ว

**บริบท:** RLS แบบ `auth.uid()` ใช้ไม่ได้เมื่อถอด Supabase Auth (uid เป็น NULL เสมอ)

**ตัดสินใจ:** ตาราง account ทั้งหมดเปิด RLS โดยไม่มี policy (= service role
เท่านั้น) ทุก API route ผ่าน `requireUser()` แล้ว filter `user_id` จาก session เอง

**เงื่อนไขบังคับ (อย่าละเมิด):**
- per-row lookup ใช้ `getOwnedRow()` จาก `@/lib/api` เสมอ
- route ใหม่ทุกตัวต้องผ่าน checklist ใน docs/API.md ข้อ 5
- เพิ่ม endpoint ใหม่ → เพิ่ม 401 sweep test ใน tests/api-security.spec.ts

**ความเสี่ยงที่ยอมรับ:** พลาด filter ครั้งเดียว = data leak — ราวกันตกคือ
helper + checklist + test ไม่ใช่ database barrier

---

## ADR-003: Email verification gate ข้อมูลที่ match ด้วยอีเมล

**สถานะ:** ใช้งานจริงแล้ว

**บริบท:** สมัครไม่บังคับยืนยันอีเมล แต่ account merge guest orders/messages
ด้วยอีเมล → คนสมัครด้วยอีเมลคนอื่นจะเห็นประวัติของเจ้าของอีเมลได้

**ตัดสินใจ:** ไม่บังคับ verify ตอนสมัคร (ไม่เพิ่ม friction) แต่ข้อมูลที่ merge
ด้วยอีเมล (orders/inbox/export) แสดงเฉพาะเมื่อ `users.email_verified_at` มีค่า
· เปลี่ยนอีเมล = reset เป็น unverified เสมอ · UI มี `VerifyEmailBanner` อธิบาย

---

## ADR-004: Rate limiting เก็บใน Postgres (ตาราง login_attempts + kind)

**สถานะ:** ใช้งานจริงแล้ว

**เหตุผล:** Netlify serverless — in-memory counter หายทุก cold start และไม่
share ข้าม instance · Postgres คือ state กลางเดียวที่มี · ลิมิตทั้งหมดดูที่
docs/API.md ข้อ 2

**แลกกับ:** +1 query ต่อ request ที่เช็คลิมิต — ยอมรับได้ที่สเกลร้านนี้
(ถ้าโตมากค่อยย้ายไป Upstash Redis)

---

## ADR-005: Migration = 2 ไฟล์ idempotent รันมือใน SQL Editor

**สถานะ:** ใช้งานจริงแล้ว (consolidate มิ.ย. 2026)

**ตัดสินใจ:** `setup.sql` + `custom-auth.sql` (รวม 4 phase) ทุกคำสั่ง
IF EXISTS/IF NOT EXISTS รันซ้ำได้ · ลำดับดู supabase/README.md

**เมื่อไหร่ควรเปลี่ยน:** ถ้ามี dev >1 คนหรือ schema เปลี่ยนบ่อย ให้ย้ายไป
Supabase CLI migrations (`supabase migration new`) เพื่อได้ history ใน DB

---

## Council Review 2026-06-12 — ความเสี่ยงคงเหลือ (เรียงตามน้ำหนัก)

| # | ความเสี่ยง | ระดับ | แผน |
|---|---|---|---|
| 1 | Phase 4 hardening ยังไม่ apply บน DB จริง — anon ยัง INSERT orders ตรง + เรียก create_order_atomic ได้ | 🔴 บล็อก | รัน `custom-auth.sql` ซ้ำใน SQL Editor |
| 2 | งาน 6 commits อยู่ในเครื่องเดียว ไม่ได้ push | 🔴 บล็อก | `git push origin main` |
| 3 | env ใหม่ยังไม่ตั้งใน Netlify (`ADMIN_SETUP_SECRET`, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY` ฯลฯ) — ถ้าไม่มี RESEND, reset/verify email จะเงียบหาย | 🔴 บล็อก | ตั้ง env → deploy → bootstrap owner → ลบ `ALLOW_ADMIN_SETUP` |
| 4 | ไม่มี cross-user test จริง (มีแต่ 401 sweep) | 🟠 สูง | seed 2 บัญชีทดสอบ ยืนยัน A อ่าน/แก้ของ B ไม่ได้ ก่อนเปิดรับ user จริง |
| 5 | เปลี่ยนอีเมล/รหัสผ่านไม่แจ้งเตือนไปอีเมลเดิม | 🟡 กลาง | งานเฟสหน้า: ส่ง notification email |
| 6 | public forms พึ่ง IP rate limit อย่างเดียว | 🟡 กลาง | งานเฟสหน้า: Turnstile/honeypot |
| 7 | ไม่มี CI — test รันมือเท่านั้น | 🟡 กลาง | รัน `npm run test:e2e:api` กับ deploy preview ก่อนเปิด; ระยะยาว: GitHub Actions |
| 8 | รูปอัปโหลดไม่ strip EXIF / re-encode | 🟢 ต่ำ | เฟสหน้า (ต้องเพิ่ม sharp) |
| 9 | storefront pages ยังไม่ใช้ UI kit | 🟢 ต่ำ | migrate เมื่อแตะไฟล์ (FRONTEND.md ข้อ 7) |
