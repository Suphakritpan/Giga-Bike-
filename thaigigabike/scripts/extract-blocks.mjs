#!/usr/bin/env node
/**
 * extract-blocks.mjs — Image+caption block extractor (review report)
 * ------------------------------------------------------------------
 * The legacy site stores product data VISUALLY: an image followed by a
 * caption/description directly below it. This script extracts one block
 * PER IMAGE PER PAGE — it does NOT de-duplicate by image filename, because
 * the same part legitimately appears on several model pages with different
 * brand/model context.
 *
 * Local files only. No live fetch. No external AI/API. Nothing is written
 * to any database — this only produces a report for human review of the
 * image↔caption pairing.
 *
 * Run:
 *   node scripts/extract-blocks.mjs ["<parse dir>"] ["<image mirror dir>"]
 *
 * Outputs (repo-root/legacy-analysis/):
 *   product-blocks.json
 *   product-blocks.csv
 *   page-product-summary.md
 *   images-used-by-multiple-pages.md
 *   needs-review.md
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..', '..')

// Parse source: the user-specified flat html-only mirror (fallback: in-repo mirror).
const ONEDRIVE = 'C:\\Users\\PAN\\OneDrive\\รูปภาพ\\เดสก์ท็อป\\graphify-sandbox\\httrack-html-only'
const IN_REPO_WWW = path.resolve(REPO_ROOT, 'HTTrack My Web Sites', 'Giga-Bike-', 'www.thaigigabike.com')
const PARSE_DIR = process.argv[2] || (fs.existsSync(ONEDRIVE) ? ONEDRIVE : IN_REPO_WWW)
// Image resolution always uses the mirror that actually contains the image files.
const IMG_DIR = process.argv[3] || IN_REPO_WWW
const SITEMAP_CSV = path.resolve(REPO_ROOT, 'sitemap-out', 'page-inventory.csv')
const OUT_DIR = path.resolve(REPO_ROOT, 'legacy-analysis')

// ── page → brand / model context (from the sidebar menu + filenames) ──
const PAGE_CONTEXT = {
  'SR.html': ['Yamaha', 'SR400/500'],
  'srx.html': ['Yamaha', 'SRX400-600'],
  'xs650.html': ['Yamaha', 'XS650/TX650'],
  'xt500.html': ['Yamaha', 'XT/TT500'],
  'R15_XSR.html': ['Yamaha', 'R15/XSR155/XMAX300'],
  'R3.html': ['Yamaha', 'R3/MT03/R25'],
  'R1_R6.html': ['Yamaha', 'R1/R6'],
  'R9-R7.html': ['Yamaha', 'R7/R9'],
  'CB750k.html': ['Honda', 'CB750 k0-k7'],
  'honda_GB250_400.html': ['Honda', 'GB250/GB400/CB400ss'],
  'honda gb250-400.html': ['Honda', 'GB250/GB400/CB400ss'],
  'honda cb400ss.html': ['Honda', 'CB400ss'],
  'NC35.html': ['Honda', 'NC30/NC35/CB1300'],
  'CBR150r_CBR250rr.html': ['Honda', 'CBR150R/CBR250rr/300'],
  'CB150r.html': ['Honda', 'CB150R'],
  'Monkey_msx125.html': ['Honda', 'Monkey/MSX125/DAX125'],
  'msx125.html': ['Honda', 'MSX125'],
  '2T.html': ['Honda', 'NSR150sp/Dash125 2T'],
  'w650.html': ['Kawasaki', 'W650/W800'],
  'Estrella250.html': ['Kawasaki', 'Estrella250/TR250'],
  'KSR110.html': ['Kawasaki', 'KSR110/KR150'],
  'Ninja250_300_Ninja400.html': ['Kawasaki', 'Ninja250/300/400'],
  'Ninja300.html': ['Kawasaki', 'Ninja300'],
  'Ninjazx10rr.html': ['Kawasaki', 'ZX10RR'],
  'Tempter400.html': ['Suzuki', 'Tempter 400'],
  'triumph_Truxton900.html': ['Triumph', 'Thruxton900/T100/T120'],
  'BMW.html': ['BMW', 'S1000RR'],
  'RoyalEnfield_GT500.html': ['Royal Enfield', 'GT535/Interceptor 650'],
  'ducati_Monter795.html': ['Ducati', 'Monster795/796/Hyper821'],
  'HD.html': ['Harley-Davidson', 'Sportster 883-1200'],
  'Sportter.html': ['Harley-Davidson', 'Sportster 883-1200'],
  'Stallions.html': ['Stallions', 'Centaur 150'],
  'KTM-RC390.html': ['KTM', 'RC390'],
  'Ohlins.html': ['', 'Ohlins FG620/FG433'],
  'Sprocket_Alloys.html': ['', 'Sprocket Alloys'],
  'Bolts-nut.html': ['', 'Bolts & Nut'],
  'Seat.html': ['', 'Seat'],
  'Racing.html': ['', 'Racing'],
  'Pictures.html': ['', 'Gallery'],
  'YAMAHA.html': ['Yamaha', '(brand index)'],
  'honda.html': ['Honda', '(brand index)'],
  'kawasaki.html': ['Kawasaki', '(brand index)'],
  'suzuki.html': ['Suzuki', '(brand index)'],
  'index-2.html': ['', '(home)'],
  'index.html': ['', '(home)'],
}

// chrome / template images that are not products
const IMG_JUNK = /(?:^|\/)(?:menu_|pn_\d|logo|paypal|thaigigabike\.jpg|gigabike1|counter|backblue|fade|qr|line|head\/|cr\.jpg|pirelli|product\.gif|\w+\.gif$)/i

// ── helpers ───────────────────────────────────────────────────────
const decode = (file) => new TextDecoder('windows-874').decode(fs.readFileSync(file))

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
}

const norm = (s) => decodeEntities(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const thaiLen = (s) => (s.match(/[฀-๿]/g) || []).length

const PRICE_RE = /([\d,]+)\s*(฿|บาท|B\b|baht)/i
function parsePrice(text) {
  const m = text.match(PRICE_RE)
  if (!m) return { raw: '', num: null, cur: '' }
  const num = parseInt(m[1].replace(/,/g, ''), 10)
  return { raw: m[0].trim(), num: Number.isFinite(num) ? num : null, cur: 'THB' }
}

const CODE_AT_START = /^([A-Z]{1,4}\.\s?\d{1,3}(?:\.\d)?)/

function nameGuess(caption) {
  if (!caption) return ''
  const code = caption.match(CODE_AT_START)
  // first descriptive phrase, stopping at the first spec/colour/size marker
  const stop = caption.search(/(?:ผลิตจาก|มีสี|ขนาด|\(|\d[\d,]*\s*(?:฿|บาท))/)
  let head = stop > 0 ? caption.slice(0, stop) : caption
  head = head.replace(/\s+/g, ' ').trim()
  if (code && head.length >= code[1].length + 2) return head.slice(0, 80)
  if (!code && head.length >= 6 && thaiLen(head) + (head.match(/[A-Za-z]/g) || []).length >= 4) return head.slice(0, 80)
  return ''
}

/** Tokenise a page into ordered IMG / TEXT tokens. */
function tokens(html) {
  html = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
  const out = []
  const re = /<img\b[^>]*?\bsrc\s*=\s*"([^"]+)"[^>]*>/gi
  let last = 0, m
  while ((m = re.exec(html))) {
    const between = html.slice(last, m.index)
    if (between.trim()) out.push({ t: 'text', v: norm(between) })
    const alt = (m[0].match(/\balt\s*=\s*"([^"]*)"/i) || [])[1] || (m[0].match(/\btitle\s*=\s*"([^"]*)"/i) || [])[1] || ''
    out.push({ t: 'img', src: m[1], alt: decodeEntities(alt).trim() })
    last = re.lastIndex
  }
  const tail = html.slice(last)
  if (tail.trim()) out.push({ t: 'text', v: norm(tail) })
  return out
}

