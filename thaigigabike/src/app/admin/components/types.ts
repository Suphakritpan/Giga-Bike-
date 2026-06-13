// Shared types + constants for the admin dashboard and its tab components.
// Extracted verbatim from admin/page.tsx (no value changes).
import type { Product } from '@/data/products'

export type OrderStatus = 'pending' | 'paid' | 'shipping' | 'delivered' | 'cancelled'
export type Tab = 'products' | 'orders' | 'stock' | 'messages' | 'tickets' | 'tax' | 'reviews' | 'announcements'

export type AdminMessage = {
  id: string; sender_name: string; sender_email: string; sender_phone: string | null
  subject: string | null; body: string; product_code: string | null
  status: 'new' | 'replied' | 'closed'; created_at: string
}
export type AdminReview = {
  id: string; product_id: string | null; reviewer_name: string
  rating: number; comment: string | null; published: boolean; created_at: string
}
export type TicketStatus = 'open' | 'answered' | 'closed'
export type AdminTicket = {
  id: string; user_id: string | null; email: string; topic: string
  order_id: string | null; subject: string; body: string; images: string[]
  status: TicketStatus; rating: number | null; created_at: string
}
export type TaxRequest = {
  id: string; user_id: string | null; order_id: string; tax_id: string
  company: string; address: string; status: 'requested' | 'issued'; created_at: string
  order_total: number | null; order_email: string | null
}
export type ThreadReply = { id: string; author: 'customer' | 'shop'; body: string; images: string[]; created_at: string }

export type AnnouncementType = 'info' | 'promo' | 'update' | 'shipping'
export type Announcement = {
  id: string; title_th: string; title_en: string | null
  body_th: string | null; body_en: string | null
  type: AnnouncementType; published: boolean; pinned: boolean; created_at: string
  // Optional (added via migration — see supabase/announcements-extras.sql):
  starts_at?: string | null; ends_at?: string | null
  image_url?: string | null; link_url?: string | null; link_label?: string | null
}
export const ANNOUNCEMENT_TYPES: AnnouncementType[] = ['info', 'promo', 'update', 'shipping']
export const ANNOUNCEMENT_TYPE_LABELS: Record<AnnouncementType, string> = {
  info: 'ข่าวสาร', promo: 'โปรโมชั่น', update: 'อัปเดต', shipping: 'การจัดส่ง',
}

export type OrderItem = {
  productId: string; code: string; name: string; nameTh: string
  price: number; quantity: number; color: string
}
export type Order = {
  id: string; status: OrderStatus; created_at: string
  recipient_name: string; recipient_phone: string; recipient_address: string
  shipping_method: string; shipping_fee: number; payment_method: string
  items: OrderItem[]; subtotal: number; cod_fee: number; total: number
  slip_url: string | null; slip_path: string | null; tracking_no: string | null
}

export const TICKET_TOPIC_LABELS: Record<string, string> = {
  general: 'ทั่วไป', order: 'ออเดอร์', shipping: 'จัดส่ง', product: 'สินค้า',
  refund: 'คืนเงิน', claim: 'เคลม', payment: 'ชำระเงิน',
}

export const LOW_STOCK_THRESHOLD = 5
export const PAGE_SIZE = 50

// Sort for the products + stock tabs (price / stock, ascending or descending).
export type ProductSort = 'latest' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc'
export const PRODUCT_SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'latest',     label: 'ล่าสุด' },
  { value: 'price-asc',  label: 'ราคา: น้อย → มาก' },
  { value: 'price-desc', label: 'ราคา: มาก → น้อย' },
  { value: 'stock-asc',  label: 'สต็อก: น้อย → มาก' },
  { value: 'stock-desc', label: 'สต็อก: มาก → น้อย' },
]
/** Returns a new sorted array; 'latest' keeps the incoming order. */
export function sortProducts(list: Product[], sort: ProductSort): Product[] {
  if (sort === 'latest') return list
  const s = [...list]
  switch (sort) {
    case 'price-asc':  return s.sort((a, b) => a.price - b.price)
    case 'price-desc': return s.sort((a, b) => b.price - a.price)
    case 'stock-asc':  return s.sort((a, b) => a.stockCount - b.stockCount)
    case 'stock-desc': return s.sort((a, b) => b.stockCount - a.stockCount)
    default:           return s
  }
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'badge-gray', paid: 'badge-green', shipping: 'badge-orange',
  delivered: 'badge-green', cancelled: 'badge-red',
}
export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'รอชำระ', paid: 'ชำระแล้ว', shipping: 'กำลังส่ง',
  delivered: 'สำเร็จ', cancelled: 'ยกเลิก',
}
