import { legacyProducts } from './products.generated'

export type Product = {
  id: string
  code: string
  name: string
  nameTh: string
  price: number
  category: string
  bikeModels: string[]
  colors: string[]
  inStock: boolean
  stockCount: number
  material: string
  description: string
  descriptionTh: string
  images: string[]
  featured: boolean
  /** false = hidden from the storefront (incomplete legacy import, draft). */
  published: boolean
  /** why this item still needs human review (empty when complete). */
  reviewReasons?: string[]
}

export type Category = {
  id: string
  name: string
  nameTh: string
  icon: string
}

export type BikeModel = {
  id: string
  brand: string
  model: string
}

export const categories: Category[] = [
  { id: 'brake', name: 'Brakes', nameTh: 'เบรค', icon: 'disc' },
  { id: 'engine', name: 'Engine', nameTh: 'เครื่องยนต์', icon: 'settings' },
  { id: 'suspension', name: 'Suspension', nameTh: 'โช๊ค/แผงคอ', icon: 'activity' },
  { id: 'chassis', name: 'Chassis', nameTh: 'ตัวถัง', icon: 'tool' },
  { id: 'drivetrain', name: 'Drivetrain', nameTh: 'สเตอร์/โซ่', icon: 'link' },
  { id: 'hardware', name: 'Bolts & Nuts', nameTh: 'น็อต/สกรู', icon: 'bolt' },
  { id: 'accessories', name: 'Accessories', nameTh: 'อุปกรณ์เสริม', icon: 'package' },
  { id: 'exhaust', name: 'Exhaust', nameTh: 'ท่อไอเสีย', icon: 'wind' },
]

export const bikeModels: BikeModel[] = [
  // Yamaha
  { id: 'sr400', brand: 'Yamaha', model: 'SR400/500' },
  { id: 'srx', brand: 'Yamaha', model: 'SRX400-600' },
  { id: 'xs650', brand: 'Yamaha', model: 'XS650/TX650' },
  { id: 'xt500', brand: 'Yamaha', model: 'XT/TT500' },
  { id: 'tdr', brand: 'Yamaha', model: 'TDR220' },
  { id: 'r15', brand: 'Yamaha', model: 'R15/XSR155/XMAX300' },
  { id: 'r3', brand: 'Yamaha', model: 'R3/MT-03/R25' },
  { id: 'r1', brand: 'Yamaha', model: 'R1/R6/R7' },
  { id: 'r7', brand: 'Yamaha', model: 'R7' },
  { id: 'r9', brand: 'Yamaha', model: 'R9' },
  // Honda
  { id: 'cb750', brand: 'Honda', model: 'CB750 K0-K7' },
  { id: 'gb400', brand: 'Honda', model: 'GB250/400/CB400SS' },
  { id: 'nc35', brand: 'Honda', model: 'NC30/NC35/CB1300' },
  { id: 'cbr250', brand: 'Honda', model: 'CBR150R/250RR/300' },
  { id: 'cbr600', brand: 'Honda', model: 'CBR600RR/1000RR' },
  { id: 'cbr650r', brand: 'Honda', model: 'CBR650R/CB650F' },
  { id: 'monkey', brand: 'Honda', model: 'Monkey/MSX125/DAX125' },
  { id: 'nsr150', brand: 'Honda', model: 'NSR150SP/Dash 2T' },
  // Kawasaki
  { id: 'w650', brand: 'Kawasaki', model: 'W650/W800' },
  { id: 'estrella', brand: 'Kawasaki', model: 'Estrella250/TR250' },
  { id: 'ksr', brand: 'Kawasaki', model: 'KSR110/KR150' },
  { id: 'ninja250', brand: 'Kawasaki', model: 'Ninja250/300/400/ZX250R' },
  { id: 'zx10', brand: 'Kawasaki', model: 'Ninja ZX-10RR' },
  // Suzuki
  { id: 'tempter', brand: 'Suzuki', model: 'Tempter 400' },
  { id: 'volty', brand: 'Suzuki', model: 'Volty 250' },
  // Triumph
  { id: 'thruxton', brand: 'Triumph', model: 'Thruxton900/T100/T120' },
  { id: 'daytona675', brand: 'Triumph', model: 'Daytona 675' },
  // Others
  { id: 's1000rr', brand: 'BMW', model: 'S1000RR' },
  { id: 'interceptor', brand: 'Royal Enfield', model: 'GT535/Interceptor 650' },
  { id: 'monster', brand: 'Ducati', model: 'Monster 795/796/Hyper821' },
  { id: 'panigale', brand: 'Ducati', model: 'Panigale V4R' },
  { id: 'ducati_diavel', brand: 'Ducati', model: 'Diavel' },
  { id: 'ducati_scrambler', brand: 'Ducati', model: 'Scrambler' },
  { id: 'hd883', brand: 'Harley-Davidson', model: 'Sportster 883-1200' },
  { id: 'centaur', brand: 'Stallions', model: 'Centaur 150' },
  { id: 'rc390', brand: 'KTM', model: 'RC390' },
]

/** Every imported product, including unpublished drafts — used by the admin panel. */
export const allProducts: Product[] = legacyProducts

/** Public catalogue — only published (review-complete) products are shown. */
export const products: Product[] = allProducts.filter((p) => p.published)

export function getProductById(id: string): Product | undefined {
  return allProducts.find((p) => p.id === id)
}

export function getProductsByCategory(categoryId: string): Product[] {
  return products.filter((p) => p.category === categoryId)
}

export function getProductsByBike(bikeId: string): Product[] {
  return products.filter((p) => p.bikeModels.includes(bikeId))
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase()
  return products.filter((p) =>
    p.code.toLowerCase().includes(q) ||
    p.name.toLowerCase().includes(q) ||
    p.nameTh.includes(q) ||
    p.material.toLowerCase().includes(q)
  )
}
