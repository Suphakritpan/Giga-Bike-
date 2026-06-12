# ThaiGigaBike — CNC Racing Parts E-commerce

เว็บไซต์ร้านอะไหล่แต่งมอเตอร์ไซค์ CNC (รีโนเวตจากเว็บ Giga Bike เดิม)
Next.js 14 App Router · Supabase (Postgres + Storage) · Custom Auth · Netlify · Resend

## เริ่มต้นพัฒนา

```bash
cd thaigigabike
npm install
cp .env.example .env.local   # แล้วเติมค่า Supabase (ดูคอมเมนต์ในไฟล์)
npm run dev                  # http://localhost:3000
```

ตั้งฐานข้อมูลครั้งแรก: รัน SQL ตามลำดับใน [thaigigabike/supabase/README.md](thaigigabike/supabase/README.md)

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | dev server (kill port 3000 ให้อัตโนมัติ) |
| `npm run build` | production build + typecheck + lint |
| `npm run test:e2e:api` | security test ฝั่ง API |
| `npx playwright test tests/cross-user-security.spec.ts` | cross-user isolation test |
| `npm run build:catalog` | แปลง legacy JSON → `products.generated.ts` + `products-seed.sql` (ใช้เฉพาะตอน import ของเก่า) |

## เอกสาร (อ่านตามลำดับนี้)

| ไฟล์ | สำหรับ |
|---|---|
| [PROJECT-MAP.md](PROJECT-MAP.md) | แผนที่ทั้งโปรเจกต์ — หน้า/API/ตาราง/ฟีเจอร์ทั้งหมด |
| [thaigigabike/docs/API.md](thaigigabike/docs/API.md) | สเปก API ทุก endpoint + conventions + error codes |
| [thaigigabike/docs/FRONTEND.md](thaigigabike/docs/FRONTEND.md) | Design tokens + UI kit + checklist สร้างหน้าใหม่ |
| [thaigigabike/docs/DECISIONS.md](thaigigabike/docs/DECISIONS.md) | ADR — ทำไมระบบถึงออกแบบแบบนี้ + ความเสี่ยงคงเหลือ |

## สิ่งที่ต้องรู้ก่อนแก้โค้ด

- **Auth เป็น custom ทั้งหมด** — ไม่ใช้ Supabase Auth (เหตุผลใน ADR-001)
- **ทุก query ฝั่ง user ผ่าน API route + service role** — ห้าม query Supabase ตรงจาก browser ยกเว้นข้อมูล public (ADR-002)
- โฟลเดอร์ `HTTrack My Web Sites/`, `legacy-analysis/`, `sitemap-out/` คือไฟล์อ้างอิงเว็บเก่า — ห้ามแตะ
