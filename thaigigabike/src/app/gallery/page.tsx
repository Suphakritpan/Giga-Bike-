'use client'
import { ImageOff } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { products } from '@/data/products'

export default function GalleryPage() {
  const { locale } = useLang()

  return (
    <div>
      <section style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '32px 0' }}>
        <div className="container">
          <h1 style={{ fontSize: 38, marginBottom: 4 }}>
            {locale === 'th' ? 'ผลงาน' : 'Gallery'}
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 17 }}>
            {locale === 'th' ? 'ตัวอย่างผลงาน CNC จากโรงงาน' : 'CNC parts crafted in our factory'}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {products.map(p => (
              <div key={p.id} style={{
                background: 'var(--bg2)', border: '0.5px solid var(--border)',
                borderRadius: 12, overflow: 'hidden',
              }}>
                <div style={{
                  height: 180, background: 'var(--bg3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderBottom: '0.5px solid var(--border)',
                }}>
                  <ImageOff size={32} color="var(--text3)" />
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2, fontFamily: 'var(--font-display)' }}>{p.code}</div>
                  <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>
                    {locale === 'th' ? p.nameTh : p.name}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{p.material.split(' ')[0]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
