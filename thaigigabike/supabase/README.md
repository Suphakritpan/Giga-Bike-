# supabase/ — Database migrations

ลำดับรันบนฐานข้อมูลใหม่ (SQL Editor → New query):

| ลำดับ | ไฟล์ | เก็บอะไร |
|---|---|---|
| 1 | `setup.sql` | ตารางหลักทั้งหมด: products, orders, OTP lookup, audit, stock, messages, reviews, announcements, account tables (profiles/addresses/wishlists/tickets/…), storage buckets, RPC `create_order_atomic` |
| 2 | `custom-auth.sql` | **ระบบ auth ทั้งหมด** (รวม 4 phase ไว้ไฟล์เดียว): users + sessions + rate limiting + audit → ย้าย FK ออกจาก auth.users → email verification → security hardening |
| 3 | `products-seed.sql` | seed สินค้า 818 รายการ |

ทุกไฟล์ idempotent — รันซ้ำได้ปลอดภัย

**สถานะ production (ตรวจ 2026-06-12):** ทุกไฟล์ถูก apply แล้ว ยกเว้นส่วน Phase 4
(hardening) ใน custom-auth.sql ที่เพิ่มทีหลัง — รัน custom-auth.sql ทั้งไฟล์ซ้ำได้เลย

หมายเหตุ:
- ห้ามใช้ Supabase Auth (auth.users) — ระบบ auth เป็น custom ทั้งหมด อ่านรายละเอียดที่ `docs/API.md`
- ตาราง auth/account เปิด RLS โดยไม่มี policy = เข้าถึงได้ผ่าน service role เท่านั้น (API routes filter `user_id` เอง)
- ไฟล์ `schema.sql` เดิม (ยุคก่อน setup.sql) ถูกลบแล้ว — schema จริงดูจาก setup.sql + custom-auth.sql
