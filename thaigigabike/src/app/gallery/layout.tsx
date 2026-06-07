import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'แกลเลอรีผลงาน',
  description: 'รวมภาพผลงานอะไหล่แต่ง CNC ของ ThaiGigaBike',
  alternates: { canonical: '/gallery' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
