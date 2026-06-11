'use client'

/**
 * Loading spinner — single .spinner CSS class, no more per-page
 * inline @keyframes. `center` wraps it in a padded centered block
 * (the common "page is loading" case).
 */
export function Spinner({ small = false, center = false }: { small?: boolean; center?: boolean }) {
  const el = (
    <span
      className={small ? 'spinner spinner-sm' : 'spinner'}
      role="status"
      aria-label="กำลังโหลด"
    />
  )
  if (!center) return el
  return <div style={{ textAlign: 'center', padding: '48px 0' }}>{el}</div>
}
