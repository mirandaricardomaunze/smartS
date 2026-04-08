import { productsRepository } from '@/repositories/productsRepository'
import { historyRepository } from '@/repositories/historyRepository'
import { hasPermission } from '@/utils/permissions'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useCompanyStore } from '@/store/companyStore'
import { Product, PlanType } from '@/types'
import { useSubscriptionStore } from '@/store/subscriptionStore'

export const productsService = {
  getAll(limit: number = 20, offset: number = 0, search?: string): Product[] {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return []
    return productsRepository.getAll(activeCompanyId, limit, offset, search)
  },
  getById(id: string): Product | null {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return null
    return productsRepository.getById(activeCompanyId, id)
  },
  getByBarcode(barcode: string): Product | null {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return null
    return productsRepository.getByBarcode(activeCompanyId, barcode)
  },
  create(data: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'synced'>, batches?: { lot_number: string, expiry_date: string, quantity: string }[]): Product {
    const { user } = useAuthStore.getState()
    if (!user || !hasPermission(user.role, 'create_products')) {
      throw new Error('Sem permissão para criar produtos')
    }

    // Check Plan Limits (BASIC/TRIAL limit = 500)
    const { subscription } = useSubscriptionStore.getState()
    const { activeCompanyId } = useCompanyStore.getState()
    
    if (activeCompanyId && (subscription?.plan === 'BASIC' || subscription?.plan === 'TRIAL')) {
      const count = productsRepository.count(activeCompanyId)
      if (count >= 500) {
        throw new Error('Limite de 500 produtos atingido no seu plano. Faça upgrade para Profissional para registar mais produtos.')
      }
    }
    
    // 1. Create the product with 0 stock first (movements will update it)
    const initialStock = data.current_stock
    const product = productsRepository.create({
      ...data,
      current_stock: 0
    })
    
    historyRepository.log(product.company_id, 'CREATE', 'products', product.id, user.id, product)

    // 2. Create initial stock movement if > 0
    if (initialStock > 0) {
      const { movementsRepository } = require('@/repositories/movementsRepository')
      movementsRepository.create({
        company_id: product.company_id,
        product_id: product.id,
        type: 'entry',
        quantity: initialStock,
        user_id: user.id,
        reason: 'Stock inicial na criação do produto'
      })
    }

    // 3. Create expiry lots if provided
    if (batches && batches.length > 0) {
      const { expiryService } = require('@/features/expiry/services/expiryService')
      for (const batch of batches) {
        expiryService.create({
          company_id: product.company_id,
          product_id: product.id,
          lot_number: batch.lot_number,
          expiry_date: batch.expiry_date,
          quantity: parseInt(batch.quantity) || 0
        })
      }
    }

    return product
  },
  update(id: string, data: Partial<Product>): void {
    const { user } = useAuthStore.getState()
    if (!user || !hasPermission(user.role, 'edit_products')) {
      throw new Error('Sem permissão para editar produtos')
    }
    const { activeCompanyId } = useCompanyStore.getState()
    
    // Check if stock is being updated manually to record a movement
    if (data.current_stock !== undefined && activeCompanyId) {
      const currentProduct = productsRepository.getById(activeCompanyId, id)
      if (currentProduct && currentProduct.current_stock !== data.current_stock) {
        const diff = data.current_stock - currentProduct.current_stock
        const { movementsRepository } = require('@/repositories/movementsRepository')
        movementsRepository.create({
          company_id: currentProduct.company_id,
          product_id: id,
          type: 'adjustment',
          quantity: diff,
          user_id: user.id,
          reason: `Ajuste manual de stock (${diff > 0 ? '+' : ''}${diff})`
        })
      }
    }

    if (activeCompanyId) {
      productsRepository.update(id, activeCompanyId, data)
      historyRepository.log(activeCompanyId, 'UPDATE', 'products', id, user.id, data)
    }
  },
  delete(id: string): void {
    const { user } = useAuthStore.getState()
    if (!user || !hasPermission(user.role, 'delete_products')) {
      throw new Error('Sem permissão para apagar produtos')
    }
    const { activeCompanyId } = useCompanyStore.getState()
    if (activeCompanyId) {
      productsRepository.delete(activeCompanyId, id)
      historyRepository.log(activeCompanyId, 'DELETE', 'products', id, user.id, { id })
    }
  },
}
