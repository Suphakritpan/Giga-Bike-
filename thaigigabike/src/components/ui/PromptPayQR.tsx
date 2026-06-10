'use client'
import { useEffect, useRef } from 'react'
import { buildPromptPayPayload } from '@/lib/promptpay'

// PromptPay phone for GIGA BIKE FACTORY
const SHOP_PHONE = '0814249407'

interface Props {
  amount?: number
  size?: number
}

export function PromptPayQR({ amount, size = 180 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const payload = buildPromptPayPayload(SHOP_PHONE, amount)

    import('qrcode').then(QRCode => {
      QRCode.toCanvas(canvasRef.current!, payload, {
        width: size,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      })
    })
  }, [amount, size])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <canvas ref={canvasRef} style={{ borderRadius: 10, border: '1px solid var(--border2)' }} />
      <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
        PromptPay · {SHOP_PHONE}
        {amount !== undefined && (
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)', marginTop: 2 }}>
            ฿{amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
        )}
      </div>
    </div>
  )
}
