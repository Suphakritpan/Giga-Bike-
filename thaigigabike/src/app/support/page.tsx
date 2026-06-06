'use client'
import { useState } from 'react'
import Link from 'next/link'
import { MessageCircle, Phone, ChevronDown, ChevronUp, Truck, CreditCard, Package, HelpCircle } from 'lucide-react'
import { useLang } from '@/lib/lang'

type Faq = { q: string; a: string }
type FaqGroup = { icon: React.ReactNode; title: string; faqs: Faq[] }

const FAQS_TH: FaqGroup[] = [
  {
    icon: <Truck size={18} />,
    title: 'การจัดส่ง',
    faqs: [
      { q: 'ส่งไปต่างประเทศได้ไหม?', a: 'ได้ครับ เราส่งทั่วโลกกว่า 100 ประเทศ ทั้งทางเครื่องบิน EMS และทางเรือ ติดต่อผ่าน LINE หรือ Facebook เพื่อคำนวณค่าส่งและเวลาจัดส่งสำหรับประเทศของคุณ' },
      { q: 'ใช้เวลากี่วันถึงจะได้รับสินค้า?', a: 'ในประเทศไทย: 1–3 วันทำการ สำหรับ Kerry/Flash Express\nต่างประเทศ EMS: 7–14 วันทำการ\nต่างประเทศทางเรือ: 4–8 สัปดาห์ (ขึ้นอยู่กับประเทศ)' },
      { q: 'ค่าจัดส่งคิดอย่างไร?', a: 'ในประเทศ: Kerry Express ฿60 / Flash Express ฿80 / รับเองที่ร้านฟรี\nต่างประเทศ: คิดตามน้ำหนักจริงและปลายทาง ติดต่อก่อนสั่งเพื่อเช็คราคา' },
      { q: 'ส่ง EMS ฟรีจริงหรือเปล่า?', a: 'ส่ง EMS ฟรีสำหรับลูกค้าขายปลีกทุกออเดอร์ในประเทศไทย ไม่มีขั้นต่ำ จัดส่งทุกวัน อย่างช้าภายใน 3 วัน' },
      { q: 'จะติดตามพัสดุได้อย่างไร?', a: 'หลังจากร้านออกเลขพัสดุ คุณสามารถติดตามได้ที่หน้า "ติดตามออเดอร์" ด้วยเลขออเดอร์ GGB-XXXXX หรือคลิกลิงก์ Kerry/Flash โดยตรงในหน้าออเดอร์' },
    ],
  },
  {
    icon: <CreditCard size={18} />,
    title: 'การชำระเงิน',
    faqs: [
      { q: 'ชำระเงินผ่านช่องทางไหนได้บ้าง?', a: 'โอนเงินผ่านธนาคาร (KBank / SCB / KTB) พร้อมแนบสลิป\nเก็บเงินปลายทาง COD (+฿50) ผ่าน Kerry/Flash ในประเทศไทย\nต่างประเทศ: Western Union, MoneyGram, PayPal (ติดต่อก่อนสั่ง)' },
      { q: 'ต้องโอนไปบัญชีไหน?', a: 'ติดต่อ LINE: thaigigabike หรือ SMS 081-424-9407 เพื่อขอเลขบัญชีธนาคาร ทีมงานจะแจ้งทันที' },
      { q: 'แนบสลิปอย่างไร?', a: 'ระหว่าง checkout เลือกวิธีชำระเงิน "โอนเงิน" แล้วอัปโหลดรูปสลิปได้เลย ระบบรองรับ JPG, PNG, WebP และ PDF ขนาดไม่เกิน 5 MB' },
      { q: 'หลังโอนเงินแล้วต้องรอนานไหม?', a: 'ทีมงานจะ confirm ออเดอร์ภายใน 30 นาที ในเวลาทำการ 9:00–20:00 น. ทุกวัน ระบบจะส่ง email แจ้งยืนยันให้อัตโนมัติ' },
    ],
  },
  {
    icon: <Package size={18} />,
    title: 'สินค้า',
    faqs: [
      { q: 'สินค้า CNC Billet คืออะไร?', a: 'ชิ้นส่วนที่ออกแบบและกัดจากบล็อกอลูมิเนียม 6061 T6 ด้วยเครื่อง CNC ความแม่นยำ ±0.01 mm ทุกชิ้นผลิตในโรงงาน GIGA BIKE FACTORY ประเทศไทย' },
      { q: 'รองรับรถรุ่นไหนบ้าง?', a: 'รองรับ 26+ รุ่น รวมถึง Yamaha SR400/500, XS650, Honda CB750, GB400, Kawasaki W650/W800, Triumph Thruxton และอีกหลายรุ่น ค้นหาตามรุ่นรถได้ในหน้าสินค้า' },
      { q: 'สีมีให้เลือกกี่สี?', a: 'ส่วนใหญ่มี Black Anodize, Silver, Gold, Hard Anodize และ Polished บางรายการมีตัวเลือกเพิ่มเติม สามารถดูตัวเลือกสีในหน้าสินค้าแต่ละรายการ' },
      { q: 'สินค้าหมด สามารถสั่งจองได้ไหม?', a: 'ได้ครับ ติดต่อ LINE: thaigigabike เพื่อสอบถามกำหนดผลิตและสั่งจอง ระยะเวลาผลิตประมาณ 7–14 วัน' },
      { q: 'สินค้า OEM ต่างจาก CNC Billet อย่างไร?', a: 'OEM เป็นชิ้นส่วนมาตรฐานจากโรงงานรถ CNC Billet เป็นชิ้นส่วนแต่งที่ผลิตพิเศษ มีน้ำหนักเบากว่า ทนทานกว่า และมีดีไซน์ที่เป็นเอกลักษณ์ เหมาะสำหรับการแต่งรถและการแข่ง' },
    ],
  },
  {
    icon: <HelpCircle size={18} />,
    title: 'ออเดอร์ & ทั่วไป',
    faqs: [
      { q: 'ติดตามออเดอร์ได้อย่างไร?', a: 'ไปที่หน้า "ติดตามออเดอร์" กรอกเลขออเดอร์ GGB-XXXXX แล้วรับรหัส OTP ทาง email ที่ใช้สั่งซื้อ ใช้รหัสเพื่อดูสถานะออเดอร์และเลขพัสดุ' },
      { q: 'ยกเลิกหรือเปลี่ยนออเดอร์ได้ไหม?', a: 'ติดต่อ LINE: thaigigabike ภายใน 2 ชั่วโมงหลังสั่ง หากออเดอร์ยังไม่ถูกแพ็คสามารถแก้ไขได้ หลังจากจัดส่งแล้วไม่สามารถยกเลิกได้' },
      { q: 'สินค้าได้รับเสียหาย ทำอย่างไร?', a: 'ถ่ายรูปสินค้าและบรรจุภัณฑ์ที่เสียหายทันที แล้วแจ้ง LINE: thaigigabike พร้อมเลขออเดอร์ ร้านจะเปลี่ยนชิ้นใหม่ให้โดยไม่คิดค่าใช้จ่าย' },
      { q: 'ร้านเปิดกี่โมง?', a: 'เปิดทุกวัน 9:00–20:00 น. ตอบ LINE/Facebook ภายใน 1 ชั่วโมงในเวลาทำการ' },
      { q: 'มีหน้าร้านให้เข้าไปดูได้ไหม?', a: 'มีครับ ที่อยู่: 99/21-22 ถ.พระราม 2 แสมดำ บางขุนเทียน กทม. 10150 แนะนำโทรนัดล่วงหน้าที่ 081-424-9407 ก่อนเดินทาง' },
    ],
  },
]

