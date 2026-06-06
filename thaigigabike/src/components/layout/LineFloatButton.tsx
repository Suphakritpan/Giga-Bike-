'use client'
import { MessageCircle } from 'lucide-react'
import { useLang } from '@/lib/lang'

export function LineFloatButton() {
  const { locale } = useLang()

  return (
    <a
      href="https://line.me/ti/p/~thaigigabike"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={locale === 'th' ? 'สอบถามทาง LINE' : 'Chat on LINE'}
      title={locale === 'th' ? 'สอบถามทาง LINE' : 'Chat on LINE'}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: '#06C755',
        color: '#fff',
        borderRadius: 999,
        padding: '11px 18px 11px 14px',
        fontWeight: 700,
        fontSize: 15,
        textDecoration: 'none',
        boxShadow: '0 4px 20px rgba(6,199,85,.45)',
        transition: 'transform .15s, box-shadow .15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1.06)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(6,199,85,.6)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(6,199,85,.45)'
      }}
    >
      <MessageCircle size={20} strokeWidth={2.5} />
      <span>{locale === 'th' ? 'LINE' : 'Chat'}</span>
    </a>
  )
}
