'use client'
import { useLang } from '@/lib/lang'
import { CheckCircle, Phone } from 'lucide-react'

const OFFICIAL_DEALERS = [
  { name: 'ภูกิจ มหามตย์กุล (ช่างหนูม)', address: '19 ม.2 ต.มาบโป่ง อ.พานทอง จ.ชลบุรี 20160', phone: '081-141-4164', shop: '' },
  { name: 'เอกรัตน์ ระวังการ (จิ๋ว)', address: '269/1-2 ม.4 ต.ทุ่งสมอ อ.เขาค้อ เพชรบูรณ์ 67270', phone: '091-771-4979', shop: '71 Bike Shop' },
  { name: 'ณรงค์ฤทธิ์ ทาสิงห์คำ', address: '17 ม.1 ต.สันผักหวาน อ.หางดง จ.เชียงใหม่ 50230', phone: '083-201-2068', shop: 'SR 108' },
  { name: 'กีร์ติ กล่ำกองกูล (ติ)', address: '156/2 ม.1 ต.รั้วใหญ่ อ.เมือง สุพรรณบุรี 72000', phone: '082-567-1345', shop: 'ติสุพรรณ' },
  { name: 'ธนภัทร สังข์อุ่น (โอม)', address: '134 ม.6 ต.เกาะสำโรง อ.เมือง จ.กาญจนบุรี 71000', phone: '090-872-6523', shop: 'Thanapat Classic Bike' },
  { name: 'ธีรยุทธ์ พิมพ์ทอง (กุ้ง พระราม.7)', address: '89/41 ซ.วัดหลวง แขวงบางซื่อ เขตบางซื่อ กทม.10800', phone: '086-899-2199', shop: '' },
  { name: 'เอกพจน์ ขวัญกระโทก (พจน์)', address: '107/1 ม.14 ต.โชคชัย อ.โชคชัย นครราชสีมา 30190', phone: '080-731-4544', shop: 'Poj Motor Shop' },
  { name: 'เอกชัย จันทร์ทอง', address: '116/8 ม.4 ต.ตาขัน อ.บ้านค่าย ระยอง 21120', phone: '062-127-4074', shop: '168 Shop' },
  { name: 'ฉันทัช พิทยาเลิศสุวรรณ (โน้ต)', address: '178/31 ถ.สายลวด ต.ปากน้ำ อ.เมือง สมุทรปราการ 10270', phone: '083-038-5424', shop: 'โน้ต ปากน้ำ' },
  { name: 'วิษณุ เลิศจันทรางกูร (เต้ย)', address: '34 หมู่บ้านพิบูลย์การ์เด้นวิว ถ.พิบูลสงคราม ซ.16 นนทบุรี 11000', phone: '090-226-4388', shop: '' },
  { name: 'K.โจ (ว่าไง วัยรุ่น)', address: '70/1 ม.2 ต.พญาเย็น อ.ปากช่อง นครราชสีมา 30320', phone: '087-926-1731', shop: 'SR Story' },
  { name: 'ทนงศักดิ์ ปริมาณ (มาส)', address: '118 ม.5 ต.ท่าชัย อ.ศรีสัชนาลัย สุโขทัย 64190', phone: '086-374-4431', shop: 'Mas Racing' },
  { name: 'ชญานนท์ ชูมา', address: '885/3 ม.1 ต.เขาทราย อ.ทับคล้อ จ.พิจิตร 66230', phone: '062-919-2998', shop: 'โปเต้พิจิตร' },
  { name: 'ณัฐพร (ช่างต้อง)', address: '141/48 ซ.8 ท่าอิฐบน อ.เมือง อุตรดิตถ์ 53000', phone: '080-514-5193', shop: 'TT Racing Shop' },
  { name: 'วินสัน (โย)', address: '97/10-11 ถ.บ้านดอนตูม อ.บ้านโป่ง จ.ราชบุรี 70110', phone: '086-054-2992', shop: 'WSW Custom Bike' },
  { name: 'วัชรินทร์', address: '14 ม.5 ต.เบิกไพร อ.บ้านโป่ง จ.ราชบุรี 70110', phone: '099-398-4444', shop: 'Pu Cycles' },
  { name: 'พงษ์พันธ์ ท่องแจ้ง (Banana Boat)', address: '2/189 ถ.โชคชัย4 ซ.20 แขวง-เขต ลาดพร้าว กทม.10230', phone: '085-953-5666', shop: '' },
  { name: 'พีระพงษ์ เพ็ชรทอง', address: '86/293 ซ.ไปดีมาดี ถ.นิพัทธ์สงเคราะห์5 ต.หาดใหญ่ จ.สงขลา 90110', phone: '087-292-2287', shop: 'Rock Motor' },
]

