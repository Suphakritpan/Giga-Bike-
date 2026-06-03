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
  { id: 'chassis', name: 'Chassis', nameTh: 'ตัวถัง', icon: 'tool' },
  { id: 'suspension', name: 'Suspension', nameTh: 'โช๊ค', icon: 'activity' },
  { id: 'accessories', name: 'Accessories', nameTh: 'อุปกรณ์เสริม', icon: 'package' },
  { id: 'exhaust', name: 'Exhaust', nameTh: 'ท่อไอเสีย', icon: 'wind' },
]

export const bikeModels: BikeModel[] = [
  { id: 'sr400', brand: 'Yamaha', model: 'SR400/500' },
  { id: 'srx', brand: 'Yamaha', model: 'SRX400-600' },
  { id: 'xs650', brand: 'Yamaha', model: 'XS650/TX650' },
  { id: 'xt500', brand: 'Yamaha', model: 'XT/TT500' },
  { id: 'r15', brand: 'Yamaha', model: 'R15/XSR155' },
  { id: 'r3', brand: 'Yamaha', model: 'R3/MT03' },
  { id: 'cb750', brand: 'Honda', model: 'CB750 K0-K7' },
  { id: 'gb400', brand: 'Honda', model: 'GB250/400/CB400ss' },
  { id: 'cbr250', brand: 'Honda', model: 'CBR250rr/300' },
  { id: 'cbr600', brand: 'Honda', model: 'CBR600RR/1000RR' },
  { id: 'w650', brand: 'Kawasaki', model: 'W650/W800' },
  { id: 'ninja250', brand: 'Kawasaki', model: 'Ninja 250/300/400' },
  { id: 'thruxton', brand: 'Triumph', model: 'Thruxton 900/T100/T120' },
  { id: 's1000rr', brand: 'BMW', model: 'S1000RR' },
  { id: 'interceptor', brand: 'Royal Enfield', model: 'Interceptor 650' },
  { id: 'panigale', brand: 'Ducati', model: 'Panigale V4R' },
]