function loadCanonicalPages() {
  if (!fs.existsSync(SITEMAP_CSV)) return null
  const lines = fs.readFileSync(SITEMAP_CSV, 'utf8').split(/\r?\n/).slice(1).filter(Boolean)
  const real = new Set()
  for (const line of lines) {
    // file_path,page_type,is_empty,duplicate_of,...
    const c = line.split(',')
    const file = c[0]; const empty = c[2] === 'True'; const dup = c[3]
    if (!empty && !dup && !file.includes('/')) real.add(file)
  }
  return real
}

// ── main ──────────────────────────────────────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true })
const canonical = loadCanonicalPages()

const files = fs.readdirSync(PARSE_DIR).filter((f) => {
  if (!/\.html?$/i.test(f)) return false
  if (/(?:8836|823c|b015|4039)\.html?$/i.test(f)) return false   // HTTrack dup variants
  if (canonical) return canonical.has(f)
  return fs.statSync(path.join(PARSE_DIR, f)).size > 2000 && !/^index 1|^index jp|^index8836/i.test(f)
})

const blocks = []
const imagePages = new Map()   // image_filename → Set(source_file)

for (const file of files) {
  let html
  try { html = decode(path.join(PARSE_DIR, file)) } catch { continue }

  const srcUrl = (html.match(/Mirrored from ([^\s]+)/i) || [])[1] || ''
  const title = norm((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '')
  const [brand, model] = PAGE_CONTEXT[file] || ['', '']

  const toks = tokens(html)
  let order = 0
  for (let i = 0; i < toks.length; i++) {
    if (toks[i].t !== 'img') continue
    const src = toks[i].src
    if (IMG_JUNK.test(src) || /^https?:\/\//i.test(src)) continue   // skip chrome / remote
    order++

    // Candidate caption = the text directly below this image. If this image is
    // part of a run of consecutive images (a multi-photo product), the caption
    // sits under the LAST image of the run and is shared by the group.
    let cand = '', shared = false
    {
      let j = i + 1, skip = 0
      while (toks[j] && toks[j].t === 'img') { skip++; j++ }
      if (toks[j] && toks[j].t === 'text') { cand = toks[j].v; shared = skip > 0 }
    }
    const before = (toks[i - 1] && toks[i - 1].t === 'text') ? toks[i - 1].v : ''

    const rel = decodeURIComponent(src).replace(/\\/g, '/')
    const abs = path.resolve(IMG_DIR, rel)
    const onDisk = fs.existsSync(abs)
    const filename = rel.split('/').pop()

    // a real product caption carries a price, a product code, or "ผลิตจาก" (material)
    const cp = parsePrice(cand)
    const isProduct = cp.num !== null || CODE_AT_START.test(cand) || /ผลิตจาก/.test(cand)

    let confidence, caption = '', reasons = []
    if (!cand) { confidence = 'low'; reasons.push('no_caption_below_image') }
    else if (shared) {
      if (isProduct) { confidence = 'medium'; caption = cand; reasons.push('shared_caption_in_image_group') }
      else { confidence = 'low'; reasons.push('image_group_no_product_caption') }   // e.g. header banners
    }
    else if (isProduct) { confidence = 'high'; caption = cand }
    else { confidence = 'medium'; caption = cand; reasons.push('caption_without_price_code_or_material') }

    const price = parsePrice(caption)
    if (caption && price.num === null && confidence !== 'low') reasons.push('no_price_in_caption')
    if (!onDisk) reasons.push('image_not_on_disk')
    if (!brand && !model) reasons.push('no_model_context')

    blocks.push({
      id: file.replace(/\.html?$/i, '').replace(/[^A-Za-z0-9]+/g, '_') + '#' + String(order).padStart(3, '0'),
      source_file: file,
      source_url: srcUrl,
      page_title: title,
      brand_context: brand,
      model_context: model,
      image_src: src,
      image_local_path: onDisk ? path.relative(REPO_ROOT, abs).replace(/\\/g, '/') : '',
      image_filename: filename,
      image_alt: toks[i].alt,
      caption_raw: caption,
      text_before_image: before.slice(-160),
      product_name_guess: nameGuess(caption),
      description_raw: caption,
      raw_price_text: price.raw,
      price_number: price.num,
      currency: price.cur,
      page_order: order,
      confidence,
      review_reason: reasons.join('; '),
    })

    if (filename) {
      if (!imagePages.has(filename)) imagePages.set(filename, new Set())
      imagePages.get(filename).add(file)
    }
  }
}

// ── post-pass: tag template chrome (caption-less image repeated on many pages) ──
const pageCount = new Map([...imagePages].map(([fn, set]) => [fn, set.size]))
for (const blk of blocks) {
  blk.likely_template = blk.confidence === 'low' && (pageCount.get(blk.image_filename) || 0) >= 12
  if (blk.likely_template) blk.review_reason = (blk.review_reason ? blk.review_reason + '; ' : '') + 'likely_template_chrome'
}

// ── write product-blocks.json ──
fs.writeFileSync(path.join(OUT_DIR, 'product-blocks.json'), JSON.stringify(blocks, null, 2))

// ── write product-blocks.csv ──
const csvEsc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s }
const cols = ['id', 'source_file', 'source_url', 'brand_context', 'model_context', 'image_filename', 'image_local_path', 'product_name_guess', 'caption_raw', 'raw_price_text', 'price_number', 'currency', 'page_order', 'confidence', 'review_reason']
const csv = [cols.join(',')].concat(blocks.map((b) => cols.map((c) => csvEsc(b[c])).join(','))).join('\n')
fs.writeFileSync(path.join(OUT_DIR, 'product-blocks.csv'), '﻿' + csv)

// ── page-product-summary.md ──
const byPage = {}
for (const b of blocks) {
  const p = (byPage[b.source_file] ??= { total: 0, high: 0, medium: 0, low: 0, brand: b.brand_context, model: b.model_context })
  p.total++; p[b.confidence]++
}
const pageRows = Object.entries(byPage).sort((a, b) => b[1].total - a[1].total)
let md = '# Page → product-block summary\n\n'
md += `Parsed **${files.length}** pages → **${blocks.length}** image-caption blocks.\n\n`
md += '| Page | Brand | Model/Category | Blocks | high | medium | low |\n|---|---|---|--:|--:|--:|--:|\n'
for (const [file, s] of pageRows) md += `| ${file} | ${s.brand || '—'} | ${s.model || '—'} | ${s.total} | ${s.high} | ${s.medium} | ${s.low} |\n`
fs.writeFileSync(path.join(OUT_DIR, 'page-product-summary.md'), md)

// ── images-used-by-multiple-pages.md (NOT dedup — informational) ──
const shared = [...imagePages.entries()].filter(([, set]) => set.size > 1).sort((a, b) => b[1].size - a[1].size)
let im = '# Images appearing on multiple pages\n\n'
im += 'The same part photo can be valid on several model pages (shared fitment).\n'
im += 'These blocks are **kept separate** — each carries its own page context.\n\n'
im += `${shared.length} image files appear on more than one page.\n\n`
im += '| Image file | # pages | Pages |\n|---|--:|---|\n'
for (const [fn, set] of shared.slice(0, 200)) im += `| ${fn} | ${set.size} | ${[...set].join(', ')} |\n`
fs.writeFileSync(path.join(OUT_DIR, 'images-used-by-multiple-pages.md'), im)

// ── needs-review.md ──
const templateChrome = blocks.filter((b) => b.likely_template)
const review = blocks.filter((b) => b.confidence !== 'high' && !b.likely_template)
const reasonCount = {}
for (const b of review) for (const r of b.review_reason.split('; ').filter(Boolean)) reasonCount[r] = (reasonCount[r] || 0) + 1
let rv = '# Blocks needing manual review\n\n'
rv += `${review.length} blocks need a human look (medium/low confidence, excluding template chrome).\n`
rv += `${templateChrome.length} caption-less blocks were auto-tagged \`likely_template_chrome\` (header/sidebar images repeated across pages) and are NOT counted as products.\n\n`
rv += '## By reason\n\n| Reason | Count |\n|---|--:|\n'
for (const [r, n] of Object.entries(reasonCount).sort((a, b) => b[1] - a[1])) rv += `| ${r} | ${n} |\n`
rv += '\n## Medium-confidence blocks — caption present but no price/code (first 50)\n\n| id | page | image | caption |\n|---|---|---|---|\n'
for (const b of review.filter((b) => b.confidence === 'medium').slice(0, 50)) rv += `| ${b.id} | ${b.source_file} | ${b.image_filename} | ${b.caption_raw.slice(0, 60).replace(/\|/g, '/')} |\n`
rv += '\n## Low-confidence blocks — no caption directly below (likely extra product photos/angles) (first 50)\n\n| id | page | image | reason |\n|---|---|---|---|\n'
for (const b of review.filter((b) => b.confidence === 'low').slice(0, 50)) rv += `| ${b.id} | ${b.source_file} | ${b.image_filename} | ${b.review_reason} |\n`
fs.writeFileSync(path.join(OUT_DIR, 'needs-review.md'), rv)

// ── console summary ──
const c = { high: 0, medium: 0, low: 0 }
for (const b of blocks) c[b.confidence]++
console.log('\n✓ Parsed ' + files.length + ' pages → ' + blocks.length + ' image-caption blocks')
console.log('  parse dir: ' + PARSE_DIR)
console.log('  confidence — high: ' + c.high + '  medium: ' + c.medium + '  low: ' + c.low)
console.log('  with price: ' + blocks.filter((b) => b.price_number !== null).length)
console.log('  image on disk: ' + blocks.filter((b) => b.image_local_path).length)
console.log('  images shared across pages: ' + shared.length)
console.log('\n  → legacy-analysis/product-blocks.json | .csv')
console.log('  → legacy-analysis/page-product-summary.md')
console.log('  → legacy-analysis/images-used-by-multiple-pages.md')
console.log('  → legacy-analysis/needs-review.md\n')
