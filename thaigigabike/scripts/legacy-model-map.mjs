/**
 * legacy-model-map.mjs — Central model mapping config for legacy import
 * ----------------------------------------------------------------------
 * Two-tier system:
 *   PAGE_ALWAYS    : all products from the page inherit these models
 *   KEYWORD_RULES  : applies to every product from ANY page —
 *                    if the product text contains any listed keyword,
 *                    that model is added to the product's bikeModels.
 *
 * Brand pages (honda.html, YAMAHA.html, etc.) are NOT in PAGE_ALWAYS.
 * Their products get fitment ONLY via keyword matching.
 *
 * IMPORTANT: Do NOT add speculative mappings. Every rule here must be
 * backed by the actual HTML source in HTTrack My Web Sites/.
 */

// ── Typo / alias normalization ────────────────────────────────────
// Applied to description text before keyword matching.
// [wrong_form, canonical_form]
export const TYPO_MAP = [
  ['Temtepr',  'Tempter'],
  ['Vorty',    'Volty'],
  ['Sportter', 'Sportster'],
  ['Harlay',   'Harley'],    // HD Harlay Davidson → Harley Davidson
  ['Truxton',  'Thruxton'],
  ['Monter',   'Monster'],   // ducati Monter795 → Monster795
  ['Centoue',  'Centaur'],   // Stallions Centoue150 → Centaur150
  ['MT03',     'MT-03'],
  ['CB400 ss', 'CB400SS'],
  ['CBR 150',  'CBR150'],
  ['CBR 250',  'CBR250'],
  ['CBR 300',  'CBR300'],
  ['ZX250 R',  'ZX250R'],
]

// ── PAGE_ALWAYS ───────────────────────────────────────────────────
// All products from the listed page unconditionally get these models.
// Only use for dedicated single-model pages.
export const PAGE_ALWAYS = {
  // Yamaha SR400/500
  'SR.html':           ['sr400'],
  'SR f853.html':      ['sr400'],  // SR variant/accessories page
  'swingarmsr.html':   ['sr400'],  // SR swingarm showcase

  // Yamaha SRX400-600
  'srx.html':          ['srx'],
  'yamaha srx.html':   ['srx'],
  'XSR.html':          ['r15'],    // XSR155 page, mapped to r15 group

  // Yamaha XS650
  'xs650.html':        ['xs650'],

  // Yamaha XT/TT500
  'xt500.html':        ['xt500'],

  // Yamaha R15/XSR155/XMAX300
  'R15_XSR.html':      ['r15'],

  // Yamaha R3/MT-03/R25
  'R3.html':           ['r3'],

  // Yamaha R1/R6/R7
  'R1_R6.html':        ['r1'],
  'R9-R7.html':        ['r1'],

  // Honda CB750
  'CB750k.html':       ['cb750'],

  // Honda GB250/400/CB400SS
  'honda_GB250_400.html': ['gb400'],
  'honda gb250-400.html': ['gb400'],
  'honda cb400ss.html':   ['gb400'],

  // Honda NC30/NC35/CB1300
  'NC35.html':         ['nc35'],
  'Honda nc35.html':   ['nc35'],

  // Honda CBR150R/250RR/300
  'CBR150r_CBR250rr.html': ['cbr250'],
  'CB150r.html':           ['cbr250'],

  // Honda Monkey/MSX125/DAX125
  'Monkey_msx125.html': ['monkey'],
  'msx125.html':         ['monkey'],
  'honda msx125.html':   ['monkey'],

  // Honda NSR150SP/Dash 2T
  '2T.html':           ['nsr150'],

  // Kawasaki W650/W800
  'w650.html':         ['w650'],
  'kawasaki w650.html': ['w650'],

  // Kawasaki Estrella250
  'Estrella250.html':  ['estrella'],

  // Kawasaki KSR110/KR150
  'KSR110.html':       ['ksr'],
  'kawazaki ksr.html': ['ksr'],

  // Kawasaki Ninja250/300/400/ZX250R
  'Ninja250_300_Ninja400.html': ['ninja250'],
  'Ninja300.html':     ['ninja250'],

  // Kawasaki Ninja ZX-10RR
  'Ninjazx10rr.html':  ['zx10'],

  // Suzuki Tempter400
  'Tempter400.html':   ['tempter'],

  // Triumph Thruxton900/T100/T120
  'triumph_Truxton900.html': ['thruxton'],

  // Royal Enfield
  'RoyalEnfield_GT500.html': ['interceptor'],

  // Harley-Davidson Sportter.html (dedicated Sportster page)
  'Sportter.html':     ['hd883'],

  // Part / category pages — real products, fitment varies / universal
  'Ohlins.html':         [],
  'Sprocket_Alloys.html': [],
  'Sprocket Alloys.html': [],
  'Bolts-nut.html':      [],
  'Seat.html':           [],
  'carburetor.html':     [],
  'nunber part.html':    [],
}