export default function DealerPage() {
  const { t, locale } = useLang()

  return (
    <div>
      <section style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '32px 0' }}>
        <div className="container">
          <h1 style={{ fontSize: 38, marginBottom: 4 }}>{t.dealer.title}</h1>
          <p style={{ color: 'var(--text2)', fontSize: 17 }}>{t.dealer.subtitle}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">

          {/* Dealer benefits */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 40 }}>
            {[
              { title: t.dealer.benefit1Title, desc: t.dealer.benefit1Desc },
              { title: t.dealer.benefit2Title, desc: t.dealer.benefit2Desc },
              { title: t.dealer.benefit3Title, desc: t.dealer.benefit3Desc },
            ].map((b, i) => (
              <div key={i} style={{
                background: 'var(--bg2)', border: '0.5px solid var(--border)',
                borderRadius: 12, padding: '18px 20px',
              }}>
                <CheckCircle size={18} color="var(--green)" style={{ marginBottom: 10 }} />
                <h3 style={{ fontSize: 16, marginBottom: 6 }}>{b.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{b.desc}</p>
              </div>
            ))}
          </div>

          {/* How to apply */}
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, marginBottom: 16 }}>{t.dealer.howTitle}</h2>
            <ol style={{ paddingLeft: 20, color: 'var(--text2)', lineHeight: 2.2, fontSize: 15 }}>
              <li>{t.dealer.step1}</li>
              <li>{t.dealer.step2}</li>
              <li>{t.dealer.step3}</li>
            </ol>
          </div>

          {/* Dealer rules */}
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>
              {locale === 'th' ? 'กฎตัวแทนจำหน่าย' : 'Dealer Rules'}
            </h2>
            {locale === 'th' ? (
              <ol style={{ paddingLeft: 20, color: 'var(--text2)', lineHeight: 2, fontSize: 14 }}>
                <li>ต้องสั่งสินค้าเข้าสต๊อก ห้ามจับเสือมือเปล่า ห้ามขายต่ำกว่าราคาร้าน</li>
                <li>หากฝากส่งให้ลูกค้าเลย คิดค่าบริการครั้งละ 100฿ (เฉพาะกรณีจำเป็นเท่านั้น)</li>
                <li>จัดส่งในชื่อโรงงาน GIGA BIKE FACTORY เท่านั้น</li>
              </ol>
            ) : (
              <ol style={{ paddingLeft: 20, color: 'var(--text2)', lineHeight: 2, fontSize: 14 }}>
                <li>Must carry stock — no dropshipping without approval; no undercutting store price</li>
                <li>Drop-ship service available at ฿100/order (for exceptional cases only)</li>
                <li>All shipments use the GIGA BIKE FACTORY sender name</li>
              </ol>
            )}
          </div>

          {/* Official dealer list */}
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>
            {locale === 'th' ? 'ตัวแทนจำหน่ายอย่างเป็นทางการ' : 'Official Dealer Network'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, marginBottom: 40 }}>
            {OFFICIAL_DEALERS.map((d, i) => (
              <div key={i} style={{
                background: 'var(--bg2)', border: '0.5px solid var(--border)',
                borderRadius: 10, padding: '14px 16px',
              }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{d.name}</div>
                {d.shop && (
                  <div style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                    {d.shop}
                  </div>
                )}
                <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.5, marginBottom: 8 }}>{d.address}</div>
                <a href={`tel:${d.phone.replace(/-/g, '')}`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 14, color: 'var(--green)', textDecoration: 'none', fontWeight: 500,
                }}>
                  <Phone size={12} /> {d.phone}
                </a>
              </div>
            ))}
          </div>

          {/* Apply CTA */}
          <div style={{ textAlign: 'center', padding: '32px 0', borderTop: '0.5px solid var(--border)' }}>
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>{t.dealer.contactTitle}</h3>
            <p style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 20 }}>{t.dealer.contactNote}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <a href="https://line.me/ti/p/~thaigigabike" target="_blank" rel="noopener"
                className="btn-primary" style={{ textDecoration: 'none' }}>
                LINE: thaigigabike
              </a>
              <a href="mailto:aonggb@yahoo.com" className="btn-outline"
                style={{ textDecoration: 'none' }}>
                aonggb@yahoo.com
              </a>
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}
