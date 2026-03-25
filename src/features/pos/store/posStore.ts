import { create } from 'zustand'
import { Product, Customer } from '@/types'

export interface CartItem extends Product {
  quantity: number
  total: number
}

interface POSState {
  cart: CartItem[]
  selectedCustomer: Customer | null
  discount: number
  parkedCarts: Array<{
    id: string
    cart: CartItem[]
    customer: Customer | null
    discount: number
    createdAt: string
  }>
  
  // Actions
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  setCustomer: (customer: Customer | null) => void
  setDiscount: (discount: number) => void
  clearCart: () => void
  
  // Parked Cart Actions
  parkCurrentCart: () => void
  resumeCart: (parkedId: string) => void
  removeParkedCart: (parkedId: string) => void
  
  // Computed (accessed via hooks or getters)
  getTotal: () => number
  getSubtotal: () => number
  getTaxTotal: () => number
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  selectedCustomer: null,
  discount: 0,
  parkedCarts: [],

  addToCart: (product, quantity = 1) => {
    const { cart } = get()
    const existingItem = cart.find((item) => item.id === product.id)

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity
      set({
        cart: cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: newQuantity, total: newQuantity * (item.sale_price || 0) }
            : item
        ),
      })
    } else {
      set({
        cart: [
          ...cart,
          {
            ...product,
            quantity,
            total: quantity * (product.sale_price || 0),
          },
        ],
      })
    }
  },

  removeFromCart: (productId) => {
    set({ cart: get().cart.filter((item) => item.id !== productId) })
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId)
      return
    }

    set({
      cart: get().cart.map((item) =>
        item.id === productId
          ? { ...item, quantity, total: quantity * (item.sale_price || 0) }
          : item
      ),
    })
  },

  setCustomer: (selectedCustomer) => set({ selectedCustomer }),
  setDiscount: (discount) => set({ discount }),
  
  clearCart: () => set({ cart: [], selectedCustomer: null, discount: 0 }),

  parkCurrentCart: () => {
    const { cart, selectedCustomer, discount, parkedCarts } = get()
    if (cart.length === 0) return

    const newParkedCart = {
      id: Math.random().toString(36).substring(7),
      cart: [...cart],
      customer: selectedCustomer,
      discount,
      createdAt: new Date().toISOString(),
    }

    set({
      parkedCarts: [newParkedCart, ...parkedCarts],
      cart: [],
      selectedCustomer: null,
      discount: 0,
    })
  },

  resumeCart: (parkedId: string) => {
    const { parkedCarts, cart } = get()
    
    // If current cart is not empty, park it first? Or just swap? 
    // Let's swap for simplicity but user should be careful.
    const parked = parkedCarts.find(p => p.id === parkedId)
    if (!parked) return

    // Move current cart to parked if not empty
    let updatedParked = parkedCarts.filter(p => p.id !== parkedId)
    if (cart.length > 0) {
        updatedParked = [{
            id: Math.random().toString(36).substring(7),
            cart: [...cart],
            customer: get().selectedCustomer,
            discount: get().discount,
            createdAt: new Date().toISOString(),
        }, ...updatedParked]
    }

    set({
      cart: parked.cart,
      selectedCustomer: parked.customer,
      discount: parked.discount,
      parkedCarts: updatedParked
    })
  },

  removeParkedCart: (parkedId: string) => {
    set({
      parkedCarts: get().parkedCarts.filter(p => p.id !== parkedId)
    })
  },

  getSubtotal: () => {
    return get().cart.reduce((acc, item) => acc + item.total, 0)
  },

  getTaxTotal: () => {
    return get().cart.reduce((acc, item) => {
        const tax = (item.tax_rate || 0) / 100
        return acc + (item.total * tax)
    }, 0)
  },

  getTotal: () => {
    const subtotal = get().getSubtotal()
    const taxTotal = get().getTaxTotal()
    const discount = get().discount
    return subtotal + taxTotal - discount
  },
}))
