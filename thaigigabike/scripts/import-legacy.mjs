#!/usr/bin/env node
/**
 * import-legacy.mjs — Legacy site → structured products pipeline
 * ----------------------------------------------------------------
 * Parses the locally-mirrored thaigigabike.com HTML (HTTrack dump,
 * tis-620 / windows-874 encoded) and extracts REAL product data:
 *   code · Thai description · price · product images · bike fitment.
 *
 * It NEVER invents data. Anything missing or ambiguous is left blank
 * and the product is flagged `needs_review` with the reason(s) why.
 *
 * Usage:
 *   node scripts/import-legacy.mjs ["<path to mirror www dir>"]
 *
 * Default mirror path (relative to repo root):
 *   ../HTTrack My Web Sites/Giga-Bike-/www.thaigigabike.com
 *
 * Outputs (written next to this script, in ./out):
 *   legacy-products.json   — full structured records
 *   legacy-products.csv    — flat review sheet
 *   legacy-report.json     — coverage / quality summary
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..', '..')

const MIRROR = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(REPO_ROOT, 'HTTrack My Web Sites', 'Giga-Bike-', 'www.thaigigabike.com')

const OUT_DIR = path.resolve(__dirname, 'out')

// ── Page → bike-model fitment ─────────────────────────────────────
// Only model-specific pages assert fitment. Brand landing pages and
// part-category pages assert no fitment ([]); their products inherit
// fitment from the model pages via cross-page de-duplication.
const PAGE_MODELS = {
  'SR.html': ['sr400'],
  'srx.html': ['srx'],
  'xs650.html': ['xs650'],
  'xt500.html': ['xt500'],
  'R15_XSR.html': ['r15'],
  'R3.html': ['r3'],
  'R1_R6.html': ['r1'],
  'R9-R7.html': ['r1'],
  'CB750k.html': ['cb750'],
  'honda_GB250_400.html': ['gb400'],
  'honda gb250-400.html': ['gb400'],
  'honda cb400ss.html': ['gb400'],
  'NC35.html': ['nc35'],
  'CBR150r_CBR250rr.html': ['cbr250'],
  'CB150r.html': ['cbr250'],
  'Monkey_msx125.html': ['monkey'],
  'msx125.html': ['monkey'],
  '2T.html': ['nsr150'],
  'w650.html': ['w650'],
  'Estrella250.html': ['estrella'],
  'KSR110.html': ['ksr'],
  'Ninja250_300_Ninja400.html': ['ninja250'],
  'Ninja300.html': ['ninja250'],
  'Ninjazx10rr.html': ['zx10'],
  'Tempter400.html': ['tempter'],
  'triumph_Truxton900.html': ['thruxton'],
  'BMW.html': ['s1000rr'],
  'RoyalEnfield_GT500.html': ['interceptor'],
  'ducati_Monter795.html': ['monster'],
  'HD.html': ['hd883'],
  'Sportter.html': ['hd883'],
  'Stallions.html': ['centaur'],
  'KTM-RC390.html': ['rc390'],
  // part-category pages — real products, fitment varies / universal
  'Ohlins.html': [],
  'Sprocket_Alloys.html': [],
  'Bolts-nut.html': [],
  'Seat.html': [],
}

// Pages that are navigation / info only — never parsed for products.
const SKIP_PAGES = new Set([
  'contact.html', 'payment.html', 'QR.html', 'Pictures.html',
  'Racing.html', 'Racing Tame.html', 'Line logo.html',
])

// ── Category inference (Thai keywords, priority order) ────────────
// Fasteners are checked before assembly groups so "น๊อตขันแผงคอ" (a bolt)
// lands in `hardware` — matching the old site's own "Bolts-nut" category —
// rather than `suspension`. brake/drivetrain stay first (e.g. น๊อตสายเบรค→brake).
const CATEGORY_RULES = [
  ['brake', ['จานเบรค', 'ดิสเบรค', 'ปั๊มเบรค', 'ดรัมเบรค', 'สายเบรค', 'ห่วงสายเบรค', 'มือเบรค', 'ขายึดปั๊ม', 'เบรค']],
  ['drivetrain', ['สเตอร์', 'สปร็อค', 'โซ่', 'sprocket']],
  ['hardware', ['น๊อต', 'น็อต', 'สกรู', 'แหวน', 'สลัก', 'ห่วง']],
  ['suspension', ['แผงคอ', 'ตุ๊กตา', 'โช้ค', 'โช๊ค', 'ohlins', 'กระเดื่อง']],
  ['engine', ['ฝาคลัช', 'ฝากด', 'คลัช', 'เสื้อสูบ', 'ลูกสูบ', 'วาล์ว', 'วาร์ว', 'แคม', 'ปากแตร', 'คาร์บ', 'กรองน้ำมัน', 'กรอง', 'ยกวาล์ว', 'ออยล์', 'น้ำมันเครื่อง', 'ฝาครอบเครื่อง', 'หัวเทียน']],
  ['chassis', ['สวิงอาร์ม', 'บังโคลน', 'ขาตั้ง', 'กันล้ม', 'พักเท้า', 'เบาะ', 'แฮนด์', 'เฟรม', 'แร็ค', 'ตัวถัง', 'ที่จับ']],
  ['accessories', ['ไฟเลี้ยว', 'กระจก', 'ขายึด', 'ฝาน้ำมัน', 'จุก', 'ฝาครอบ', 'ฝา']],
]

const COLOR_MAP = {
  'ดำ': 'black', 'เงิน': 'silver', 'ทอง': 'gold', 'ฮาร์ด': 'hard', 'ฮาร์ท': 'hard',
  'แดง': 'red', 'เขียว': 'green', 'น้ำเงิน': 'blue', 'ฟ้า': 'lightblue',
  'ปัดเงา': 'polished', 'เทา': 'gray', 'ส้ม': 'orange', 'ม่วง': 'purple',
}

// Image filenames that are template chrome, not product photos.
const IMG_JUNK = /(?:^|\/)(?:menu_|pn_\d|logo|paypal|thaigigabike\.jpg|gigabike1|counter|backblue|fade|qr|line|head\/|cr\.jpg|pirelli|product\.gif)/i

// ── Helpers ───────────────────────────────────────────────────────
const decode = (file) => new TextDecoder('windows-874').decode(fs.readFileSync(file))

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
}

/** Strip a page to a linear text stream with inline IMGSRC= image markers. */
function linearize(html) {
  html = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // image src has no raw spaces in the mirror (%20-encoded) → safe ASCII marker
    .replace(/<img\b[^>]*?\bsrc\s*=\s*"([^"]+)"[^>]*>/gi, (_, src) => ' IMGSRC=' + src + ' ')
    .replace(/<[^>]+>/g, ' ')
  return decodeEntities(html).replace(/[ \t\r\f\v]+/g, ' ')
}

