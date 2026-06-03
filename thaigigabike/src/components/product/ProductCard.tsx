'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, ImageOff } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useLang } from '@/lib/lang'
import type { Product } from '@/data/products'

type Props = { product: Product }

export function ProductCard({ product }: Props) {
  const { add } = useCart()
  const { t, locale } = useLang()
  const router = useRouter()
  const name = locale === 'th' ? product.nameTh : product.name

  const handleAdd = () => {
    if (!product.inStock) return
    // Single color → add directly; multiple colors → go to detail to choose
    if (product.colors.length === 1) {
      add(product, product.colors[0])
    } else {
      router.push(`/products/${product.id}`)
    }
  }

  return (
    <div
      className="product-card"
      style={{
        background: 'var(--bg2)', border: '0.5px solid var(--border)',
        borderRadius: 12, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}
    >
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
              <span className="badge badge-red" style={{ fontSize: 14 }}>{t.product.outOfStock}</span>
            </div>
          )}
        </div>
      </Link>

      {/* Body */}
      <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 2, fontFamily: 'var(--font-display)', letterSpacing: '.04em' }}>
          {product.code}
        </div>
        <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4, marginBottom: 6 }}>
            {name}
          </div>
        </Link>
        <div style={{ fontSize: 16, color: 'var(--text3)', marginBottom: 10, lineHeight: 1.4 }}>
          {product.bikeModels.slice(0, 2).join(' · ')}
          {product.bikeModels.length > 2 && ` +${product.bikeModels.length - 2}`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
            ฿{product.price.toLocaleString()}
          </span>
          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            title={product.colors.length > 1 ? (locale === 'th' ? 'เลือกสี' : 'Choose color') : t.product.addToCart}
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
