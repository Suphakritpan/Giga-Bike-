'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Heart } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { getProductById } from '@/data/products'
import { ProductCard } from '@/components/product/ProductCard'
import type { Product } from '@/data/products'

function ShareContent() {
  const { locale } = useLang()
  const params = useSearchParams()
  const ids = (params.get('ids') || '').split(',').map(s => s.trim()).filter(Boolean)
  const products = ids.map(id => getProductById(id)).filter(Boolean) as Product[]

  return (
    <div>
      <section style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '32px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Heart size={22} fill="#ef4444" color="#ef4444" />
            <h1 style={{ fontSize: 30 }}>{locale === 'th' ? 'รายการโปรดที่แชร์' : 'Shared Wishlist'}</h1>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 15, marginTop: 4 }}>
            {products.length} {locale === 'th' ? 'รายการ' : 'items'}
          </p>
        </div>
      </section>

      <div className="container section">
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text3)' }}>
            {locale === 'th' ? 'ไม่พบสินค้า' : 'No products found'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(182px, 1fr))', gap: 10 }}>
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SharedWishlistPage() {
  return <Suspense fallback={null}><ShareContent /></Suspense>
}