const TOKEN_RE = /IMGSRC=(\S+)|([A-Z]{1,4}\.\s?\d{1,3}(?:\.\d)?)|([\d,]+)\s*(?:฿|บาท)|(ของหมด|[Ss]old)/g

/**
 * Walk the linear stream and group it into raw product records.
 *
 * A product block looks like:  [img][img] <CODE?> <thai description> <price ฿>
 * The CODE is optional — many sport-bike pages list real products (image +
 * description + price) with no SKU. A block is opened by the first image or
 * code and CLOSED by its price; the next image/code starts a new block.
 */
function tokenize(stream, page) {
  const products = []
  let cur = null
  let last = 0
  let seq = 0
  let m

  const open = () => { if (!cur) cur = { code: null, text: '', price: null, images: [], soldout: false, closed: false, page, seq: seq++ } }
  const push = () => { if (cur) { products.push(cur); cur = null } }

  TOKEN_RE.lastIndex = 0
  while ((m = TOKEN_RE.exec(stream))) {
    // text between tokens → belongs to the open block's description
    if (m.index > last && cur && !cur.closed) cur.text += stream.slice(last, m.index)
    last = TOKEN_RE.lastIndex

    if (m[1] !== undefined) {            // image — a closed block means a new product begins
      if (cur && cur.closed) push()
      open(); cur.images.push(m[1])
    } else if (m[2] !== undefined) {     // product code
      if (cur && (cur.closed || cur.code !== null)) push()
      open(); cur.code = m[2].replace(/\s+/g, '')
    } else if (m[3] !== undefined) {     // price closes the block
      if (cur && cur.price === null) { cur.price = parseInt(m[3].replace(/,/g, ''), 10); cur.closed = true }
    } else if (m[4] !== undefined) {     // sold-out marker
      if (cur) cur.soldout = true
    }
  }
  push()
  return products
}