const FAQS_EN: FaqGroup[] = [
  {
    icon: <Truck size={18} />,
    title: 'Shipping',
    faqs: [
      { q: 'Do you ship internationally?', a: 'Yes, we ship to 100+ countries worldwide via EMS airmail and sea freight. Contact us on LINE or Facebook to get a shipping quote for your country.' },
      { q: 'How long does delivery take?', a: 'Thailand: 1–3 business days via Kerry/Flash Express\nInternational EMS: 7–14 business days\nSea freight: 4–8 weeks depending on destination' },
      { q: 'How much does shipping cost?', a: 'Thailand: Kerry Express ฿60 / Flash Express ฿80 / Store pickup free\nInternational: Calculated by weight and destination. Contact us before ordering for a quote.' },
      { q: 'Is free EMS shipping really free?', a: 'Yes! Free EMS shipping on all retail orders within Thailand — no minimum order. Ships daily, dispatched within 3 days.' },
      { q: 'How do I track my order?', a: 'Go to the "Track Order" page and enter your order number (GGB-XXXXX). You\'ll receive a 6-digit OTP at your checkout email to view the order status and tracking link.' },
    ],
  },
  {
    icon: <CreditCard size={18} />,
    title: 'Payment',
    faqs: [
      { q: 'What payment methods do you accept?', a: 'Bank transfer (KBank / SCB / KTB) with slip upload\nCash on Delivery COD (+฿50) via Kerry/Flash in Thailand\nInternational: Western Union, MoneyGram, PayPal — contact us before ordering.' },
      { q: 'How do I get the bank account number?', a: 'Contact LINE: thaigigabike or SMS +66-81-424-9407 and the team will provide bank details immediately.' },
      { q: 'How do I upload my payment slip?', a: 'During checkout, select "Bank Transfer" as your payment method and upload your slip. We accept JPG, PNG, WebP, and PDF up to 5 MB.' },
      { q: 'How long does order confirmation take?', a: 'Orders are confirmed within 30 minutes during business hours (9 AM–8 PM daily). An email confirmation is sent automatically.' },
    ],
  },
  {
    icon: <Package size={18} />,
    title: 'Products',
    faqs: [
      { q: 'What is CNC Billet?', a: 'CNC Billet parts are machined from solid 6061-T6 aluminium alloy using multi-axis CNC machines at ±0.01 mm precision. Every piece is made in-house at GIGA BIKE FACTORY, Thailand.' },
      { q: 'Which bike models do you support?', a: 'We support 26+ models including Yamaha SR400/500, XS650, Honda CB750, GB400, Kawasaki W650/W800, Triumph Thruxton, and more. Filter by bike model on the product search page.' },
      { q: 'What colors are available?', a: 'Most parts come in Black Anodize, Silver, Gold, Hard Anodize, and Polished. Some products have additional color options visible on the product page.' },
      { q: 'Can I order an out-of-stock item?', a: 'Yes — contact LINE: thaigigabike to check the production schedule and place a pre-order. Lead time is typically 7–14 days.' },
    ],
  },
  {
    icon: <HelpCircle size={18} />,
    title: 'Orders & General',
    faqs: [
      { q: 'How do I track my order?', a: 'Go to the Track Order page, enter your GGB-XXXXX order number, and receive a 6-digit OTP at your checkout email to view status and the courier tracking link.' },
      { q: 'Can I cancel or change my order?', a: 'Contact LINE: thaigigabike within 2 hours of placing the order. If it hasn\'t been packed yet, changes are possible. Once shipped, orders cannot be cancelled.' },
      { q: 'My item arrived damaged — what do I do?', a: 'Photograph the damaged item and packaging immediately, then message LINE: thaigigabike with your order number. We will replace the item at no cost.' },
      { q: 'What are your business hours?', a: 'Open daily 9 AM–8 PM (ICT). We respond on LINE/Facebook within 1 hour during business hours.' },
      { q: 'Do you have a physical store?', a: 'Yes — 99/21-22 Rama 2 Rd., Samaedam, Bangkhunthian, Bangkok 10150. We recommend calling +66-81-424-9407 before visiting.' },
    ],
  },
]

