# Legacy import pipeline

`import-legacy.mjs` parses the **locally mirrored** old website
(`thaigigabike.com`, captured with HTTrack, `tis-620` / `windows-874` encoded)
and extracts **real** product data into structured JSON + CSV.

It reads local files only — it never touches the live site — and it **never
invents data**. Missing prices, codes, specs or images are left blank and the
product is flagged `needs_review` with the exact reason(s).

## Run

```bash
node scripts/import-legacy.mjs ["<path to mirror www dir>"]
```

Default mirror path (relative to repo root):

```
../HTTrack My Web Sites/Giga-Bike-/www.thaigigabike.com
```

Outputs are written to `scripts/out/`:

| File | What |
|------|------|
| `legacy-products.json` | full structured records |
| `legacy-products.csv`  | flat review sheet (UTF-8 BOM, opens in Excel) |
| `legacy-report.json`   | coverage / quality summary |

## How it parses

Each product on the old Tarad.com template is laid out as:

```
[image][image]  <CODE?>  <Thai description …>  <price ฿>
```

The parser flattens each page to a linear text stream (with inline image
markers), then walks it: an **image or code opens** a product block and its
**price closes** it. The SKU **code is optional** — many sport-bike pages
(R3, Ninja, R1 …) list real products with photo + description + price but no
code; those are captured and flagged `no_code` rather than dropped.

Products are de-duplicated across pages by code (or, for code-less blocks, by
their first product photo), unioning bike-model fitment and images.

## Record schema (`legacy-products.json`)

```jsonc
{
  "id": "G.232",                 // SKU code, or "IMG#<photo>" for code-less blocks
  "code": "G.232",              // null when the legacy page had no SKU
  "name_th": "…",               // short name derived from the description (not invented)
  "name": "",                   // EN name — not present on the legacy site (see needs_translation)
  "description_th": "…",        // full Thai description as written on the page
  "price": 6000,                // baht, or null
  "category": "brake",          // inferred from Thai keywords; "" when unknown
  "bikeModels": ["sr400"],      // from the page(s) the product was listed on
  "colors": ["black","gold"],   // only when "มีสี (…)" was present
  "material": "Alloy 6061 …",   // only when "ผลิตจาก …" was present
  "images": ["webgigabike.com/…/brake.jpg"],  // local paths that exist on disk
  "missingImageFiles": 0,       // referenced images not found in the mirror
  "inStock": true,              // false when marked ของหมด / Sold
  "sourcePages": ["SR.html"],
  "needs_review": false,
  "review_reasons": [],
  "needs_translation": true     // EN name/description still to be written
}
```

## `review_reasons`

| Reason | Meaning |
|--------|---------|
| `no_code` | Legacy page listed no SKU for this product |
| `no_price` | No price found |
| `no_image` | No product photo found on disk |
| `short_description` | Description too short / empty |
| `no_category` | Thai keywords didn't match a known category |
| `no_fitment` | Not tied to a bike model (e.g. universal hardware page) |
| `price_conflict` | Same product showed different prices across pages |

## Assumptions / limitations

- A product listed on a model page is assumed to **fit that model**. Shared
  parts inherit every page they appear on.
- `category`, `name_th`, `colors`, `material` are **derived from the real Thai
  text**, not authoritative source fields — review before publishing.
- English names/descriptions do not exist on the legacy site (`needs_translation`).
- Page → bike-model mapping lives in `PAGE_MODELS` at the top of the script;
  add entries there if more pages are mirrored later.
