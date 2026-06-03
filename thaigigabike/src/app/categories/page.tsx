'use client'
import Link from 'next/link'
import { Disc, Settings, Wrench, Activity, Package, Wind } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { categories, products } from '@/data/products'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  disc:     <Disc size={28} color="var(--green)" />,
  settings: <Settings size={28} color="var(--green)" />,
  tool:     <Wrench size={28} color="var(--green)" />,
  activity: <Activity size={28} color="var(--green)" />,
  package:  <Package size={28} color="var(--green)" />,
  wind:     <Wind size={28} color="var(--green)" />,
}

export default function CategoriesPage() {
  const { t, locale } = useLang()

  return (
    <div>
      <section style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '32px 0' }}>
        <div className="container">
          <h1 style={{ fontSize: 32, marginBottom: 4 }}>{t.nav.categories}</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>
            {locale === 'th' ? `${categories.length} หมวดหมู่` : `${categories.length} categories`}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {categories.map(cat => {
              const count = products.filter(p => p.category === cat.id).length
              return (
                <Link key={cat.id} href={`/products?cat=${cat.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: '24px 20px',
                    transition: 'border-color .2s, transform .2s, box-shadow .2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--green)'
                    el.style.transform = 'translateY(-2px)'
                    el.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--border)'
                    el.style.transform = 'translateY(0)'
                    el.style.boxShadow = 'none'
                  }}>
                    <div style={{ width: 48, height: 48, background: 'var(--green-dim)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                      {CATEGORY_ICONS[cat.icon] ?? <Package size={28} color="var(--green)" />}
                    </div>
                    <h2 style={{ fontSize: 18, marginBottom: 4, color: 'var(--text)' }}>
                      {locale === 'th' ? cat.nameTh : cat.name}
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--text3)' }}>
                      {locale === 'th' ? `${count} รายการ` : `${count} items`}
                    </p>
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
