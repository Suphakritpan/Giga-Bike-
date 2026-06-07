'use client'
import { Suspense, useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { products, bikeModels, categories } from '@/data/products'
import { ProductCard } from '@/components/product/ProductCard'
import { recordBike, recordCat } from '@/lib/recentlyViewed'

const PAGE_SIZE = 24

const SORT_OPTIONS = [
  { id: 'default',    th: 'ค่าเริ่มต้น',   en: 'Default' },
  { id: 'price-asc',  th: 'ราคา ↑',        en: 'Price ↑' },
  { id: 'price-desc', th: 'ราคา ↓',        en: 'Price ↓' },
] as const
type SortId = (typeof SORT_OPTIONS)[number]['id']

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

function Pagination({
  page, totalPages, onPage, locale,
}: {
  page: number; totalPages: number; onPage: (p: number) => void; locale: string
}) {
  if (totalPages <= 1) return null

  // Build page window: always show first, last, current ±2
  const pages: (number | '…')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  const btnBase: React.CSSProperties = {
    minWidth: 36, height: 36, borderRadius: 8, fontSize: 14, fontWeight: 500,
    border: '0.5px solid var(--border2)', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all .15s',
  }

  return (
    <nav aria-label={locale === 'th' ? 'หน้าสินค้า' : 'Product pages'}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '32px 0 8px', flexWrap: 'wrap' }}>

      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        style={{ ...btnBase, background: 'var(--bg3)', color: 'var(--text2)', opacity: page === 1 ? 0.35 : 1, padding: '0 10px' }}
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} style={{ width: 28, textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p as number)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            style={{
              ...btnBase,
              background: p === page ? 'var(--green)' : 'var(--bg3)',
              color:      p === page ? '#fff'         : 'var(--text2)',
              borderColor: p === page ? 'var(--green)' : 'var(--border2)',
              fontWeight: p === page ? 700 : 500,
            }}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
        style={{ ...btnBase, background: 'var(--bg3)', color: 'var(--text2)', opacity: page === totalPages ? 0.35 : 1, padding: '0 10px' }}
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}

