'use client'
import { useEffect } from 'react'
import { RotateCcw, Home } from 'lucide-react'

// Global error boundary. Must be a client component.
// Intentionally avoids context hooks (useLang/useTheme) — the error may
// originate inside a provider, so we keep this self-contained and bilingual.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log client-side only; never render internal details to the user.
    console.error('[error-boundary]', error?.digest ?? error?.message)
  }, [error])

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px' }}>
      <div style={{ textAlign: 'center', maxWidth: 460 }}>
        <div style={{ fontSize: 64, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--red, #ef4444)', lineHeight: 1 }}>!</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 12 }}>เกิดข้อผิดพลาด · Something went wrong</h1>
        <p style={{ fontSize: 15, color: 'var(--text2)', marginTop: 8, lineHeight: 1.6 }}>
          ขออภัย มีบางอย่างผิดพลาด กรุณาลองใหม่อีกครั้ง<br />
          Sorry, an unexpected error occurred. Please try again.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 24 }}>
          <button onClick={() => reset()} className="btn-primary" style={{ fontSize: 15 }}>
            <RotateCcw size={16} /> ลองใหม่ · Try again
          </button>
          <a href="/" className="btn-ghost" style={{ fontSize: 15 }}>
            <Home size={16} /> หน้าแรก · Home
          </a>
        </div>
      </div>
    </div>
  )
}
