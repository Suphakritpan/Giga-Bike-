'use client'
import { Phone, Mail, Clock, MapPin } from 'lucide-react'
import { useLang } from '@/lib/lang'

export default function ContactPage() {
  const { t, locale } = useLang()
  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 680 }}>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>{t.contact.title}</h1>
        <p style={{ color: 'var(--text2)', marginBottom: 32 }}>GIGA BIKE FACTORY — Racing Special Parts</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { icon: <Phone size={18} color="var(--green)" />, label: locale === 'th' ? 'โทรศัพท์' : 'Phone', value: '081-424-9407', href: 'tel:0814249407' },
            { icon: <Mail size={18} color="var(--green)" />, label: 'Email', value: 'aonggb@yahoo.com', href: 'mailto:aonggb@yahoo.com' },
            { icon: <Clock size={18} color="var(--green)" />, label: locale === 'th' ? 'เวลาทำการ' : 'Hours', value: '09:00 – 20:00', href: null },
            { icon: <MapPin size={18} color="var(--green)" />, label: locale === 'th' ? 'ที่ตั้ง' : 'Location', value: locale === 'th' ? 'ประเทศไทย' : 'Thailand', href: null },
          ].map((item, i) => (
            <div key={i} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, background: 'var(--bg3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{item.label}</div>
                {item.href
                  ? <a href={item.href} style={{ fontSize: 14, color: 'var(--green)', textDecoration: 'none', fontWeight: 500 }}>{item.value}</a>
                  : <div style={{ fontSize: 14 }}>{item.value}</div>
                }
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <a href="https://line.me/ti/p/~thaigigabike" target="_blank" rel="noopener" className="btn-primary" style={{ textDecoration: 'none', justifyContent: 'center', flex: 1 }}>
            LINE: thaigigabike
          </a>
          <a href="https://www.facebook.com/Aonggigabike" target="_blank" rel="noopener" style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#1877F2', color: '#fff', borderRadius: 8, padding: '10px',
            fontSize: 14, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-display)',
          }}>
            Facebook: Aonggigabike
          </a>
        </div>
      </div>
    </div>
  )
}
