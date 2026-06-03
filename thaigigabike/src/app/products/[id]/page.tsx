'use client'
import { useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import { ShoppingCart, ChevronRight, ImageOff, Check, Minus, Plus } from 'lucide-react'
import Link from 'next/link'
import { useLang } from '@/lib/lang'
import { useCart } from '@/lib/cart'
import { getProductById, products, bikeModels } from '@/data/products'
import { ProductCard } from '@/components/product/ProductCard'

export default function ProductDetailPage() {
  const params = useParams()
  const product = getProductById(params.id as string)
  if (!product) return notFound()

  const { t, locale } = useLang()
  const { add } = useCart()
  const [selectedColor, setSelectedColor] = useState(product.colors[0])
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const name = locale === 'th' ? product.nameTh : product.name
  const desc = locale === 'th' ? product.descriptionTh : product.description

  const compatibleBikes = bikeModels.filter(bm => product.bikeModels.includes(bm.id))
  const related = products.filter(p => p.id !== product.id && (
    p.category === product.category || p.bikeModels.some(b => product.bikeModels.includes(b))
  )).slice(0, 4)

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) add(product, selectedColor)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const colorMap: Record<string, string> = {
    black: '#111', silver: '#aaa', gold: '#c8a020', hard: '#666',
    polished: '#c0c0c0', 'black-silver': '#555', raw: '#888', gray: '#777',
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '10px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text3)' }}>
          <Link href="/" style={{ color: 'var(--text3)', textDecoration: 'none' }}>{t.nav.home}</Link>
          <ChevronRight size={12} />
          <Link href="/products" style={{ color: 'var(--text3)', textDecoration: 'none' }}>{t.nav.products}</Link>
          <ChevronRight size={12} />
          <span style={{ color: 'var(--text2)' }}>{product.code}</span>
        </div>
      </div>

      {/* Main detail */}
      <section className="section">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>

          {/* Left — image */}
          <div>
            <div style={{
              height: 320, background: 'var(--bg2)', border: '0.5px solid var(--border)',
              borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 10,
            }}>
              <ImageOff size={48} color="var(--text3)" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 60, height: 50, background: 'var(--bg2)',
                  border: `0.5px solid ${i === 0 ? 'var(--green)' : 'var(--border)'}`,
                  borderRadius: 8,
                }} />
              ))}
            </div>
          </div>

          {/* Right — info */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, fontFamily: 'var(--font-display)', letterSpacing: '.04em' }}>
              {t.product.code}: {product.code}
            </div>
            <h1 style={{ fontSize: 24, lineHeight: 1.3, marginBottom: 12 }}>{name}</h1>
            <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)', marginBottom: 14 }}>
              ฿{product.price.toLocaleString()}
            </div>

            {/* Status badges */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              <span className={`badge ${product.inStock ? 'badge-green' : 'badge-red'}`}>
                {product.inStock ? <><Check size={11} /> {t.product.inStock}</> : t.product.outOfStock}
              </span>
              <span className="badge badge-orange">CNC Billet</span>
              <span className="badge badge-gray">{product.material.split(' ')[0]}</span>
            </div>

            {/* Fits on */}
            <div style={{ background: 'var(--bg3)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
              <span style={{ color: 'var(--green)', fontWeight: 500 }}>{t.product.fitsOn}: </span>
              {compatibleBikes.map(b => `${b.brand} ${b.model}`).join(' · ')}
            </div>

            {/* Color picker */}
            {product.colors.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
                  {t.product.chooseColor}: <span style={{ color: 'var(--text)' }}>
                    {locale === 'th' ? (t.colors as Record<string, string>)[selectedColor] || selectedColor : selectedColor}
                  </span>
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {product.colors.map(c => (
                    <button key={c} onClick={() => setSelectedColor(c)} title={c} style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: colorMap[c] || '#888',
                      border: selectedColor === c ? '2px solid var(--green)' : '0.5px solid var(--border2)',
                      outline: selectedColor === c ? '2px solid transparent' : 'none',
                      outlineOffset: selectedColor === c ? '2px' : '0',
                      boxShadow: selectedColor === c ? '0 0 0 2px var(--bg), 0 0 0 4px var(--green)' : 'none',
                      cursor: 'pointer', transition: 'all .15s',
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>{t.product.quantity}:</span>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 30, height: 30, background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 6, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Minus size={14} />
              </button>
              <span style={{ fontSize: 16, fontWeight: 500, width: 32, textAlign: 'center' }}>{qty}</span>
              <button onClick={() => setQty(qty + 1)} style={{ width: 30, height: 30, background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 6, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Plus size={14} />
              </button>
              {product.inStock && (
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {locale === 'th' ? `มี ${product.stockCount} ชิ้น` : `${product.stockCount} in stock`}
                </span>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', opacity: product.inStock ? 1 : 0.5 }}
              >
                {added ? <><Check size={15} /> {locale === 'th' ? 'เพิ่มแล้ว!' : 'Added!'}</> : <><ShoppingCart size={15} /> {t.product.addToCart}</>}
              </button>
              <a href="https://line.me/ti/p/~thaigigabike" target="_blank" rel="noopener" style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: '#06C755', color: '#fff', borderRadius: 8, padding: '10px 0',
                fontSize: 14, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-display)',
              }}>
                {t.product.askLine}
              </a>
            </div>

            {/* Material */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '0.5px solid var(--border)', fontSize: 12, color: 'var(--text3)' }}>
              <span style={{ color: 'var(--text2)' }}>{t.product.material}:</span> {product.material}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="container" style={{ marginTop: 40 }}>
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>{t.product.description}</h3>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8 }}>{desc}</p>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="container" style={{ marginTop: 48 }}>
            <h3 style={{ fontSize: 20, marginBottom: 16 }}>{t.product.related}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
