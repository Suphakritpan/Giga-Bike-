'use client'
import { Suspense, useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { products, bikeModels, categories } from '@/data/products'
import { ProductCard } from '@/components/product/ProductCard'

const SORT_OPTIONS = [
  { id: 'default',    th: 'ค่าเริ่มต้น',   en: 'Default' },
  { id: 'price-asc',  th: 'ราคา ↑',        en: 'Price ↑' },
  { id: 'price-desc', th: 'ราคา ↓',        en: 'Price ↓' },
] as const
type SortId = (typeof SORT_OPTIONS)[number]['id']

// Category item counts (pre-computed once)
const CAT_COUNTS: Record<string, number> = {}
products.forEach(p => { CAT_COUNTS[p.category] = (CAT_COUNTS[p.category] || 0) + 1 })

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 999, fontSize: 13,
      background: 'rgba(34,197,94,.1)', color: 'var(--green)',
      border: '0.5px solid rgba(34,197,94,.3)',
    }}>
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green)', display: 'flex', lineHeight: 1, padding: 0 }}
      >
        <X size={12} />
      </button>
    </span>
  )
}

function ProductsContent() {
  const searchParams = useSearchParams()
  const { t, locale } = useLang()

  const [query, setQuery]           = useState(searchParams.get('q') || '')
  const [selectedBike, setSelectedBike] = useState(searchParams.get('bike') || 'all')
  const [selectedCat, setSelectedCat]   = useState(searchParams.get('cat') || 'all')
  const [sortBy, setSortBy]         = useState<SortId>('default')

  useEffect(() => {
    const q    = searchParams.get('q')
    const bike = searchParams.get('bike')
    const cat  = searchParams.get('cat')
    if (q !== null) setQuery(q)
    if (bike)       setSelectedBike(bike)
    if (cat)        setSelectedCat(cat)
  }, [searchParams])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      if (selectedBike !== 'all' && !p.bikeModels.includes(selectedBike)) return false
      if (selectedCat  !== 'all' && p.category !== selectedCat)           return false
      if (query) {
        const q = query.toLowerCase()
        if (!p.code.toLowerCase().includes(q) && !p.name.toLowerCase().includes(q) && !p.nameTh.includes(q)) return false
      }
      return true
    })
    if (sortBy === 'price-asc')  list = [...list].sort((a, b) => a.price - b.price)
    if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    return list
  }, [query, selectedBike, selectedCat, sortBy])

  const hasFilters = query !== '' || selectedBike !== 'all' || selectedCat !== 'all'
  const clearAll = () => { setQuery(''); setSelectedBike('all'); setSelectedCat('all'); setSortBy('default') }

  const ALL_CATS = [
    { id: 'all', th: 'ทั้งหมด', en: 'All', count: products.length },
    ...categories.map(c => ({ id: c.id, th: c.nameTh, en: c.name, count: CAT_COUNTS[c.id] || 0 })),
  ]
  const ALL_BIKES = [
    { id: 'all', brand: '', model: locale === 'th' ? 'ทุกรุ่น' : 'All Models' },
    ...bikeModels,
  ]

  const activeCatLabel = ALL_CATS.find(c => c.id === selectedCat)?.[locale === 'th' ? 'th' : 'en']
  const activeBikeLabel = selectedBike === 'all' ? '' : bikeModels.find(b => b.id === selectedBike)
    ? `${bikeModels.find(b => b.id === selectedBike)!.brand} ${bikeModels.find(b => b.id === selectedBike)!.model}`
    : ''

  return (
    <div>
      {/* Sticky search + category header */}
      <section style={{
        background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)',
        padding: '20px 0', position: 'sticky', top: 60, zIndex: 40,
      }}>
        <div className="container">
          {/* Search row */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{
                position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text3)', pointerEvents: 'none',
              }} />
              <input
                className="input"
                style={{ paddingLeft: 40, paddingRight: query ? 40 : 16, fontSize: 17 }}
                placeholder={t.nav.search}
                value={query}
                onChange={e => setQuery(e.target.value)}
                aria-label={locale === 'th' ? 'ค้นหาสินค้า' : 'Search products'}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)',
                    display: 'flex', padding: 4,
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Sort pills */}
            <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
              {SORT_OPTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id)}
                  style={{
                    padding: '6px 12px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
                    border: '0.5px solid', fontWeight: 500, transition: 'all .15s',
                    background: sortBy === s.id ? 'var(--green)' : 'var(--bg3)',
                    color:      sortBy === s.id ? '#fff'         : 'var(--text2)',
                    borderColor: sortBy === s.id ? 'var(--green)' : 'var(--border2)',
                  }}
                >
                  {locale === 'th' ? s.th : s.en}
                </button>
              ))}
            </div>
          </div>

          {/* Category pill row */}
          <div className="filter-pills">
            {ALL_CATS.map(cat => {
              const active = selectedCat === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  style={{
                    padding: '5px 13px', borderRadius: 999, fontSize: 14, fontWeight: 500,
                    border: '0.5px solid', cursor: 'pointer', transition: 'all .15s',
                    display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                    background:  active ? 'var(--green)' : 'var(--bg3)',
                    color:       active ? '#fff'         : 'var(--text2)',
                    borderColor: active ? 'var(--green)' : 'var(--border2)',
                  }}
                >
                  {locale === 'th' ? cat.th : cat.en}
                  {cat.id !== 'all' && (
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      background: active ? 'rgba(255,255,255,.25)' : 'var(--bg4)',
                      borderRadius: 999, padding: '1px 6px',
                    }}>
                      {cat.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <div className="container section grid-products">
        {/* Sidebar — bike model filter */}
        <aside className="sticky-panel" style={{ top: 160 }}>
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 14 }}>
            <p style={{
              fontSize: 11, color: 'var(--text3)', marginBottom: 10,
              textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 700,
            }}>
              {t.home.filterBy}
            </p>
            <div style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
              {ALL_BIKES.map(bm => {
                const active = selectedBike === bm.id
                return (
                  <button key={bm.id} onClick={() => setSelectedBike(bm.id)} style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '6px 10px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                    border: 'none', marginBottom: 2, transition: 'all .12s',
                    background: active ? 'rgba(34,197,94,.12)' : 'transparent',
                    color:      active ? 'var(--green)'         : 'var(--text2)',
                    fontWeight: active ? 600 : 400,
                  }}>
                    {bm.id === 'all'
                      ? (locale === 'th' ? 'ทุกรุ่น' : 'All Models')
                      : `${bm.brand} ${bm.model}`}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Main grid */}
        <div>
          {/* Results bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontSize: 15, color: 'var(--text2)' }}>
              <span style={{ fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', fontSize: 17 }}>
                {filtered.length}
              </span>
              {' '}{locale === 'th' ? 'รายการ' : 'items'}
            </p>
            {hasFilters && (
              <button
                onClick={clearAll}
                style={{ fontSize: 13, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <X size={13} /> {locale === 'th' ? 'ล้างทั้งหมด' : 'Clear all'}
              </button>
            )}
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {query && <FilterChip label={`"${query}"`} onRemove={() => setQuery('')} />}
              {selectedCat !== 'all' && activeCatLabel && (
                <FilterChip label={String(activeCatLabel)} onRemove={() => setSelectedCat('all')} />
              )}
              {selectedBike !== 'all' && activeBikeLabel && (
                <FilterChip label={activeBikeLabel} onRemove={() => setSelectedBike('all')} />
              )}
            </div>
          )}

          {/* Grid or empty state */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '72px 0', color: 'var(--text2)' }}>
              <Search size={44} color="var(--text3)" style={{ display: 'block', margin: '0 auto 16px' }} />
              <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>
                {locale === 'th' ? 'ไม่พบสินค้า' : 'No products found'}
              </p>
              <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 20 }}>
                {locale === 'th'
                  ? 'ลองคำค้นหาอื่น หรือเลือกหมวดหมู่ใหม่'
                  : 'Try a different search term or category'}
              </p>
              <button className="btn-ghost" onClick={clearAll} style={{ fontSize: 16 }}>
                {locale === 'th' ? 'แสดงสินค้าทั้งหมด' : 'Show all products'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(182px, 1fr))', gap: 10 }}>
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="section">
        <div className="container" style={{ color: 'var(--text3)' }}>
          {/* skeleton header */}
          <div style={{ height: 48, background: 'var(--bg3)', borderRadius: 8, marginBottom: 16, maxWidth: 600 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(182px, 1fr))', gap: 10 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ height: 240, background: 'var(--bg3)', borderRadius: 12, opacity: 1 - i * 0.06 }} />
            ))}
          </div>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}
