#!/usr/bin/env node
/**
 * build-catalog.mjs — Stage 2 of the legacy migration
 * ----------------------------------------------------
 * Turns the extracted `out/legacy-products.json` into app-ready data:
 *
 *   1. src/data/products.generated.ts  — Product[] (all 822, published flag)
 *   2. supabase-products.sql           — products table DDL + seed
 *   3. public/legacy/**                — copies of every referenced product photo
 *
 * Incomplete (needs_review) products are imported as `published: false`
 * (draft) so the admin can finish them; the storefront hides them.
 *
 * Run AFTER import-legacy.mjs:
 *   node scripts/import-legacy.mjs && node scripts/build-catalog.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(APP_ROOT, '..')
const MIRROR = path.resolve(REPO_ROOT, 'HTTrack My Web Sites', 'Giga-Bike-', 'www.thaigigabike.com')

const IN = path.resolve(__dirname, 'out', 'legacy-products.json')
const OUT_TS = path.resolve(APP_ROOT, 'src', 'data', 'products.generated.ts')
const OUT_SQL = path.resolve(APP_ROOT, 'supabase', 'products-seed.sql')
const PUBLIC_LEGACY = path.resolve(APP_ROOT, 'public', 'legacy')

// Curated English copy for the flagship products (legacy site is Thai-only).
// These are also force-featured on the home page.
const CURATED = {
  'G.232': { name: 'Custom Brake Disc SR 310mm.', description: 'Custom brake disc for SR 2001–2022, 310mm diameter. Genuine Sunstar rotor with CNC billet alloy spider. Multiple pin colours.', featured: true },
  'G.88':  { name: 'Aluminium Swingarm SR Type 3', description: 'Direct-fit aluminium swingarm for Yamaha SR. Complete kit with rear axle, bushings, shock bushings, bolts and bearings. Track-tested.', featured: true },
  'G.252': { name: 'Clear Lens Clutch Cover SR400/500', description: 'Clear-lens clutch cover for SR400/500. CNC billet alloy with a transparent window.', featured: true },
  'G.248': { name: 'Aluminium Cylinder Block SR400/500', description: 'Aluminium cylinder block for SR400/500. Stock-bore compatible, borable to 100mm+, handles high compression without cracking.', featured: true },
  'G.190': { name: 'Triple Clamp Set SR + Ohlins 43mm', description: 'Triple-clamp set with bar clamps for SR + Ohlins FG433/621 43mm forks. Direct fit, black hard-anodize guaranteed not purple.', featured: true },
}

// ── helpers ───────────────────────────────────────────────────────
function makeIdFactory() {
  const used = new Set()
  return (rec) => {
    let base
    if (rec.code) {
      base = rec.code.toLowerCase().replace(/[^a-z0-9]+/g, '')
    } else {
      const first = rec.images[0] || rec.id
      const stem = (first.split('/').pop() || rec.id).replace(/\.[a-z0-9]+$/i, '')
      base = 'lg-' + stem.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
    }
    if (!base) base = 'lg-item'
    let id = base, n = 2
    while (used.has(id)) id = base + '-' + n++
    used.add(id)
    return id
  }
}

function toAppProduct(rec, nextId) {
  const cur = rec.code ? CURATED[rec.code] : undefined
  const published = !rec.needs_review
  return {
    id: nextId(rec),
    code: rec.code ?? '',
    name: cur?.name || rec.name || rec.name_th || rec.code || '',
    nameTh: rec.name_th || rec.description_th.slice(0, 70) || rec.code || '',
    price: rec.price ?? 0,
    category: rec.category || 'accessories',
    bikeModels: rec.bikeModels,
    colors: rec.colors,
    inStock: rec.inStock,
    stockCount: rec.inStock ? 10 : 0,
    material: rec.material || '',
    // EN description falls back to the real Thai text until translated
    description: cur?.description || rec.description_th || '',
    descriptionTh: rec.description_th || '',
    images: rec.images.map((src) => '/legacy/' + src),
    featured: Boolean(cur?.featured),
    published,
    reviewReasons: rec.review_reasons,
  }
}

// ── load + transform ──────────────────────────────────────────────
if (!fs.existsSync(IN)) {
  console.error('✗ ' + IN + ' not found. Run: node scripts/import-legacy.mjs')
  process.exit(1)
}
const legacy = JSON.parse(fs.readFileSync(IN, 'utf8'))
const nextId = makeIdFactory()
const items = legacy.map((r) => toAppProduct(r, nextId))

// never feature a product with no photo (placeholder cards look broken)
for (const p of items) if (p.featured && p.images.length === 0) p.featured = false
// fill the featured row up to 8 with the priciest published, image-bearing items
const featuredCount = items.filter((p) => p.featured).length
if (featuredCount < 8) {
  items
    .filter((p) => !p.featured && p.published && p.images.length > 0 && p.price > 0)
    .sort((a, b) => b.price - a.price)
    .slice(0, 8 - featuredCount)
    .forEach((p) => { p.featured = true })
}

// ── 1. products.generated.ts ──────────────────────────────────────
const banner = `// AUTO-GENERATED by scripts/build-catalog.mjs — do not edit by hand.
// Source: legacy thaigigabike.com mirror → scripts/out/legacy-products.json
// Regenerate: node scripts/import-legacy.mjs && node scripts/build-catalog.mjs
import type { Product } from './products'

export const legacyProducts: Product[] = `
fs.writeFileSync(OUT_TS, banner + JSON.stringify(items, null, 2) + '\n')

// ── 2. supabase-products.sql ──────────────────────────────────────
const q = (v) => "'" + String(v).replace(/'/g, "''") + "'"
const jb = (v) => "'" + JSON.stringify(v).replace(/'/g, "''") + "'::jsonb"
const ddl = `-- ===================================================
-- GigaBike — products table (run in Supabase SQL Editor)
-- Seeded from the legacy site import (${items.length} products).
-- ===================================================
CREATE TABLE IF NOT EXISTS products (
  id              TEXT PRIMARY KEY,
  code            TEXT,
  name            TEXT,
  name_th         TEXT,
  price           INTEGER NOT NULL DEFAULT 0,
  category        TEXT,
  bike_models     JSONB   NOT NULL DEFAULT '[]',
  colors          JSONB   NOT NULL DEFAULT '[]',
  in_stock        BOOLEAN NOT NULL DEFAULT TRUE,
  stock_count     INTEGER NOT NULL DEFAULT 0,
  material        TEXT,
  description     TEXT,
  description_th  TEXT,
  images          JSONB   NOT NULL DEFAULT '[]',
  featured        BOOLEAN NOT NULL DEFAULT FALSE,
  published       BOOLEAN NOT NULL DEFAULT TRUE,
  review_reasons  JSONB   NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Safe to re-run on a pre-existing products table that was created by an
-- earlier setup and is missing newer columns (e.g. published / review_reasons).
ALTER TABLE products ADD COLUMN IF NOT EXISTS code           TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS name           TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_th        TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price          INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category       TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS bike_models    JSONB   NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors         JSONB   NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS in_stock       BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_count    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS material       TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description    TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_th TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images         JSONB   NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured       BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS published      BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_reasons JSONB   NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at     TIMESTAMPTZ DEFAULT NOW();

-- Older setups created the array columns as text[]; convert them to jsonb so the
-- jsonb seed below type-checks. No-op when they are already jsonb.
DO $$
DECLARE
  col text;
  cur text;
BEGIN
  FOREACH col IN ARRAY ARRAY['bike_models','colors','images','review_reasons']
  LOOP
    SELECT data_type INTO cur FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = col;
    IF cur = 'ARRAY' THEN
      EXECUTE format('ALTER TABLE products ALTER COLUMN %I DROP DEFAULT', col);
      EXECUTE format('ALTER TABLE products ALTER COLUMN %I TYPE jsonb USING to_jsonb(%I)', col, col);
      EXECUTE format('ALTER TABLE products ALTER COLUMN %I SET DEFAULT ''[]''::jsonb', col);
    END IF;
  END LOOP;
END $$;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- Security policies are managed in supabase-setup.sql (run it after this seed).
-- Remove any stale broad policy that may remain from earlier runs.
DROP POLICY IF EXISTS "Public read products" ON products;

`
const cols = '(id, code, name, name_th, price, category, bike_models, colors, in_stock, stock_count, material, description, description_th, images, featured, published, review_reasons)'
const values = items.map((p) =>
  '(' + [
    q(p.id), q(p.code), q(p.name), q(p.nameTh), p.price, q(p.category),
    jb(p.bikeModels), jb(p.colors), p.inStock, p.stockCount, q(p.material),
    q(p.description), q(p.descriptionTh), jb(p.images), p.featured, p.published,
    jb(p.reviewReasons ?? []),
  ].join(', ') + ')'
).join(',\n')
fs.writeFileSync(OUT_SQL, ddl + 'INSERT INTO products\n' + cols + '\nVALUES\n' + values + '\nON CONFLICT (id) DO NOTHING;\n')

// ── 3. copy referenced images → public/legacy ─────────────────────
const srcs = new Set()
for (const r of legacy) for (const s of r.images) srcs.add(s)
let copied = 0, missing = 0
for (const rel of srcs) {
  const src = path.resolve(MIRROR, rel)
  const dest = path.resolve(PUBLIC_LEGACY, rel)
  if (!fs.existsSync(src)) { missing++; continue }
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
  copied++
}

// ── summary ───────────────────────────────────────────────────────
const published = items.filter((p) => p.published).length
console.log('\n✓ Catalog built from ' + items.length + ' products')
console.log('  published (storefront): ' + published + '   draft (admin only): ' + (items.length - published))
console.log('  featured on home: ' + items.filter((p) => p.featured).length)
console.log('  images copied → public/legacy: ' + copied + (missing ? '   (missing on disk: ' + missing + ')' : ''))
console.log('\n  → src/data/products.generated.ts')
console.log('  → supabase-products.sql')
console.log('  → public/legacy/**\n')
