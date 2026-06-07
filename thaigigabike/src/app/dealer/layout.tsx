import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ตัวแทนจำหน่าย',
  description: 'สมัครเป็นตัวแทนจำหน่ายอะไหล่แต่ง ThaiGigaBike',
  alternates: { canonical: '/dealer' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
