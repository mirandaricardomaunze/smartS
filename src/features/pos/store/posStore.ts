import { create } from 'zustand'
import { Product, Customer } from '@/types'
import { useToastStore } from '@/store/useToastStore'
import { feedback } from '@/utils/haptics'
import { useCompanyStore } from '@/store/companyStore'

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
  addGenericItem: (name: string, price: number) => void
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

  addToCart: (product: Product, quantity: number = 1) => {
    const { cart } = get()
    const existingItem = cart.find((item: CartItem) => item.id === product.id)
    
    // Check if it's a generic item (no stock validation needed)
    const isGeneric = product.id.startsWith('generic-')
    
    if (!isGeneric) {
      const currentQtyInCart = existingItem?.quantity || 0
      if (currentQtyInCart + quantity > product.current_stock) {
        feedback.warning()
        useToastStore.getState().show(`Stock insuficiente para ${product.name}. Disponível: ${product.current_stock}`, 'warning')
        return
      }
    }

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity
      set({
        cart: cart.map((item: CartItem) =>
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

  addGenericItem: (name: string, price: number) => {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) {
      useToastStore.getState().show('Erro: Nenhum contexto de empresa encontrado.', 'error')
      return
    }

    const { cart } = get()
    const newItem: CartItem = {
      id: `generic-${Date.now()}`,
      company_id: activeCompanyId,
      name,
      barcode: null,
      reference: 'AVULSO',
      sku: `AV-${Date.now()}`,
      category_id: null,
      brand: null,
      unit: 'un',
      units_per_box: null,
      boxes_per_pallet: null,
      minimum_stock: 0,
      current_stock: 1,
      purchase_price: null,
      sale_price: price,
      tax_rate: 0,
      supplier_id: null,
      description: 'Item inserido manualmente no PDV',
      image_url: null,
      is_active: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: 0,
      quantity: 1,
      total: price,
    }
    set({ cart: [...cart, newItem] })
  },

  removeFromCart: (productId: string) => {
    set({ cart: get().cart.filter((item: CartItem) => item.id !== productId) })
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeFromCart(productId)
      return
    }

    const { cart } = get()
    const item = cart.find((i: CartItem) => i.id === productId)
    
    if (item && !item.id.startsWith('generic-')) {
      if (quantity > item.current_stock) {
        feedback.warning()
        useToastStore.getState().show(`Apenas ${item.current_stock} unidades disponíveis em stock.`, 'warning')
        return
      }
    }

    set({
      cart: get().cart.map((item: CartItem) =>
        item.id === productId
          ? { ...item, quantity, total: quantity * (item.sale_price || 0) }
          : item
      ),
    })
  },

  setCustomer: (selectedCustomer: Customer | null) => set({ selectedCustomer }),
  setDiscount: (discount: number) => set({ discount }),
  
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
    
    const parked = parkedCarts.find((p: any) => p.id === parkedId)
    if (!parked) return

    let updatedParked = parkedCarts.filter((p: any) => p.id !== parkedId)
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
      parkedCarts: get().parkedCarts.filter((p: any) => p.id !== parkedId)
    })
  },

  getSubtotal: () => {
    return get().cart.reduce((acc: number, item: CartItem) => acc + item.total, 0)
  },

  getTaxTotal: () => {
    return get().cart.reduce((acc: number, item: CartItem) => {
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