export const products: Product[] = [
  {
    id: 'g232',
    code: 'G.232',
    name: 'Custom Brake Disc SR 310mm.',
    nameTh: 'จานเบรคแต่ง SR 310mm. Sunstar',
    price: 6000,
    category: 'brake',
    bikeModels: ['sr400', 'srx', 'xs650'],
    colors: ['black', 'gold', 'hard'],
    inStock: true,
    stockCount: 12,
    material: 'Alloy 6061 + Pins Alloy 7075 CNC Billet',
    description: 'Custom brake disc for SR 2001–2022, 310mm diameter. Genuine Sunstar rotor with CNC billet alloy spider. Available in multiple pin colors.',
    descriptionTh: 'จานเบรคแต่ง SR 2001–2022 ขนาดจาน 310 mm. แผ่นจานเบรคเป็นของแท้ซันสตาร์ ใส้จานผลิตจาก Alloy6061+Pins Alloy7075 CNC Billet มีหลายสีหลายแบบให้เลือกตามต้องการ',
    images: ['/images/g232.jpg'],
    featured: true,
  },
  {
    id: 'g88',
    code: 'G.88',
    name: 'Aluminium Swingarm SR Type 3',
    nameTh: 'สวิงอาร์มอลูมิเนียมแต่ง Yamaha SR Type 3',
    price: 6500,
    category: 'chassis',
    bikeModels: ['sr400'],
    colors: ['polished', 'silver', 'black', 'gray'],
    inStock: true,
    stockCount: 5,
    material: 'Special Grade Alloy',
    description: 'Direct-fit aluminium swingarm for Yamaha SR. Complete kit with rear axle, bushings, shock bushings, bolts, and bearings. Track-tested.',
    descriptionTh: 'สวิงอาร์มอลูมิเนียมแต่ง Yamaha SR Type 3 ผลิตจาก Alloy ใส่แทนของเดิมได้เลยไม่ต้องดัดแปลง พร้อมลูกปืนสวิงอาร์มครบ ทดสอบในสนามแข่งเรียบร้อย',
    images: ['/images/g88.jpg'],
    featured: true,
  },
  {
    id: 'g252',
    code: 'G.252',
    name: 'Clear Lens Clutch Cover SR400/500',
    nameTh: 'ฝาคลัชแต่ง แบบเลนส์ใส SR400/500',
    price: 19500,
    category: 'engine',
    bikeModels: ['sr400'],
    colors: ['silver', 'black', 'black-silver'],
    inStock: true,
    stockCount: 3,
    material: 'Alloy CNC Billet',
    description: 'Clear lens clutch cover for SR400/500. CNC billet alloy construction with transparent lens window.',
    descriptionTh: 'ฝาคลัชแต่ง แบบเลนส์ใส ใส่SR400/500 ผลิตจาก Alloy CNC Billet มีสี เงิน/ดำ/ดำ-ครอบเงิน+แหวนมีสี ดำ/เงิน/ทอง/เขียว สลับสีได้',
    images: ['/images/g252.jpg'],
    featured: true,
  },
  {
    id: 'g249',
    code: 'G.249',
    name: 'Aluminium Swingarm SR Type 4',
    nameTh: 'สวิงอาร์มอลูมิเนียมแต่ง Yamaha SR Type 4',
    price: 6500,
    category: 'chassis',
    bikeModels: ['sr400'],
    colors: ['polished', 'silver', 'black', 'gray'],
    inStock: true,
    stockCount: 4,
    material: 'Special Grade Alloy',
    description: 'Type 4 aluminium swingarm for Yamaha SR. Direct replacement, no modification needed. Includes full bearing and hardware kit.',
    descriptionTh: 'สวิงอาร์มอลูมิเนียมแต่ง Yamaha SR Type 4 ผลิตจาก Alloy ใส่แทนของเดิมได้เลยไม่ต้องดัดแปลง พร้อมลูกปืนสวิงอาร์มครบและจุดยึดบังโซ่เดิมได้ด้วย',
    images: ['/images/g249.jpg'],
    featured: false,
  },
  {
    id: 'g161',
    code: 'G.161',
    name: 'Stainless Side Stand SR',
    nameTh: 'ขาตั้งเดี่ยวแต่ง SR Stainless 304',
    price: 1800,
    category: 'chassis',
    bikeModels: ['sr400'],
    colors: ['polished'],
    inStock: true,
    stockCount: 20,
    material: 'Stainless 304 CNC',
    description: 'CNC stainless 304 side stand for Yamaha SR. Available in 3 lengths: short (-1 inch/220mm), standard (245mm), long (+1 inch/270mm). Foot or flat style.',
    descriptionTh: 'ขาตั้งเดี่ยวแต่ง SR ผลิตจาก Stainless 304 ด้วยเครื่องจักร CNC มีสองแบบสองขนาดให้เลือก มีแบบสั้น220mm ยาวเท่าเดิม245mm และยาวกว่า1นิ้ว270mm',
    images: ['/images/g161.jpg'],
    featured: false,
  },
  {
    id: 'g248',
    code: 'G.248',
    name: 'Aluminium Cylinder Block SR400/500',
    nameTh: 'ชุดเสื้อสูบอลูมิเมียม SR400/500 CNC Billet',
    price: 18500,
    category: 'engine',
    bikeModels: ['sr400'],
    colors: ['raw', 'silver', 'black'],
    inStock: true,
    stockCount: 2,
    material: 'Alloy 6061 CNC Billet',
    description: 'Aluminium cylinder block for SR400/500. Stock-bore compatible, borable to 100mm+. Handles high compression without cracking.',
    descriptionTh: 'ชุดเสื้อสูบอลูมิเมียม SR400/500 CNC Billet แบบทรงเดิม ผลิตจาก Alloy 6061 สามารถคว้านใส่ปลอกสูบเดิมได้เลย รองรับกำลังอัดสูงๆ ป้องกันเสื้อสูบแตก',
    images: ['/images/g248.jpg'],
    featured: true,
  },
  {
    id: 'g114',
    code: 'G.114',
    name: 'Valve Adjust Cover SR — Fin Style',
    nameTh: 'ฝาครอบตั้งวาร์วแต่ง SR แบบครีบ',
    price: 700,
    category: 'engine',
    bikeModels: ['sr400', 'xt500'],
    colors: ['silver', 'black', 'gold', 'hard'],
    inStock: true,
    stockCount: 30,
    material: 'Alloy 6061 CNC Billet',
    description: 'Finned valve adjust cover for SR, XT, TT. CNC billet alloy. Multiple color options.',
    descriptionTh: 'ฝาครอบตั้งวาร์วแต่ง SR แบบครีบ ผลิตจาก Alloy 6061 CNC Billet มีสี เงิน/ดำ/ทอง/ฮาร์ท',
    images: ['/images/g114.jpg'],
    featured: false,
  },
  {
    id: 'g190',
    code: 'G.190',
    name: 'Triple Clamp Set SR + Ohlins 43mm',
    nameTh: 'ชุดแผงคอบนล่างแบบมีตุ๊กตาแต่ง SR + Ohlins 43mm',
    price: 14500,
    category: 'suspension',
    bikeModels: ['sr400'],
    colors: ['silver', 'black'],
    inStock: true,
    stockCount: 3,
    material: 'Alloy 6061 + 7075 CNC',
    description: 'Triple clamp set with bar clamps for SR + Ohlins FG433/621 43mm forks. Direct fit, no modification. Black hard anodize guaranteed not purple.',
    descriptionTh: 'ชุดแผงคอบนล่างแบบมีตุ๊กตาแต่ง SR ใส่กับโช๊ค Ohlins 43mm ได้เลยไม่ต้องดัดแปลง ผลิตจาก Alloy 6061+7075 CNC สีอโนไดซ์ดำสนิทไม่ม่วง',
    images: ['/images/g190.jpg'],
    featured: true,
  },
]

export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id)
}

export function getProductsByCategory(categoryId: string): Product[] {
  return products.filter(p => p.category === categoryId)
}

export function getProductsByBike(bikeId: string): Product[] {
  return products.filter(p => p.bikeModels.includes(bikeId))
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase()
  return products.filter(p =>
    p.code.toLowerCase().includes(q) ||
    p.name.toLowerCase().includes(q) ||
    p.nameTh.includes(q) ||
    p.material.toLowerCase().includes(q)
  )
}
