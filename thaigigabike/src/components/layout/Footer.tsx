'use client'
import Link from 'next/link'
import { Zap, Phone, Mail, Clock } from 'lucide-react'
import { useLang } from '@/lib/lang'

export function Footer() {
  const { t } = useLang()
  return (
    <footer style={{ background: 'var(--bg2)', borderTop: '0.5px solid var(--border)', marginTop: 64, padding: '48px 0 24px' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, marginBottom: 40 }}>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Zap size={18} color="var(--green)" />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>
                Thai<span style={{ color: 'var(--green)' }}>Giga</span>Bike
              </span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8 }}>
              GIGA BIKE FACTORY<br />
              CNC Racing Parts · Custom Part &amp; Accessories<br />
              99/21-22 ถ.พระราม 2 แสมดำ<br />
              บางขุนเทียน กทม. 10150<br />
              <span style={{ color: 'var(--text3)' }}>Product Of Thailand · ผลิตในไทย</span>
            </p>
            {/* Racing stripe accent */}
            <div style={{ width: 48, height: 4, marginTop: 16, background: 'var(--green)', borderRadius: 2 }} />
          </div>

          <div>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              {t.nav.products}
            </h4>
            {[
              { id: 'sr400', label: 'Yamaha SR400/500' },
              { id: 'cb750', label: 'Honda CB750' },
              { id: 'w650', label: 'Kawasaki W650' },
              { id: 'thruxton', label: 'Triumph Thruxton' },
              { id: 's1000rr', label: 'BMW S1000RR' },
            ].map(m => (
              <Link key={m.id} href={`/products?bike=${m.id}`} style={{ display: 'block', fontSize: 16, color: 'var(--text2)', textDecoration: 'none', marginBottom: 6 }}>
                {m.label}
              </Link>
            ))}
          </div>

          <div>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              {t.nav.contact}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="tel:0814249407" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text2)', textDecoration: 'none', fontSize: 16 }}>
                <Phone size={14} color="var(--green)" /> 081-424-9407
              </a>
              <a href="mailto:aonggb@yahoo.com" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text2)', textDecoration: 'none', fontSize: 16 }}>
                <Mail size={14} color="var(--green)" /> aonggb@yahoo.com
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text2)', fontSize: 16 }}>
                <Clock size={14} color="var(--green)" /> {t.contact.hours}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <a href="https://line.me/ti/p/~thaigigabike" target="_blank" rel="noopener" style={{
                background: '#06C755', color: '#fff', border: 'none', borderRadius: 8,
                padding: '7px 16px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
                textDecoration: 'none', fontFamily: 'var(--font-display)',
              }}>
                LINE
              </a>
              <a href="https://www.facebook.com/Aonggigabike" target="_blank" rel="noopener" style={{
                background: '#1877F2', color: '#fff', border: 'none', borderRadius: 8,
                padding: '7px 16px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
                textDecoration: 'none', fontFamily: 'var(--font-display)',
              }}>
                Facebook
              </a>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 14, color: 'var(--text3)' }}>© 2006–{new Date().getFullYear()} GIGA BIKE FACTORY — ThaiGigaBike. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/racing" style={{ fontSize: 14, color: 'var(--text3)', textDecoration: 'none' }}>{t.nav.racing}</Link>
            <Link href="/dealer" style={{ fontSize: 14, color: 'var(--text3)', textDecoration: 'none' }}>{t.nav.dealer}</Link>
            <Link href="/payment" style={{ fontSize: 14, color: 'var(--text3)', textDecoration: 'none' }}>{t.nav.payment}</Link>
            <Link href="/order" style={{ fontSize: 14, color: 'var(--text3)', textDecoration: 'none' }}>{t.nav.trackOrder}</Link>
            <Link href="/contact" style={{ fontSize: 14, color: 'var(--text3)', textDecoration: 'none' }}>{t.nav.contact}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
