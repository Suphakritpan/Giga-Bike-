'use client'

/**
 * Loading placeholder block — pair with real layout dimensions so the page
 * doesn't jump when content arrives.
 *
 *   <Skeleton height={120} />
 *   <Skeleton width={180} height={16} />
 */
export function Skeleton({
  width = '100%',
  height = 16,
  style,
}: {
  width?: number | string
  height?: number | string
  style?: React.CSSProperties
}) {
  return <div className="skeleton" aria-hidden="true" style={{ width, height, ...style }} />
}

/** Stack of skeleton rows — quick list/page placeholder. */
export function SkeletonList({ rows = 3, height = 72 }: { rows?: number; height?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} height={height} />)}
    </div>
  )
}
