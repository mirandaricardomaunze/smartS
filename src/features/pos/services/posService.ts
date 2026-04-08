import { orderService } from '@/services/orderService'
import { useAuthStore } from '@/features/auth/store/authStore'
import { usePOSStore } from '../store/posStore'
import { useToastStore } from '@/store/useToastStore'
import { Order, OrderItem } from '@/types'
import { notificationService } from '@/features/notifications/services/notificationService'

export const posService = {
  /**
   * Processes a complete POS transaction and handles UI side effects
   */
  async processCheckout(paymentMethod: string, isSplit: boolean, payments: any[] = []) {
    const { user } = useAuthStore.getState()
    const { cart, selectedCustomer, getTotal, clearCart } = usePOSStore.getState()
    const toast = useToastStore.getState()

    if (!user || !user.company_id) {
      throw new Error('Utilizador não autenticado ou sem empresa associada')
    }

    if (cart.length === 0) {
      throw new Error('O carrinho está vazio')
    }

    const orderData: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'synced'> = {
      company_id: user.company_id,
      customer_id: selectedCustomer?.id || null,
      customer_name: selectedCustomer?.name || 'Consumidor Final',
      user_id: user.id,
      number: `PDV-${Date.now().toString().slice(-6)}`,
      status: 'completed',
      total_amount: getTotal(),
      discount: 0,
      tax_amount: 0,
      notes: isSplit 
        ? `Venda via PDV - Pago dividido: ${payments.map(p => `${p.amount} (${p.method})`).join(', ')}`
        : `Venda via PDV - Pago por ${paymentMethod}`,
    }

    const items: Omit<OrderItem, 'id' | 'order_id'>[] = cart.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.sale_price || 0,
      tax_rate: item.tax_rate || 0,
      total: item.total,
    }))

    try {
      const order = await orderService.processPosSale(orderData, items)

      // Check for low stock alerts immediately for each product sold
      for (const item of items) {
        notificationService.checkLowStockForProduct(user.company_id, item.product_id).catch(console.error)
      }

      // Clear local state on success
      clearCart()
      
      return { order, items }
    } catch (error: any) {
      console.error('POS Checkout Error:', error)
      throw new Error(error.message || 'Falha ao processar venda no banco de dados')
    }
  }
}
