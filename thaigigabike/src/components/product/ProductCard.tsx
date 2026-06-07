'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus, ImageOff, Heart } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useLang } from '@/lib/lang'
import { useWishlist } from '@/lib/wishlist'
import type { Product } from '@/data/products'

type Props = { product: Product }

export function ProductCard({ product }: Props) {
  const { add } = useCart()
  const { t, locale } = useLang()
  const { isSaved, toggle } = useWishlist()
  const router = useRouter()
  const [imgError, setImgError] = useState(false)
  const saved = isSaved(product.id)
  const name = locale === 'th' ? product.nameTh : product.name
  const thumb = product.images?.[0]

  const handleAdd = () => {
    if (!product.inStock) return
    if (product.colors.length === 1) {
      add(product, product.colors[0])
    } else {
      router.push(`/products/${product.id}`)
    }
  }

  return (
    <div className="product-card" style={{
      background: 'var(--bg2)', border: '0.5px solid var(--border)',
      borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {/* Image */}
      <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
        <div style={{
          height: 160, background: 'var(--bg3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '0.5px solid var(--border)',
          position: 'relative', overflow: 'hidden',
        }}>
          {thumb && !imgError ? (
            <img
              src={thumb}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s' }}
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <ImageOff size={28} color="var(--text3)" />
          )}
          {product.featured && (
            <div style={{ position: 'absolute', top: 8, left: 8, background: 'var(--green)', color: '#000', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
              แนะนำ
            </div>
          )}
          {/* Wishlist heart */}
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(product.id) }}
            aria-label={saved ? (locale === 'th' ? 'นำออกจากรายการโปรด' : 'Remove from wishlist') : (locale === 'th' ? 'เพิ่มในรายการโปรด' : 'Add to wishlist')}
            style={{
              position: 'absolute', top: 8, right: 8, zIndex: 2,
              width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform .15s',
            }}
          >
            <Heart size={16} fill={saved ? '#ef4444' : 'none'} color={saved ? '#ef4444' : '#666'} />
          </button>
          {!product.inStock && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="badge badge-red" style={{ fontSize: 14 }}>{t.product.outOfStock}</span>
            </div>
          )}
        </div>
      </Link>

      {/* Body */}
      <div style={{ padding: '10px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2, fontFamily: 'var(--font-display)', letterSpacing: '.04em' }}>
          {product.code}
        </div>
        <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4, marginBottom: 5 }}>
            {name}
          </div>
        </Link>
        {product.bikeModels.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, lineHeight: 1.4 }}>
            {product.bikeModels.slice(0, 2).join(' · ')}
            {product.bikeModels.length > 2 && ` +${product.bikeModels.length - 2}`}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
            ฿{product.price.toLocaleString()}
          </span>
          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            title={product.colors.length > 1 ? (locale === 'th' ? 'เลือกสี' : 'Choose color') : t.product.addToCart}
            style={{
              width: 30, height: 30, borderRadius: 7,
              background: product.inStock ? 'var(--green)' : 'var(--bg4)',
              color: product.inStock ? '#000' : 'var(--text3)',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: product.inStock ? 'pointer' : 'not-allowed',
              transition: 'all .15s', flexShrink: 0,
            }}
          >
            <Plus size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
