'use client'
import Link from 'next/link'
import { Trash2, Plus, Minus, ShoppingCart, ChevronRight } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useLang } from '@/lib/lang'

export default function CartPage() {
  const { items, remove, updateQty, totalPrice } = useCart()
  const { t, locale } = useLang()

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '96px 0' }}>
        <ShoppingCart size={48} color="var(--text3)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>{t.cart.empty}</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 24 }}>{t.cart.emptyDesc}</p>
        <Link href="/products" className="btn-primary">{t.cart.continueShopping}</Link>
      </div>
    )
  }

  const shippingNote = locale === 'th' ? 'คำนวณตอน checkout' : 'Calculated at checkout'

  return (
    <div className="section">
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

        {/* Items */}
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 20 }}>{t.cart.title}</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {items.map(item => {
              const name = locale === 'th' ? item.product.nameTh : item.product.name
              return (
                <div key={`${item.product.id}-${item.color}`} style={{ display: 'flex', gap: 16, padding: 16, background: 'var(--bg2)', alignItems: 'center' }}>
                  {/* Image placeholder */}
                  <div style={{ width: 60, height: 52, background: 'var(--bg3)', border: '0.5px solid var(--border)', borderRadius: 8, flexShrink: 0 }} />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>{item.product.code}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4, marginBottom: 4 }}>{name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                      {locale === 'th' ? 'สี' : 'Color'}: {item.color}
                    </div>
                  </div>

                  {/* Qty */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => updateQty(item.product.id, item.color, item.quantity - 1)} style={{ width: 26, height: 26, background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 6, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: 14, fontWeight: 500, width: 24, textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, item.color, item.quantity + 1)} style={{ width: 26, height: 26, background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 6, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Price */}
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--green)', fontFamily: 'var(--font-display)', width: 80, textAlign: 'right', flexShrink: 0 }}>
                    ฿{(item.product.price * item.quantity).toLocaleString()}
                  </div>

                  {/* Remove */}
                  <button onClick={() => remove(item.product.id, item.color)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', padding: 4, transition: 'color .15s', flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)') }
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 12 }}>
            <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text2)', textDecoration: 'none' }}>
              ← {t.cart.continueShopping}
            </Link>
          </div>
        </div>

        {/* Summary */}
        <div style={{ position: 'sticky', top: 72 }}>
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>
              {locale === 'th' ? 'สรุปคำสั่งซื้อ' : 'Order Summary'}
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
              <span>{t.cart.subtotal}</span>
              <span>฿{totalPrice.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
              <span>{t.cart.shipping}</span>
              <span style={{ color: 'var(--text3)', fontSize: 12 }}>{shippingNote}</span>
            </div>
            <hr className="divider" style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              <span>{t.cart.total}</span>
              <span style={{ color: 'var(--green)' }}>฿{totalPrice.toLocaleString()}</span>
            </div>
            <Link href="/checkout" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
              {t.cart.checkout} <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
