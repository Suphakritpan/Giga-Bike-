'use client'
import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import type { Product } from '@/data/products'

export type CartItem = {
  product: Product
  quantity: number
  color: string
}

type CartState = {
  items: CartItem[]
}

type CartAction =
  | { type: 'ADD'; product: Product; color: string }
  | { type: 'REMOVE'; productId: string; color: string }
  | { type: 'UPDATE_QTY'; productId: string; color: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: CartItem[] }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const key = `${action.product.id}-${action.color}`
      const existing = state.items.find(i => `${i.product.id}-${i.color}` === key)
      if (existing) {
        return {
          items: state.items.map(i =>
            `${i.product.id}-${i.color}` === key
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
        }
      }
      return { items: [...state.items, { product: action.product, quantity: 1, color: action.color }] }
    }
    case 'REMOVE':
      return { items: state.items.filter(i => !(i.product.id === action.productId && i.color === action.color)) }
    case 'UPDATE_QTY':
      if (action.quantity <= 0) {
        return { items: state.items.filter(i => !(i.product.id === action.productId && i.color === action.color)) }
      }
      return {
        items: state.items.map(i =>
          i.product.id === action.productId && i.color === action.color
            ? { ...i, quantity: action.quantity }
            : i
        )
      }
    case 'CLEAR':
      return { items: [] }
    case 'HYDRATE':
      return { items: action.items }
    default:
      return state
  }
}

type CartContextType = {
  items: CartItem[]
  add: (product: Product, color: string) => void
  remove: (productId: string, color: string) => void
  updateQty: (productId: string, color: string, quantity: number) => void
  clear: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gigabike-cart')
      if (saved) dispatch({ type: 'HYDRATE', items: JSON.parse(saved) })
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem('gigabike-cart', JSON.stringify(state.items))
  }, [state.items])

  const totalItems = state.items.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = state.items.reduce((s, i) => s + i.product.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items: state.items,
      add: (product, color) => dispatch({ type: 'ADD', product, color }),
      remove: (productId, color) => dispatch({ type: 'REMOVE', productId, color }),
      updateQty: (productId, color, quantity) => dispatch({ type: 'UPDATE_QTY', productId, color, quantity }),
      clear: () => dispatch({ type: 'CLEAR' }),
      totalItems,
      totalPrice,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
