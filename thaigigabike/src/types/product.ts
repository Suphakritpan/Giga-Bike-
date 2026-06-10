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
  /** false = hidden from storefront (incomplete legacy import / draft). */
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
