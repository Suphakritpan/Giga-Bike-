import { redirect } from 'next/navigation'

// /track-order is a canonical alias for /order
// Preserves ?id= param so direct links still work
export default function TrackOrderPage({
  searchParams,
}: {
  searchParams: { id?: string }
}) {
  const target = searchParams.id ? `/order?id=${encodeURIComponent(searchParams.id)}` : '/order'
  redirect(target)
}
