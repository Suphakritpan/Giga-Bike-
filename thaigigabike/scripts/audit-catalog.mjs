#!/usr/bin/env node
/**
 * audit-catalog.mjs — Model coverage auditor
 * -------------------------------------------
 * Reads legacy-products.json and generates:
 *   --before  →  out/model-coverage-before.json
 *   --after   →  out/model-coverage-after.json + out/model-coverage-diff.md
 *   (default)    same as --before
 *
 * Usage:
 *   node scripts/audit-catalog.mjs [--before | --after]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR   = path.resolve(__dirname, 'out')
const IN        = path.resolve(OUT_DIR, 'legacy-products.json')

const isAfter = process.argv.includes('--after')

// Expected source pages + image counts from the legacy site analysis
const EXPECTED_PAGES = {
  sr400:    { pages: ['SR.html'], note: 'SR400/500 — SR.html has mixed SRX/XT products too' },
  srx:      { pages: ['srx.html', 'yamaha srx.html', 'SR.html'], note: 'SRX only products in SR.html' },
  xs650:    { pages: ['xs650.html'], note: '' },
  xt500:    { pages: ['xt500.html', 'SR.html'], note: 'XT/TT500 products in SR.html' },
  tdr:      { pages: [], note: 'TDR220 — no dedicated page found, check keyword in all pages' },
  r15:      { pages: ['R15_XSR.html', 'XSR.html', 'YAMAHA.html'], note: 'R15/XSR155/XMAX300' },
  r3:       { pages: ['R3.html', 'YAMAHA.html'], note: 'R3/MT-03/R25' },
  r1:       { pages: ['R1_R6.html', 'R9-R7.html', 'YAMAHA.html'], note: 'R1/R6/R7' },
  cb750:    { pages: ['CB750k.html'], note: '' },
  gb400:    { pages: ['honda_GB250_400.html', 'honda gb250-400.html', 'honda cb400ss.html', 'honda.html'], note: '' },
  nc35:     { pages: ['NC35.html', 'Honda nc35.html', 'honda.html'], note: 'NC30/NC35/CB1300' },
  cbr250:   { pages: ['CB150r.html', 'CBR150r_CBR250rr.html', 'honda.html'], note: 'CBR150R/250RR/300' },
  cbr600:   { pages: ['honda.html'], note: 'CBR600RR/1000RR — keyword-only' },
  monkey:   { pages: ['Monkey_msx125.html', 'msx125.html', 'honda msx125.html', 'honda.html'], note: 'Monkey/MSX125/DAX125' },
  nsr150:   { pages: ['2T.html', 'honda.html'], note: 'NSR150SP/Dash 2T' },
  w650:     { pages: ['w650.html', 'kawasaki w650.html'], note: '' },
  estrella: { pages: ['Estrella250.html'], note: '' },
  ksr:      { pages: ['KSR110.html', 'kawazaki ksr.html', 'kawasaki.html'], note: 'KSR110/KR150' },
  ninja250: { pages: ['Ninja250_300_Ninja400.html', 'Ninja300.html', 'kawasaki.html'], note: 'Ninja250/300/400/ZX250R' },
  zx10:     { pages: ['Ninjazx10rr.html', 'kawasaki.html'], note: 'Ninja ZX-10RR' },
  tempter:  { pages: ['Tempter400.html', 'suzuki.html'], note: 'Tempter400' },
  volty:    { pages: ['suzuki.html'], note: 'Volty250 — keyword-only' },
  thruxton: { pages: ['triumph_Truxton900.html'], note: 'Thruxton900/T100/T120' },
  daytona675: { pages: ['triumph_Truxton900.html'], note: 'Daytona 675 — keyword-only' },
  s1000rr:  { pages: ['BMW.html'], note: 'BMW S1000RR' },
  interceptor: { pages: ['RoyalEnfield_GT500.html'], note: '' },
  monster:  { pages: ['ducati_Monter795.html'], note: 'Monster795/796/Hyper821' },
  panigale: { pages: ['ducati_Monter795.html'], note: 'Panigale V4R — keyword-only' },
  ducati_diavel:    { pages: [], note: '' },
  ducati_scrambler: { pages: [], note: '' },
  hd883:    { pages: ['HD.html', 'Sportter.html'], note: 'Sportster 883-1200' },
  centaur:  { pages: ['Stallions.html'], note: 'Centaur 150' },
  rc390:    { pages: ['KTM-RC390.html'], note: 'RC390' },
}

if (!fs.existsSync(IN)) {
  console.error('✗ legacy-products.json not found. Run: node scripts/import-legacy.mjs')
  process.exit(1)
}

const products = JSON.parse(fs.readFileSync(IN, 'utf8'))

// Count products per model
const byModel = {}
for (const [id] of Object.entries(EXPECTED_PAGES)) byModel[id] = 0
for (const p of products) {
  for (const m of p.bikeModels) {
    if (byModel[m] !== undefined) byModel[m]++
    // else don't count unknown model ids
  }
}

// Count products per source page
const byPage = {}
for (const p of products) {
  for (const sp of p.sourcePages) {
    byPage[sp] = (byPage[sp] || 0) + 1
  }
}

// Build coverage records
const coverage = Object.entries(EXPECTED_PAGES).map(([model_id, info]) => {
  const count = byModel[model_id] || 0
  const pageProducts = info.pages.reduce((sum, pg) => sum + (byPage[pg] || 0), 0)
  const suspicious = []
  if (count === 0 && info.pages.length > 0) suspicious.push('ZERO products despite expected pages')
  if (count > 0 && count < 3) suspicious.push('very few products: ' + count)
  return {
    model_id,
    model_label: info.note || model_id,
    brand: getBrand(model_id),
    current_product_count: count,
    expected_source_pages: info.pages,
    imported_product_count_from_source_pages: pageProducts,
    suspicious_notes: suspicious,
    missing_notes: count === 0 ? ['No products found — check source HTML or keyword rules'] : [],
  }
})

function getBrand(id) {
  if (['sr400','srx','xs650','xt500','tdr','r15','r3','r1'].includes(id)) return 'Yamaha'
  if (['cb750','gb400','nc35','cbr250','cbr600','monkey','nsr150'].includes(id)) return 'Honda'
  if (['w650','estrella','ksr','ninja250','zx10'].includes(id)) return 'Kawasaki'
  if (['tempter','volty'].includes(id)) return 'Suzuki'
  if (['thruxton','daytona675'].includes(id)) return 'Triumph'
  if (['s1000rr'].includes(id)) return 'BMW'
  if (['interceptor'].includes(id)) return 'Royal Enfield'
  if (['monster','panigale','ducati_diavel','ducati_scrambler'].includes(id)) return 'Ducati'
  if (['hd883'].includes(id)) return 'Harley-Davidson'
  if (['centaur'].includes(id)) return 'Stallions'
  if (['rc390'].includes(id)) return 'KTM'
  return 'Unknown'
}

const label = isAfter ? 'after' : 'before'
const outFile = path.resolve(OUT_DIR, `model-coverage-${label}.json`)
const out = {
  generatedAt: new Date().toISOString(),
  label,
  total_products: products.length,
  with_fitment: products.filter(p => p.bikeModels.length > 0).length,
  without_fitment: products.filter(p => p.bikeModels.length === 0).length,
  coverage,
  page_product_counts: Object.fromEntries(
    Object.entries(byPage).sort((a, b) => b[1] - a[1])
  ),
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 2))
console.log(`✓ Written: ${outFile}`)

if (isAfter) {
  const beforeFile = path.resolve(OUT_DIR, 'model-coverage-before.json')
  if (!fs.existsSync(beforeFile)) {
    console.log('⚠ model-coverage-before.json not found — skipping diff')
  } else {
    const before = JSON.parse(fs.readFileSync(beforeFile, 'utf8'))
    const beforeMap = Object.fromEntries(before.coverage.map(c => [c.model_id, c]))
    const afterMap  = Object.fromEntries(out.coverage.map(c => [c.model_id, c]))

    // Models sorted by brand then model_id
    const allModels = [...new Set([...before.coverage, ...out.coverage].map(c => c.model_id))]

    const lines = [
      '# Model Coverage Diff — Before vs After',
      '',
      `**Before:** ${before.total_products} total products, ${before.with_fitment} with fitment, ${before.without_fitment} without fitment`,
      `**After:**  ${out.total_products} total products, ${out.with_fitment} with fitment, ${out.without_fitment} without fitment`,
      `**Net change:** ${out.total_products - before.total_products > 0 ? '+' : ''}${out.total_products - before.total_products} products`,
      '',
      '## Per-Model Changes',
      '',
      '| Model | Brand | Before | After | Change | Notes |',
      '|---|---|--:|--:|--:|---|',
    ]

    for (const mid of allModels) {
      const b = beforeMap[mid]?.current_product_count ?? 0
      const a = afterMap[mid]?.current_product_count ?? 0
      const diff = a - b
      const diffStr = diff === 0 ? '=' : (diff > 0 ? '+' + diff : diff.toString())
      const flag = a === 0 ? '⚠ STILL ZERO' : (diff > 0 ? '✓ increased' : diff < 0 ? '▼ decreased' : '')
      lines.push(`| ${mid} | ${afterMap[mid]?.brand ?? beforeMap[mid]?.brand ?? '?'} | ${b} | ${a} | ${diffStr} | ${flag} |`)
    }

    lines.push('', '## Source Pages with High Image Count but Low Import')
    lines.push('')
    const suspiciousPages = [
      { page: 'SR.html', images: 393 },
      { page: 'xt500.html', images: 39 },
      { page: 'R15_XSR.html', images: 79 },
      { page: 'Sprocket_Alloys.html', images: 136 },
      { page: 'YAMAHA.html', images: 87 },
      { page: 'BMW.html', images: 31 },
      { page: 'ducati_Monter795.html', images: 77 },
      { page: 'HD.html', images: 94 },
      { page: 'Stallions.html', images: 50 },
      { page: 'KTM-RC390.html', images: 45 },
      { page: 'suzuki.html', images: 37 },
      { page: 'honda.html', images: 75 },
      { page: 'kawasaki.html', images: 58 },
    ]
    lines.push('| Page | Images in HTML | Products Imported (after) |')
    lines.push('|---|--:|--:|')
    for (const { page, images } of suspiciousPages) {
      const n = out.page_product_counts[page] ?? 0
      const flag = n === 0 ? ' ⚠' : (n < images / 6 ? ' (low)' : '')
      lines.push(`| ${page} | ${images} | ${n}${flag} |`)
    }

    lines.push('', '## Products Still Needing Manual Review')
    lines.push('')
    const reviewProducts = products.filter(p => p.needs_review)
    lines.push(`Total: ${reviewProducts.length} products need manual review`)
    const reasonTally = {}
    for (const p of reviewProducts) for (const r of p.review_reasons) reasonTally[r] = (reasonTally[r]||0)+1
    for (const [r, n] of Object.entries(reasonTally).sort((a,b)=>b[1]-a[1])) {
      lines.push(`- ${r}: ${n}`)
    }

    lines.push('', '## How to Re-run Import')
    lines.push('')
    lines.push('```bash')
    lines.push('cd thaigigabike')
    lines.push('npm run import:legacy   # parse HTML → legacy-products.json')
    lines.push('npm run build:catalog   # generate products.generated.ts + SQL')
    lines.push('npm run audit:catalog   # regenerate after report')
    lines.push('```')

    const diffPath = path.resolve(OUT_DIR, 'model-coverage-diff.md')
    fs.writeFileSync(diffPath, lines.join('\n') + '\n')
    console.log('✓ Written: ' + diffPath)
  }
}

console.log(`\nSummary (${label}):`)
console.log(`  Total: ${out.total_products}  With fitment: ${out.with_fitment}  Without fitment: ${out.without_fitment}`)
const zeros = out.coverage.filter(c => c.current_product_count === 0)
if (zeros.length) console.log(`  Models with 0 products: ${zeros.map(c => c.model_id).join(', ')}`)
