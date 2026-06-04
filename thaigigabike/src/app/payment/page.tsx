'use client'
import { Truck, AlertCircle, RefreshCw, Banknote } from 'lucide-react'
import { useLang } from '@/lib/lang'

export default function PaymentPage() {
  const { t, locale } = useLang()

  return (
    <div>
      <section style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '32px 0' }}>
        <div className="container">
          <h1 style={{ fontSize: 38, marginBottom: 4 }}>{t.payment.title}</h1>
          <p style={{ color: 'var(--text2)', fontSize: 17 }}>{t.payment.subtitle}</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 760 }}>

          {/* Free EMS banner */}
          <div style={{
            background: 'rgba(34,197,94,.09)', border: '1px solid rgba(34,197,94,.3)',
            borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center',
            gap: 12, marginBottom: 28, fontSize: 16, color: 'var(--text)',
          }}>
            <Truck size={20} color="var(--green)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--green)' }}>{t.payment.freeEMS}</div>
              <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 2 }}>{t.payment.dispatch}</div>
            </div>
          </div>

          {/* Bank Transfer */}
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Banknote size={18} color="var(--green)" />
              <h2 style={{ fontSize: 20 }}>{t.payment.transferTitle}</h2>
            </div>
            <p style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 14 }}>{t.payment.transferNote}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {t.payment.banks.map((b, i) => (
                <div key={i} style={{
                  background: 'var(--bg3)', borderRadius: 8,
                  padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{b.bank}</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>{b.name}</div>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>{b.account}</div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 14, padding: '10px 14px', background: 'var(--bg3)',
              borderRadius: 8, fontSize: 14, color: 'var(--text2)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <AlertCircle size={14} color="var(--green)" style={{ flexShrink: 0 }} />
              {t.payment.accountNote}
            </div>
          </div>

          {/* COD */}
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>{t.payment.codTitle}</h2>
            <p style={{ color: 'var(--text2)', fontSize: 15 }}>{t.payment.codNote}</p>
          </div>

          {/* International */}
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>{t.payment.intlTitle}</h2>
            <p style={{ color: 'var(--text2)', fontSize: 15 }}>{t.payment.intlNote}</p>
          </div>

          {/* Refund */}
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <RefreshCw size={16} color="var(--green)" />
              <h2 style={{ fontSize: 20 }}>{t.payment.refundTitle}</h2>
            </div>
            <p style={{ color: 'var(--text2)', fontSize: 15 }}>{t.payment.refundNote}</p>
          </div>

          {/* How to notify after transfer */}
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, marginBottom: 10 }}>
              {locale === 'th' ? 'หลังโอนเงิน — แจ้งข้อมูลให้เราด้วย' : 'After Transfer — Notify Us With'}
            </h2>
            {locale === 'th' ? (
              <ul style={{ paddingLeft: 20, color: 'var(--text2)', lineHeight: 2, fontSize: 15 }}>
                <li>ชื่อ-นามสกุลผู้รับสินค้า</li>
                <li>ที่อยู่จัดส่งแบบละเอียด (บ้านเลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์)</li>
                <li>รายการสินค้าที่สั่ง (รหัส สี จำนวน)</li>
                <li>สลิปการโอนเงิน</li>
              </ul>
            ) : (
              <ul style={{ paddingLeft: 20, color: 'var(--text2)', lineHeight: 2, fontSize: 15 }}>
                <li>Recipient full name</li>
                <li>Full shipping address (street, district, province, postal code, country)</li>
                <li>Product list (part code, color, quantity)</li>
                <li>Transfer slip / receipt</li>
              </ul>
            )}
            <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 8 }}>
              {locale === 'th'
                ? 'ส่งผ่าน SMS: 081-424-9407 · LINE: thaigigabike · Email: aonggb@yahoo.com'
                : 'Send via SMS: 081-424-9407 · LINE: thaigigabike · Email: aonggb@yahoo.com'}
            </p>
          </div>

          {/* Contact CTA */}
          <div style={{ display: 'flex', gap: 10 }}>
            <a href="https://line.me/ti/p/~thaigigabike" target="_blank" rel="noopener"
              className="btn-primary" style={{ textDecoration: 'none', justifyContent: 'center', flex: 1 }}>
              LINE: thaigigabike
            </a>
            <a href="tel:0814249407" className="btn-outline"
              style={{ textDecoration: 'none', justifyContent: 'center', flex: 1 }}>
              081-424-9407
            </a>
          </div>

        </div>
      </section>
    </div>
  )
}
