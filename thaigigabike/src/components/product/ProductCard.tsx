'use client'
import Link from 'next/link'
import { Plus, ImageOff } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useLang } from '@/lib/lang'
import type { Product } from '@/data/products'

type Props = { product: Product }

export function ProductCard({ product }: Props) {
  const { add } = useCart()
  const { t, locale } = useLang()
  const name = locale === 'th' ? product.nameTh : product.name

  return (
    <div style={{
      background: 'var(--bg2)', border: '0.5px solid var(--border)',
      borderRadius: 12, overflow: 'hidden',
      transition: 'border-color .2s, transform .2s',
      display: 'flex', flexDirection: 'column',
    }}
    onMouseEnter={e => {
      const el = e.currentTarget as HTMLElement
      el.style.borderColor = 'var(--border2)'
      el.style.transform = 'translateY(-2px)'
    }}
    onMouseLeave={e => {
      const el = e.currentTarget as HTMLElement
      el.style.borderColor = 'var(--border)'
      el.style.transform = 'translateY(0)'
    }}>

      {/* Image */}
      <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
        <div style={{
          height: 140, background: 'var(--bg3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '0.5px solid var(--border)',
          position: 'relative', overflow: 'hidden',
        }}>
          <ImageOff size={28} color="var(--text3)" />
          {!product.inStock && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="badge badge-red" style={{ fontSize: 12 }}>{t.product.outOfStock}</span>
            </div>
          )}
        </div>
      </Link>

      {/* Body */}
      <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2, fontFamily: 'var(--font-display)', letterSpacing: '.04em' }}>
          {product.code}
        </div>
        <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4, marginBottom: 6 }}>
            {name}
          </div>
        </Link>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10, lineHeight: 1.4 }}>
          {product.bikeModels.slice(0, 2).join(' · ')}
          {product.bikeModels.length > 2 && ` +${product.bikeModels.length - 2}`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
            ฿{product.price.toLocaleString()}
          </span>
          <button
            onClick={() => product.inStock && add(product, product.colors[0])}
            disabled={!product.inStock}
            style={{
              width: 28, height: 28, borderRadius: 6,
              background: product.inStock ? 'var(--green)' : 'var(--bg4)',
              color: product.inStock ? '#000' : 'var(--text3)',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: product.inStock ? 'pointer' : 'not-allowed',
              transition: 'all .15s',
            }}
          >
            <Plus size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
