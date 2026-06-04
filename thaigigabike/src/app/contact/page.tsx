'use client'
import { Phone, Mail, Clock, MapPin, Truck } from 'lucide-react'
import { useLang } from '@/lib/lang'

export default function ContactPage() {
  const { t, locale } = useLang()

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 720 }}>
        <h1 style={{ fontSize: 38, marginBottom: 6 }}>{t.contact.title}</h1>
        <p style={{ color: 'var(--text2)', marginBottom: 32, fontSize: 17 }}>{t.contact.subtitle}</p>

        {/* Contact cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            {
              icon: <Phone size={18} color="var(--green)" />,
              label: locale === 'th' ? 'โทรศัพท์' : 'Phone',
              value: '081-424-9407',
              href: 'tel:0814249407',
            },
            {
              icon: <Mail size={18} color="var(--green)" />,
              label: 'Email',
              value: 'aonggb@yahoo.com',
              href: 'mailto:aonggb@yahoo.com',
            },
            {
              icon: <Clock size={18} color="var(--green)" />,
              label: locale === 'th' ? 'เวลาทำการ' : 'Business Hours',
              value: t.contact.hours,
              href: null,
            },
            {
              icon: <MapPin size={18} color="var(--green)" />,
              label: locale === 'th' ? 'ที่ตั้ง' : 'Address',
              value: t.contact.address,
              href: 'https://maps.google.com/?q=99/21-22+Rama+2+Bangkok',
            },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'var(--bg2)', border: '0.5px solid var(--border)',
              borderRadius: 12, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 36, height: 36, background: 'var(--bg3)', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 2 }}>{item.label}</div>
                {item.href
                  ? <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener"
                      style={{ fontSize: 15, color: 'var(--green)', textDecoration: 'none', fontWeight: 500 }}>
                      {item.value}
                    </a>
                  : <div style={{ fontSize: 15, color: 'var(--text)' }}>{item.value}</div>
                }
              </div>
            </div>
          ))}
        </div>

        {/* Shipping note */}
        <div style={{
          background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.25)',
          borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center',
          gap: 10, marginBottom: 20, fontSize: 15, color: 'var(--text2)',
        }}>
          <Truck size={16} color="var(--green)" style={{ flexShrink: 0 }} />
          {t.contact.shipping}
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href="https://line.me/ti/p/~thaigigabike"
            target="_blank" rel="noopener"
            className="btn-primary"
            style={{ textDecoration: 'none', justifyContent: 'center', flex: 1 }}
          >
            LINE: thaigigabike
          </a>
          <a
            href="https://www.facebook.com/Aonggigabike"
            target="_blank" rel="noopener"
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#1877F2', color: '#fff', borderRadius: 8, padding: '10px',
              fontSize: 17, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-display)',
            }}
          >
            Facebook
          </a>
        </div>

        {/* How to order */}
        <div style={{
          marginTop: 32, background: 'var(--bg2)', border: '0.5px solid var(--border)',
          borderRadius: 12, padding: '20px 24px',
        }}>
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>
            {locale === 'th' ? 'วิธีสั่งสินค้า' : 'How to Order'}
          </h2>
          {locale === 'th' ? (
            <ol style={{ paddingLeft: 20, color: 'var(--text2)', lineHeight: 2, fontSize: 15 }}>
              <li>ส่งรหัสสินค้า (เช่น CB.1) มาที่ LINE หรือ SMS</li>
              <li>เลือกสี / ฟินิช / จำนวน</li>
              <li>รอการยืนยันสต๊อกและยอดชำระ</li>
              <li>โอนเงินพร้อมแจ้งชื่อ-ที่อยู่ทาง LINE</li>
              <li>สินค้าจัดส่งภายใน 3 วัน ทาง EMS, Kerry หรือ Flash</li>
            </ol>
          ) : (
            <ol style={{ paddingLeft: 20, color: 'var(--text2)', lineHeight: 2, fontSize: 15 }}>
              <li>Send us the part code (e.g. CB.1) via LINE or SMS</li>
              <li>Choose color / finish / quantity</li>
              <li>Wait for stock confirmation and invoice</li>
              <li>Transfer payment and send your name + address via LINE</li>
              <li>Ships within 3 days by EMS, Kerry, Flash, or sea freight</li>
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
