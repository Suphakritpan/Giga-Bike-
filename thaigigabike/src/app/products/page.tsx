'use client'
import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { products, bikeModels, categories } from '@/data/products'
import { ProductCard } from '@/components/product/ProductCard'

export default function ProductsPage() {
  const { t, locale } = useLang()
  const [query, setQuery] = useState('')
  const [selectedBike, setSelectedBike] = useState('all')
  const [selectedCat, setSelectedCat] = useState('all')
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default')

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const bikeOk = selectedBike === 'all' || p.bikeModels.includes(selectedBike)
      const catOk = selectedCat === 'all' || p.category === selectedCat
      const q = query.toLowerCase()
      const searchOk = !q || p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.nameTh.includes(q)
      return bikeOk && catOk && searchOk
    })
    if (sortBy === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    return list
  }, [query, selectedBike, selectedCat, sortBy])

  return (
    <div>
      {/* Header */}
      <section style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '32px 0' }}>
        <div className="container">
          <h1 style={{ fontSize: 32, marginBottom: 4 }}>{t.nav.products}</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>
            {locale === 'th' ? `${products.length} รายการ` : `${products.length} items`}
          </p>
        </div>
      </section>

      <div className="container section" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>

        {/* Sidebar filters */}
        <aside style={{ position: 'sticky', top: 72 }}>
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 13, fontWeight: 500 }}>
              <SlidersHorizontal size={14} color="var(--green)" />
              {locale === 'th' ? 'ตัวกรอง' : 'Filters'}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
              <input
                className="input"
                style={{ paddingLeft: 30, fontSize: 13 }}
                placeholder={t.nav.search}
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>

            {/* Category */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {t.nav.categories}
              </p>
              {[{ id: 'all', th: 'ทั้งหมด', en: 'All' }, ...categories.map(c => ({ id: c.id, th: c.nameTh, en: c.name }))].map(cat => (
                <button key={cat.id} onClick={() => setSelectedCat(cat.id)} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '7px 10px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                  border: 'none', marginBottom: 2, transition: 'all .15s',
                  background: selectedCat === cat.id ? 'rgba(34,197,94,.12)' : 'transparent',
                  color: selectedCat === cat.id ? 'var(--green)' : 'var(--text2)',
                  fontWeight: selectedCat === cat.id ? 500 : 400,
                }}>
                  {locale === 'th' ? cat.th : cat.en}
                </button>
              ))}
            </div>

            {/* Bike model */}
            <div>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {t.home.filterBy}
              </p>
              {[{ id: 'all', brand: '', model: locale === 'th' ? 'ทุกรุ่น' : 'All Models' }, ...bikeModels].map(bm => (
                <button key={bm.id} onClick={() => setSelectedBike(bm.id)} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '7px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  border: 'none', marginBottom: 2, transition: 'all .15s',
                  background: selectedBike === bm.id ? 'rgba(34,197,94,.12)' : 'transparent',
                  color: selectedBike === bm.id ? 'var(--green)' : 'var(--text2)',
                  fontWeight: selectedBike === bm.id ? 500 : 400,
                }}>
                  {bm.brand} {bm.model}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product grid */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>
              {locale === 'th' ? `${filtered.length} รายการ` : `${filtered.length} items`}
            </p>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="input"
              style={{ width: 'auto', fontSize: 13, padding: '6px 12px' }}
            >
              <option value="default">{locale === 'th' ? 'เรียงตามค่าเริ่มต้น' : 'Default'}</option>
              <option value="price-asc">{locale === 'th' ? 'ราคาน้อยไปมาก' : 'Price: Low to High'}</option>
              <option value="price-desc">{locale === 'th' ? 'ราคามากไปน้อย' : 'Price: High to Low'}</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text2)' }}>
              <p style={{ fontSize: 16, marginBottom: 8 }}>{locale === 'th' ? 'ไม่พบสินค้า' : 'No products found'}</p>
              <button className="btn-ghost" onClick={() => { setQuery(''); setSelectedBike('all'); setSelectedCat('all') }}>
                {locale === 'th' ? 'ล้างตัวกรอง' : 'Clear filters'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
