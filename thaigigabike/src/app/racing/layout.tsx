import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Racing Parts',
  description: 'อะไหล่แต่งสายซิ่ง CNC คุณภาพระดับสนามแข่ง',
  alternates: { canonical: '/racing' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
