'use client'
import Link from 'next/link'
import { Home, Search, MessageCircle } from 'lucide-react'
import { useLang } from '@/lib/lang'

export default function NotFound() {
  const { locale } = useLang()
  const th = locale === 'th'

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px' }}>
      <div style={{ textAlign: 'center', maxWidth: 460 }}>
        <div style={{ fontSize: 88, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--green)', lineHeight: 1 }}>404</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 12 }}>
          {th ? 'ไม่พบหน้านี้' : 'Page not found'}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text2)', marginTop: 8, lineHeight: 1.6 }}>
          {th
            ? 'หน้าที่คุณกำลังหาอาจถูกย้าย ลบ หรือไม่มีอยู่จริง'
            : 'The page you are looking for may have been moved, removed, or never existed.'}
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 24 }}>
          <Link href="/" className="btn-primary" style={{ fontSize: 15 }}>
            <Home size={16} /> {th ? 'กลับหน้าแรก' : 'Home'}
          </Link>
          <Link href="/products" className="btn-ghost" style={{ fontSize: 15 }}>
            <Search size={16} /> {th ? 'ค้นหาสินค้า' : 'Browse products'}
          </Link>
          <a href="https://line.me/ti/p/~thaigigabike" target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: 15 }}>
            <MessageCircle size={16} /> {th ? 'ติดต่อ LINE' : 'Contact LINE'}
          </a>
        </div>
      </div>
    </div>
  )
}
