'use client'
import Link from 'next/link'
import { Disc, Settings, Wrench, Activity, Package, Wind, Zap } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { categories, products } from '@/data/products'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  disc:     <Disc size={28} color="var(--green)" />,
  settings: <Settings size={28} color="var(--green)" />,
  tool:     <Wrench size={28} color="var(--green)" />,
  activity: <Activity size={28} color="var(--green)" />,
  link:     <Zap size={28} color="var(--green)" />,
  bolt:     <Zap size={28} color="var(--green)" />,
  package:  <Package size={28} color="var(--green)" />,
  wind:     <Wind size={28} color="var(--green)" />,
}

const CATEGORY_DESC: Record<string, { th: string; en: string }> = {
  brake:       { th: 'ฝาปิดน้ำมันเบรค · ก้านเบรคแต่ง · แคลิปเปอร์ CNC · ไลน์เบรคถัก', en: 'Brake fluid caps · Brake levers · CNC calipers · Braided brake lines' },
  engine:      { th: 'ฝาครอบเครื่องยนต์ · น็อตตกแต่ง · ชุดปิดช่องน้ำมัน · บูชซีลเครื่อง', en: 'Engine covers · Decorative bolts · Oil caps · Seal plugs' },
  suspension:  { th: 'หัวน็อตแผงคอบน-ล่าง · สเตมเมอร์ CNC · วงเล็บโช๊ค · Triple tree', en: 'Top yoke bolts · CNC stem nuts · Fork clamps · Triple trees' },
  chassis:     { th: 'แฮนด์บาร์ · ฝาถัง · เท้าพักคนขับ-ซ้อน · แผงครอบต่างๆ', en: 'Handlebars · Tank covers · Foot pegs · Frame covers' },
  drivetrain:  { th: 'สเตอร์ CNC Billet · น็อตสเตอร์ · อะแดปเตอร์สเตอร์ · ตัวปรับโซ่', en: 'CNC sprockets · Sprocket bolts · Sprocket adaptors · Chain adjusters' },
  hardware:    { th: 'น็อต CNC ทุกขนาด · สกรู Stainless · น็อตหัวขนาน · ชุดน็อตตกแต่ง', en: 'CNC bolt sets · Stainless screws · Flanged bolts · Dress-up bolt kits' },
  accessories: { th: 'กระจกมองหลัง · ปีกผีเสื้อ · ที่จับโทรศัพท์ · อุปกรณ์แต่งเพิ่มเติม', en: 'Mirrors · Bar-end caps · Phone mounts · Accent accessories' },
  exhaust:     { th: 'คอท่อ CNC · Header pipe · Exhaust bracket · ข้อต่อท่อ Stainless', en: 'CNC exhaust headers · Header pipes · Exhaust brackets · Stainless joints' },
}

export default function CategoriesPage() {
  const { t, locale } = useLang()

  return (
    <div>
      <section style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '32px 0' }}>
        <div className="container">
          <h1 style={{ fontSize: 38, marginBottom: 4 }}>{t.nav.categories}</h1>
          <p style={{ color: 'var(--text2)', fontSize: 17 }}>
            {locale === 'th'
              ? `${categories.length} หมวดหมู่ · CNC Billet ทุกชิ้น · ผลิตในไทย`
              : `${categories.length} categories · All CNC Billet · Made in Thailand`}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {categories.map(cat => {
              const count = products.filter(p => p.category === cat.id).length
              const desc = CATEGORY_DESC[cat.id]
              return (
                <Link key={cat.id} href={`/products?cat=${cat.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      background: 'var(--bg2)', border: '1px solid var(--border)',
                      borderRadius: 12, padding: '22px 20px', height: '100%',
                      transition: 'border-color .15s, transform .15s, box-shadow .15s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = 'var(--green)'
                      el.style.transform = 'translateY(-2px)'
                      el.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = 'var(--border)'
                      el.style.transform = 'translateY(0)'
                      el.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{
                      width: 48, height: 48, background: 'var(--green-dim)',
                      borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 14,
                    }}>
                      {CATEGORY_ICONS[cat.icon] ?? <Package size={28} color="var(--green)" />}
                    </div>
                    <h2 style={{ fontSize: 20, marginBottom: 4, color: 'var(--text)' }}>
                      {locale === 'th' ? cat.nameTh : cat.name}
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 10, lineHeight: 1.6 }}>
                      {desc ? (locale === 'th' ? desc.th : desc.en) : ''}
                    </p>
                    <span style={{
                      display: 'inline-block', fontSize: 13, color: 'var(--green)',
                      background: 'var(--green-dim)', borderRadius: 6, padding: '2px 10px',
                    }}>
                      {locale === 'th' ? `${count} รายการ` : `${count} items`}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