function FaqItem({ q, a }: Faq) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '0.5px solid var(--border)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, padding: '16px 0',
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>{q}</span>
        {open ? <ChevronUp size={18} color="var(--text3)" style={{ flexShrink: 0 }} /> : <ChevronDown size={18} color="var(--text3)" style={{ flexShrink: 0 }} />}
      </button>
      {open && (
        <div style={{ paddingBottom: 16, paddingRight: 32 }}>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.75, whiteSpace: 'pre-line' }}>{a}</p>
        </div>
      )}
    </div>
  )
}

function FaqGroup({ group }: { group: FaqGroup }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ color: 'var(--green)' }}>{group.icon}</span>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>{group.title}</h2>
      </div>
      <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '0 20px' }}>
        {group.faqs.map((faq, i) => <FaqItem key={i} {...faq} />)}
      </div>
    </div>
  )
}

export default function SupportPage() {
  const { t, locale } = useLang()
  const groups = locale === 'th' ? FAQS_TH : FAQS_EN

  return (
    <div>
      {/* Header */}
      <section style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '32px 0' }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <h1 style={{ fontSize: 38, marginBottom: 4 }}>{t.support.title}</h1>
          <p style={{ color: 'var(--text2)', fontSize: 17 }}>{t.support.subtitle}</p>
        </div>
      </section>

      {/* LINE CTA banner */}
      <div className="container" style={{ maxWidth: 760, paddingTop: 28 }}>
        <div style={{
          background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.3)',
          borderRadius: 14, padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap', marginBottom: 36,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MessageCircle size={22} color="var(--green)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>{t.support.ctaTitle}</div>
              <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 2 }}>{t.support.ctaSub}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a
              href="https://line.me/ti/p/thaigigabike"
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'var(--green)', color: '#fff',
                padding: '9px 20px', borderRadius: 9, fontWeight: 700, fontSize: 15,
                textDecoration: 'none',
              }}
            >
              <MessageCircle size={16} />
              {t.support.askLine}
            </a>
            <a
              href="tel:+66814249407"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'var(--bg3)', color: 'var(--text)',
                border: '0.5px solid var(--border2)',
                padding: '9px 20px', borderRadius: 9, fontWeight: 600, fontSize: 15,
                textDecoration: 'none',
              }}
            >
              <Phone size={16} />
              {t.support.phone}
            </a>
          </div>
        </div>

        {/* FAQ Groups */}
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>{t.support.faqTitle}</h2>
        {groups.map((group, i) => <FaqGroup key={i} group={group} />)}

        {/* Bottom CTA */}
        <div style={{
          background: 'var(--bg2)', border: '0.5px solid var(--border)',
          borderRadius: 14, padding: '28px 24px', textAlign: 'center', marginBottom: 48,
        }}>
          <MessageCircle size={32} color="var(--green)" style={{ display: 'block', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{t.support.ctaTitle}</h3>
          <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 20 }}>{t.support.ctaSub}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="https://line.me/ti/p/thaigigabike"
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--green)', color: '#fff',
                padding: '11px 28px', borderRadius: 10, fontWeight: 700, fontSize: 16,
                textDecoration: 'none',
              }}
            >
              <MessageCircle size={18} />
              {t.support.askLine}
            </a>
            <Link
              href="/contact"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--bg3)', color: 'var(--text)',
                border: '0.5px solid var(--border2)',
                padding: '11px 28px', borderRadius: 10, fontWeight: 600, fontSize: 16,
                textDecoration: 'none',
              }}
            >
              {locale === 'th' ? 'ข้อมูลการติดต่อ' : 'Contact info'}
            </Link>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 16 }}>{t.support.hours}</p>
        </div>
      </div>
    </div>
  )
}