// ── KEYWORD_RULES ─────────────────────────────────────────────────
// Applied to EVERY product from ANY page.
// Order matters for disambiguation — more specific entries first.
// Keyword matching is case-insensitive after TYPO_MAP is applied.
export const KEYWORD_RULES = [
  // ── Yamaha ─────────────────────────────────────
  // SRX must come before SR so "SRX400" hits srx not sr400
  { model: 'srx',   keywords: ['SRX400', 'SRX600', 'SRX'] },
  // XT500/TT500 — use full forms to avoid short-match noise
  { model: 'xt500', keywords: ['XT500', 'TT500', 'XT/TT500'] },
  // TDR220
  { model: 'tdr',   keywords: ['TDR220', 'TDR'] },
  // R15/XSR155/XMAX300 — 'R15' alone is safe in Thai bike context
  { model: 'r15',   keywords: ['XSR155', 'XMAX300', 'XMAX 300', 'XMAX', 'R15 ', ' R15', 'R15/'] },
  // R3/MT-03/R25
  { model: 'r3',    keywords: ['MT-03', 'MT03', 'R25 ', ' R25', 'R25/', 'R3 ', ' R3', 'R3/'] },
  // R1/R6/R7 — space-fenced to avoid matching R10/R16/R17 etc.
  { model: 'r1',    keywords: ['YZF-R1', 'YZF-R6', 'YZF-R7', 'R1 ', ' R1', 'R1/', 'R6 ', ' R6', 'R6/', 'R7 ', ' R7', 'R7/'] },

  // ── Honda ──────────────────────────────────────
  // GB250/400/CB400SS — these are specific enough
  { model: 'gb400',   keywords: ['GB250', 'GB400', 'CB400SS', 'CB400 SS', 'CB400ss'] },
  // NC30/NC35/CB1300
  { model: 'nc35',    keywords: ['NC30', 'NC35', 'CB1300'] },
  // CBR150R/250RR/300 — use full forms
  { model: 'cbr250',  keywords: ['CBR150R', 'CBR150 R', 'CBR250RR', 'CBR250 RR', 'CBR250', 'CBR300', 'CB150R', 'CB150 R'] },
  // CBR600RR/1000RR
  { model: 'cbr600',  keywords: ['CBR600RR', 'CBR1000RR', 'CBR600', 'CBR1000'] },
  // Monkey/MSX125/DAX125
  { model: 'monkey',  keywords: ['MSX125', 'MSX 125', 'DAX125', 'DAX 125', 'Monkey125', 'Monkey 125'] },
  // NSR150SP/Dash 2T — '2T' alone is too short, use phrases
  { model: 'nsr150',  keywords: ['NSR150SP', 'NSR150', 'Dash 2T', 'Dash125', 'Dash 125', 'NSR 150'] },

  // ── Kawasaki ───────────────────────────────────
  // KSR110/KR150
  { model: 'ksr',     keywords: ['KSR110', 'KSR 110', 'KR150', 'KR 150'] },
  // Ninja250/300/400/ZX250R — ZX250R before ZX10 to avoid overlap
  { model: 'ninja250', keywords: ['ZX250R', 'ZX250 R', 'Ninja250', 'Ninja300', 'Ninja400', 'Ninja 250', 'Ninja 300', 'Ninja 400'] },
  // ZX-10RR
  { model: 'zx10',    keywords: ['ZX-10RR', 'ZX10RR', 'ZX10 RR', 'Ninja ZX10', 'Ninja ZX-10'] },

  // ── Suzuki ─────────────────────────────────────
  // Tempter400 — 'Tempter' and its common misspelling
  { model: 'tempter', keywords: ['Tempter400', 'Tempter 400', 'Tempter', 'Temtepr'] },
  // Volty250
  { model: 'volty',   keywords: ['Volty250', 'Volty 250', 'Volty', 'Vorty250', 'Vorty 250', 'Vorty'] },

  // ── Triumph ────────────────────────────────────
  // Daytona675 — use 'Daytona' as primary keyword (not bare '675')
  { model: 'daytona675', keywords: ['Daytona675', 'Daytona 675', 'Daytona'] },
  // Thruxton (Truxton is a common misspelling, handled by TYPO_MAP)
  { model: 'thruxton', keywords: ['Thruxton', 'Truxton'] },

  // ── BMW ────────────────────────────────────────
  { model: 's1000rr', keywords: ['S1000RR', 'S1000 RR', 'S1000'] },

  // ── Ducati ─────────────────────────────────────
  // Panigale before Monster to catch V4R
  { model: 'panigale', keywords: ['Panigale', 'V4R'] },
  // Monster795/796/Hyper821 — 'Monter' normalized to 'Monster' by TYPO_MAP
  { model: 'monster',  keywords: ['Monster795', 'Monster796', 'Monster 795', 'Monster 796', 'Hyper821', 'Hyper 821', 'Hypermotard'] },

  // ── Harley-Davidson ────────────────────────────
  // 'Sportter' normalized by TYPO_MAP; 'Harlay' normalized to 'Harley' by TYPO_MAP
  { model: 'hd883', keywords: ['Sportster883', 'Sportster1200', 'Sportster 883', 'Sportster 1200', 'Sportster', 'Harley', 'HD sporter', 'HD Sporster'] },

  // ── Stallions ──────────────────────────────────
  // 'Centoue' normalized to 'Centaur' by TYPO_MAP before matching
  { model: 'centaur', keywords: ['Centaur150', 'Centaur 150', 'Centaur', 'Stallions', 'Centoue150', 'Centoue 150', 'Centoue'] },

  // ── KTM ────────────────────────────────────────
  { model: 'rc390', keywords: ['RC390', 'RC 390', 'KTM RC', 'KTM'] },

  // ── Ducati sub-models (supplement, after Monster/Panigale rules above) ──
  { model: 'monster',          keywords: ['M795', 'M796', 'M 795', 'M 796'] },
  { model: 'ducati_scrambler', keywords: ['Ducati Scrambler', 'ducati Scrambler'] },
  { model: 'ducati_diavel',    keywords: ['Ducati diavel', 'Ducati Diavel', 'ducati diavel'] },

  // ── Honda CB650F / CBR650R ──────────────────────
  { model: 'cbr650r', keywords: ['CB650F', 'CB650 F', 'CBR650R', 'CBR650F', 'CBR650 R'] },
]

// ── SKIP_PAGES (supplement) ───────────────────────────────────────
// Pages that are purely informational / navigation — skip on import.
// Merged with the SKIP_PAGES Set in import-legacy.mjs.
export const EXTRA_SKIP_PAGES = new Set([
  'swingarmsr.html',         // single product showcase, duplicated in SR.html
  'tripsrthailandcc5a.html', // trip report
  'Racing.html',             // already in base SKIP_PAGES but listed here for clarity
  'Racing Tame.html',
  // index pages — these are navigation pages, not product pages
  'index HD.html',
  'index ducati.html',
  'index triumph.html',
])
