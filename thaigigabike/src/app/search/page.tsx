'use client'
import { Suspense, useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { products, bikeModels, categories } from '@/data/products'
import { ProductCard } from '@/components/product/ProductCard'

const PAGE_SIZE = 24

const SORT_OPTIONS = [
  { id: 'default',    th: 'ค่าเริ่มต้น', en: 'Default' },
  { id: 'price-asc',  th: 'ราคา ↑',     en: 'Price ↑' },
  { id: 'price-desc', th: 'ราคา ↓',     en: 'Price ↓' },
] as const
type SortId = (typeof SORT_OPTIONS)[number]['id']

function Pagination({ page, totalPages, onPage, locale }: {
  page: number; totalPages: number; onPage: (p: number) => void; locale: string
}) {
  if (totalPages <= 1) return null
  const pages: (number | '…')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) pages.push(i)
    else if (pages[pages.length - 1] !== '…') pages.push('…')
  }
  const btn: React.CSSProperties = {
    minWidth: 36, height: 36, borderRadius: 8, fontSize: 14, fontWeight: 500,
    border: '0.5px solid var(--border2)', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  }
  return (
    <nav aria-label={locale === 'th' ? 'หน้า' : 'Pages'}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '32px 0 8px', flexWrap: 'wrap' }}>
      <button onClick={() => onPage(page - 1)} disabled={page === 1} aria-label="Previous"
        style={{ ...btn, background: 'var(--bg3)', color: 'var(--text2)', opacity: page === 1 ? 0.35 : 1, padding: '0 10px' }}>
        <ChevronLeft size={16} />
      </button>
      {pages.map((p, i) =>
        p === '…'
          ? <span key={`e${i}`} style={{ width: 28, textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>…</span>
          : <button key={p} onClick={() => onPage(p as number)}
              aria-current={p === page ? 'page' : undefined}
              style={{ ...btn, background: p === page ? 'var(--green)' : 'var(--bg3)', color: p === page ? '#fff' : 'var(--text2)', borderColor: p === page ? 'var(--green)' : 'var(--border2)', fontWeight: p === page ? 700 : 500 }}>
              {p}
            </button>
      )}
      <button onClick={() => onPage(page + 1)} disabled={page === totalPages} aria-label="Next"
        style={{ ...btn, background: 'var(--bg3)', color: 'var(--text2)', opacity: page === totalPages ? 0.35 : 1, padding: '0 10px' }}>
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}

// Popular categories shown when search is empty
const POPULAR_CATS = [
  { id: 'brake',      th: 'เบรค',        en: 'Brakes',      emoji: '🔴' },
  { id: 'engine',     th: 'เครื่องยนต์',  en: 'Engine',      emoji: '⚙️' },
  { id: 'suspension', th: 'โช๊ค/แผงคอ',  en: 'Suspension',  emoji: '🔧' },
  { id: 'chassis',    th: 'ตัวถัง',       en: 'Chassis',     emoji: '🏍️' },
  { id: 'drivetrain', th: 'สเตอร์/โซ่',  en: 'Drivetrain',  emoji: '⛓️' },
  { id: 'hardware',   th: 'น็อต/สกรู',   en: 'Hardware',    emoji: '🔩' },
  { id: 'accessories',th: 'อุปกรณ์เสริม', en: 'Accessories', emoji: '✨' },
  { id: 'exhaust',    th: 'ท่อไอเสีย',   en: 'Exhaust',     emoji: '💨' },
]

function SearchContent() {
  const searchParams = useSearchParams()
  const { t, locale } = useLang()

  const [query, setQuery]             = useState(searchParams.get('q') || '')
  const [selectedBike, setSelectedBike] = useState('all')
  const [selectedCat, setSelectedCat]   = useState('all')
  const [sortBy, setSortBy]             = useState<SortId>('default')
  const [page, setPage]                 = useState(1)

  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus + sync URL param on mount
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setQuery(q)
    inputRef.current?.focus()
  }, [searchParams])

  const filtered = useMemo(() => {
    if (!query && selectedBike === 'all' && selectedCat === 'all') return []
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

  const hasActiveFilters = query !== '' || selectedBike !== 'all' || selectedCat !== 'all'

  useEffect(() => { setPage(1) }, [query, selectedBike, selectedCat, sortBy])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handlePage = (p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const bikeOptions = [
    { id: 'all', label: locale === 'th' ? t.search.allModels : t.search.allModels },
    ...bikeModels.map(b => ({ id: b.id, label: `${b.brand} ${b.model}` })),
  ]

  const showEmpty = !hasActiveFilters

  return (
    <div>
      {/* Hero search bar */}
      <section style={{
        background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)',
        padding: '36px 0 24px',
      }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 16, fontFamily: 'var(--font-display)' }}>
            {t.search.title}
          </h1>

          {/* Main search input */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Search size={18} style={{
              position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text3)', pointerEvents: 'none',
            }} />
            <input
              ref={inputRef}
              className="input"
              style={{ paddingLeft: 48, paddingRight: query ? 44 : 16, fontSize: 18, height: 52 }}
              placeholder={t.search.placeholder}
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label={t.search.title}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); inputRef.current?.focus() }}
                aria-label="Clear"
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)',
                  display: 'flex', padding: 4,
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Bike model pills — horizontal scroll */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {bikeOptions.slice(0, 16).map(b => {
              const active = selectedBike === b.id
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBike(b.id)}
                  style={{
                    padding: '5px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                    border: '0.5px solid', cursor: 'pointer', transition: 'all .15s',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    background:  active ? 'var(--green)' : 'var(--bg3)',
                    color:       active ? '#fff'         : 'var(--text2)',
                    borderColor: active ? 'var(--green)' : 'var(--border2)',
                  }}
                >
                  {b.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <div className="container section" style={{ maxWidth: 1200 }}>

        {/* ── Empty state: show popular categories ── */}
        {showEmpty && (
          <div>
            <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 20 }}>
              {t.search.popularCats}
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 12, marginBottom: 40,
            }}>
              {POPULAR_CATS.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  style={{
                    background: 'var(--bg2)', border: '0.5px solid var(--border)',
                    borderRadius: 12, padding: '18px 16px',
                    textAlign: 'left', cursor: 'pointer', transition: 'border-color .15s, background .15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--green)'
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(34,197,94,.05)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                    ;(e.currentTarget as HTMLElement).style.background = 'var(--bg2)'
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{cat.emoji}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                    {locale === 'th' ? cat.th : cat.en}
                  </div>
                </button>
              ))}
            </div>

            <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 8 }}>
              {locale === 'th' ? 'หรือกรองตามรุ่นรถ' : 'Or filter by bike model'}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {bikeModels.map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBike(b.id)}
                  style={{
                    padding: '5px 14px', borderRadius: 999, fontSize: 13,
                    border: '0.5px solid var(--border2)', cursor: 'pointer',
                    background: 'var(--bg3)', color: 'var(--text2)', transition: 'all .15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--green)'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--green)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--text2)'
                  }}
                >
                  {b.brand} {b.model}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Active search results ── */}
        {hasActiveFilters && (
          <div>
            {/* Filter bar */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              {/* Category pills */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                <button
                  onClick={() => setSelectedCat('all')}
                  style={{
                    padding: '5px 13px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                    border: '0.5px solid', cursor: 'pointer',
                    background:  selectedCat === 'all' ? 'var(--green)' : 'var(--bg3)',
                    color:       selectedCat === 'all' ? '#fff'         : 'var(--text2)',
                    borderColor: selectedCat === 'all' ? 'var(--green)' : 'var(--border2)',
                  }}
                >
                  {locale === 'th' ? 'ทั้งหมด' : 'All'}
                </button>
                {categories.map(cat => {
                  const active = selectedCat === cat.id
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCat(cat.id)}
                      style={{
                        padding: '5px 13px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                        border: '0.5px solid', cursor: 'pointer',
                        background:  active ? 'var(--green)' : 'var(--bg3)',
                        color:       active ? '#fff'         : 'var(--text2)',
                        borderColor: active ? 'var(--green)' : 'var(--border2)',
                      }}
                    >
                      {locale === 'th' ? cat.nameTh : cat.name}
                    </button>
                  )
                })}
              </div>

              {/* Sort */}
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                {SORT_OPTIONS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSortBy(s.id)}
                    style={{
                      padding: '5px 12px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
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

            {/* Result count */}
            <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 14 }}>
              {filtered.length > 0 ? (
                <>
                  <span style={{ fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', fontSize: 18 }}>
                    {filtered.length}
                  </span>
                  {' '}{t.search.results}
                  {totalPages > 1 && (
                    <span style={{ color: 'var(--text3)', fontSize: 13 }}>
                      {' '}· {locale === 'th' ? `หน้า ${page}/${totalPages}` : `Page ${page}/${totalPages}`}
                    </span>
                  )}
                </>
              ) : null}
            </p>

            {/* No results */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '72px 0', color: 'var(--text2)' }}>
                <Search size={44} color="var(--text3)" style={{ display: 'block', margin: '0 auto 16px' }} />
                <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{t.search.noResults}</p>
                <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 20 }}>{t.search.noResultsSub}</p>
                <button className="btn-ghost" onClick={() => { setQuery(''); setSelectedBike('all'); setSelectedCat('all') }} style={{ fontSize: 16 }}>
                  {t.search.browseAll}
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
        )}

        {/* Active category filter chip when in empty state with category selected */}
        {!query && selectedCat !== 'all' && (
          <div style={{ marginTop: -16, marginBottom: 8 }}>
            <button
              onClick={() => setSelectedCat('all')}
              style={{ fontSize: 13, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← {locale === 'th' ? 'กลับ' : 'Back'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="section">
        <div className="container" style={{ maxWidth: 720 }}>
          <div style={{ height: 52, background: 'var(--bg3)', borderRadius: 10, marginBottom: 16 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ height: 90, background: 'var(--bg3)', borderRadius: 12 }} />
            ))}
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