function inferCategory(text) {
  const t = text.toLowerCase()
  for (const [cat, kws] of CATEGORY_RULES) {
    if (kws.some((k) => t.includes(k.toLowerCase()))) return cat
  }
  return ''
}

function extractMaterial(text) {
  const m = text.match(/ผลิตจาก\s*([^.()]+?)(?:\s*(?:มีสี|ชุดล|ชิ้นล|อันล|คู่ล|ตัวล|แผ่นล|เส้นล|ชุด|ชิ้น|ราคา|พร้อม|$))/)
  return m ? m[1].trim().replace(/\s+/g, ' ') : ''
}

function extractColors(text) {
  const m = text.match(/มีสี\s*\(?\s*([^)]+?)\s*\)?\s*(?:ชุด|ชิ้น|ราคา|สลับ|$)/)
  if (!m) return []
  const ids = new Set()
  for (const tok of m[1].split(/[,\/\-\s]+/)) {
    const id = COLOR_MAP[tok.trim()]
    if (id) ids.add(id)
  }
  return [...ids]
}

function shortName(text) {
  let s = text.replace(/\s+/g, ' ').trim()
  const cut = s.search(/\s(?:ผลิตจาก|มีสี|ขนาด|\()/)
  if (cut > 8) s = s.slice(0, cut)
  return s.slice(0, 70).trim()
}

function resolveImages(srcs, pageDir) {
  const out = []
  const seen = new Set()
  for (const src of srcs) {
    if (IMG_JUNK.test(src)) continue
    if (/^https?:\/\//i.test(src)) continue          // remote template assets
    const rel = decodeURIComponent(src).replace(/\\/g, '/')
    const abs = path.resolve(pageDir, rel)
    const key = rel.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ src: rel, exists: fs.existsSync(abs) })
  }
  return out
}