function ProductsContent() {
  const searchParams = useSearchParams()
  const { t, locale } = useLang()

  const [query, setQuery]               = useState(searchParams.get('q') || '')
  const [selectedBikes, setSelectedBikes] = useState<Set<string>>(() => {
    const b = searchParams.get('bike')
    return b && b !== 'all' ? new Set([b]) : new Set()
  })
  const [selectedCats, setSelectedCats] = useState<Set<string>>(() => {
    const c = searchParams.get('cat')
    return c && c !== 'all' ? new Set([c]) : new Set()
  })
  const [sortBy, setSortBy]             = useState<SortId>('default')
  const [page, setPage]                 = useState(1)

  // Sync initial URL params (only on first mount — bike/cat params set initial state above)
  useEffect(() => {
    const q = searchParams.get('q')
    if (q !== null) setQuery(q)
  }, [searchParams])

  const toggleBike = (id: string) => {
    setSelectedBikes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else { next.add(id); recordBike(id) }
      return next
    })
  }

  const toggleCat = (id: string) => {
    setSelectedCats(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else { next.add(id); recordCat(id) }
      return next
    })
  }

  // Stable keys for useMemo/useEffect dependency
  const bikesKey = [...selectedBikes].sort().join(',')
  const catsKey  = [...selectedCats].sort().join(',')

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      if (selectedBikes.size > 0 && !p.bikeModels.some(b => selectedBikes.has(b))) return false
      if (selectedCats.size  > 0 && !selectedCats.has(p.category))                 return false
      if (query) {
        const q = query.toLowerCase()
        if (!p.code.toLowerCase().includes(q) && !p.name.toLowerCase().includes(q) && !p.nameTh.includes(q)) return false
      }
      return true
    })
    if (sortBy === 'price-asc')  list = [...list].sort((a, b) => a.price - b.price)
    if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    return list
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, bikesKey, catsKey, sortBy])

  // Reset to page 1 whenever filters/sort change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1) }, [query, bikesKey, catsKey, sortBy])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const hasFilters = query !== '' || selectedBikes.size > 0 || selectedCats.size > 0
  const clearAll = () => { setQuery(''); setSelectedBikes(new Set()); setSelectedCats(new Set()); setSortBy('default') }

  const handlePage = (p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const ALL_CATS = [
    { id: 'all', th: 'ทั้งหมด', en: 'All', count: products.length },
    ...categories.map(c => ({ id: c.id, th: c.nameTh, en: c.name, count: CAT_COUNTS[c.id] || 0 })),
  ]

  const pageStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const pageEnd   = Math.min(page * PAGE_SIZE, filtered.length)

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

          {/* Category pill row — multi-select */}
          <div className="filter-pills">
            {ALL_CATS.map(cat => {
              const isAll    = cat.id === 'all'
              const active   = isAll ? selectedCats.size === 0 : selectedCats.has(cat.id)
              const onClick  = isAll
                ? () => setSelectedCats(new Set())
                : () => toggleCat(cat.id)
              return (
                <button
                  key={cat.id}
                  onClick={onClick}
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
                  {!isAll && (
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
        {/* Sidebar — bike model multi-select */}
        <aside className="sticky-panel" style={{ top: 160 }}>
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 700 }}>
                {t.home.filterBy}
              </p>
              {selectedBikes.size > 0 && (
                <button onClick={() => setSelectedBikes(new Set())}
                  style={{ fontSize: 11, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  ล้าง ({selectedBikes.size})
                </button>
              )}
            </div>
            <div style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
              {/* "All" item */}
              <button
                onClick={() => setSelectedBikes(new Set())}
                style={{
                  display: 'flex', width: '100%', textAlign: 'left', alignItems: 'center', gap: 7,
                  padding: '6px 10px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                  border: 'none', marginBottom: 2, transition: 'all .12s',
                  background: selectedBikes.size === 0 ? 'rgba(34,197,94,.12)' : 'transparent',
                  color:      selectedBikes.size === 0 ? 'var(--green)'         : 'var(--text2)',
                  fontWeight: selectedBikes.size === 0 ? 600 : 400,
                }}
              >
                {locale === 'th' ? 'ทุกรุ่น' : 'All Models'}
              </button>
              {bikeModels.map(bm => {
                const active = selectedBikes.has(bm.id)
                return (
                  <button key={bm.id} onClick={() => toggleBike(bm.id)} style={{
                    display: 'flex', width: '100%', textAlign: 'left', alignItems: 'center', gap: 7,
                    padding: '6px 10px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                    border: 'none', marginBottom: 2, transition: 'all .12s',
                    background: active ? 'rgba(34,197,94,.12)' : 'transparent',
                    color:      active ? 'var(--green)'         : 'var(--text2)',
                    fontWeight: active ? 600 : 400,
                  }}>
                    <span style={{
                      width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                      border: `1.5px solid ${active ? 'var(--green)' : 'var(--border2)'}`,
                      background: active ? 'var(--green)' : 'transparent',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {active && <span style={{ width: 8, height: 8, borderRadius: 1, background: '#fff', display: 'block' }} />}
                    </span>
                    {bm.brand} {bm.model}
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
              {filtered.length > 0 ? (
                <>
                  <span style={{ fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', fontSize: 17 }}>
                    {pageStart}–{pageEnd}
                  </span>
                  {' '}{locale === 'th' ? 'จาก' : 'of'}{' '}
                  <span style={{ fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', fontSize: 17 }}>
                    {filtered.length}
                  </span>
                  {' '}{locale === 'th' ? 'รายการ' : 'items'}
                  {totalPages > 1 && (
                    <span style={{ color: 'var(--text3)', fontSize: 13 }}>
                      {' '}· {locale === 'th' ? `หน้า ${page}/${totalPages}` : `Page ${page}/${totalPages}`}
                    </span>
                  )}
                </>
              ) : (
                <span style={{ fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', fontSize: 17 }}>0</span>
              )}
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
              {[...selectedCats].map(id => {
                const cat = ALL_CATS.find(c => c.id === id)
                if (!cat) return null
                return <FilterChip key={id} label={locale === 'th' ? cat.th : cat.en} onRemove={() => toggleCat(id)} />
              })}
              {[...selectedBikes].map(id => {
                const bm = bikeModels.find(b => b.id === id)
                if (!bm) return null
                return <FilterChip key={id} label={`${bm.brand} ${bm.model}`} onRemove={() => toggleBike(id)} />
              })}
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
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(182px, 1fr))', gap: 10 }}>
                {paginated.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              <Pagination page={page} totalPages={totalPages} onPage={handlePage} locale={locale} />
            </>
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
          <div style={{ height: 48, background: 'var(--bg3)', borderRadius: 8, marginBottom: 16, maxWidth: 600 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(182px, 1fr))', gap: 10 }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} style={{ height: 240, background: 'var(--bg3)', borderRadius: 12, opacity: 1 - i * 0.04 }} />
            ))}
          </div>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}