// ── Main ──────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(MIRROR)) {
    console.error('✗ Mirror not found: ' + MIRROR)
    process.exit(1)
  }
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const files = fs.readdirSync(MIRROR).filter((f) =>
    /\.html$/i.test(f) &&
    !/(?:8836|823c|b015|4039)\.html$/i.test(f) &&   // HTTrack dup variants
    !/^index/i.test(f) &&
    !SKIP_PAGES.has(f) &&
    fs.statSync(path.join(MIRROR, f)).size > 2000
  )

  const byCode = new Map()
  let rawCount = 0

  for (const file of files) {
    const models = PAGE_MODELS[file] // undefined = unmapped page (fitment unknown)
    let html
    try { html = decode(path.join(MIRROR, file)) } catch { continue }
    const raw = tokenize(linearize(html), file)

    for (const r of raw) {
      const text = r.text.replace(/\(\s*\)/g, ' ').replace(/\s+/g, ' ').trim()
      const imgs = resolveImages(r.images, MIRROR)
      const realImgs = imgs.filter((i) => i.exists)

      // ── noise filter ──
      if (r.code) {
        if (!/^[A-Z]{1,4}\.\d/.test(r.code)) continue
      } else {
        // code-less block: keep only if it has a price, or a real image + text
        if (r.price === null && !(realImgs.length >= 1 && text.length >= 8)) continue
        if (realImgs.length === 0 && text.length < 8) continue
      }
      rawCount++

      // dedup key: SKU code, else the first real product photo, else page block
      const firstImg = (realImgs[0] || imgs[0])?.src
      const key = r.code ? r.code : (firstImg ? 'IMG#' + firstImg : 'BLK#' + r.page + '#' + r.seq)

      const rec = byCode.get(key) ?? {
        id: key,
        code: r.code,
        name_th: '',
        name: '',                 // EN — not present on legacy site
        description_th: '',
        price: null,
        priceConflict: false,
        category: '',
        bikeModels: new Set(),
        colors: new Set(),
        material: '',
        images: [],
        inStock: true,
        sourcePages: new Set(),
      }

      // keep the richest description
      if (text.length > rec.description_th.length) {
        rec.description_th = text
        rec.name_th = shortName(text)
        rec.category = inferCategory(text)
        const mat = extractMaterial(text); if (mat) rec.material = mat
        for (const c of extractColors(text)) rec.colors.add(c)
      }
      // price (flag conflicts between pages)
      if (r.price !== null) {
        if (rec.price !== null && rec.price !== r.price) rec.priceConflict = true
        if (rec.price === null) rec.price = r.price
      }
      if (r.soldout) rec.inStock = false
      for (const im of imgs) if (!rec.images.some((x) => x.src === im.src)) rec.images.push(im)
      if (Array.isArray(models)) for (const mm of models) rec.bikeModels.add(mm)
      rec.sourcePages.add(file)
      byCode.set(key, rec)
    }
  }

  // finalize
  const products = [...byCode.values()].map((r) => {
    const images = r.images.filter((i) => i.exists).map((i) => i.src)
    const missingImgFiles = r.images.filter((i) => !i.exists).length
    const reasons = []
    if (r.code === null) reasons.push('no_code')
    if (r.price === null) reasons.push('no_price')
    if (images.length === 0) reasons.push('no_image')
    if (r.description_th.length < 8) reasons.push('short_description')
    if (r.category === '') reasons.push('no_category')
    if (r.bikeModels.size === 0) reasons.push('no_fitment')
    if (r.priceConflict) reasons.push('price_conflict')

    return {
      id: r.id,
      code: r.code,
      name_th: r.name_th,
      name: r.name,
      description_th: r.description_th,
      price: r.price,
      category: r.category,
      bikeModels: [...r.bikeModels],
      colors: [...r.colors],
      material: r.material,
      images,
      missingImageFiles: missingImgFiles,
      inStock: r.inStock,
      sourcePages: [...r.sourcePages],
      needs_review: reasons.length > 0,
      review_reasons: reasons,
      needs_translation: r.name === '',
    }
  }).sort((a, b) => {
    // coded products first (numeric by code), then code-less blocks by id
    if (a.code && b.code) return a.code.localeCompare(b.code, undefined, { numeric: true })
    if (a.code) return -1
    if (b.code) return 1
    return a.id.localeCompare(b.id)
  })

  // ── write JSON ──
  fs.writeFileSync(path.join(OUT_DIR, 'legacy-products.json'), JSON.stringify(products, null, 2))

  // ── write CSV ──
  const csvEsc = (v) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const cols = ['id', 'code', 'name_th', 'price', 'category', 'bikeModels', 'colors', 'material', 'image_count', 'first_image', 'in_stock', 'needs_review', 'review_reasons', 'source_pages']
  const rows = products.map((p) => [
    p.id, p.code ?? '', p.name_th, p.price ?? '', p.category, p.bikeModels.join('|'),
    p.colors.join('|'), p.material, p.images.length, p.images[0] ?? '',
    p.inStock, p.needs_review, p.review_reasons.join('|'), p.sourcePages.join('|'),
  ].map(csvEsc).join(','))
  fs.writeFileSync(path.join(OUT_DIR, 'legacy-products.csv'), '﻿' + [cols.join(','), ...rows].join('\n'))

  // ── report ──
  const tally = (arr, key) => arr.reduce((a, x) => { const k = key(x); a[k] = (a[k] || 0) + 1; return a }, {})
  const reasonCounts = {}
  for (const p of products) for (const r of p.review_reasons) reasonCounts[r] = (reasonCounts[r] || 0) + 1
  const report = {
    generatedAt: new Date().toISOString(),
    mirror: MIRROR,
    pagesParsed: files.length,
    rawProductBlocks: rawCount,
    uniqueProducts: products.length,
    codedProducts: products.filter((p) => p.code).length,
    codelessProducts: products.filter((p) => !p.code).length,
    needsReview: products.filter((p) => p.needs_review).length,
    complete: products.filter((p) => !p.needs_review).length,
    byCategory: tally(products, (p) => p.category || '(none)'),
    byReviewReason: reasonCounts,
    withImages: products.filter((p) => p.images.length > 0).length,
    withPrice: products.filter((p) => p.price !== null).length,
    withFitment: products.filter((p) => p.bikeModels.length > 0).length,
  }
  fs.writeFileSync(path.join(OUT_DIR, 'legacy-report.json'), JSON.stringify(report, null, 2))

  // ── console summary ──
  console.log('\n✓ Parsed ' + files.length + ' pages → ' + products.length + ' unique products (' + rawCount + ' raw blocks)')
  console.log('  complete: ' + report.complete + '   needs_review: ' + report.needsReview)
  console.log('  with price: ' + report.withPrice + '   with image: ' + report.withImages + '   with fitment: ' + report.withFitment)
  console.log('  by category:', report.byCategory)
  console.log('  review reasons:', report.byReviewReason)
  console.log('\n  → out/legacy-products.json')
  console.log('  → out/legacy-products.csv')
  console.log('  → out/legacy-report.json\n')
}

main()
