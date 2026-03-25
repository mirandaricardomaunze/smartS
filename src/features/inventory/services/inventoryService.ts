import { movementsRepository } from '@/repositories/movementsRepository'
import { productsRepository } from '@/repositories/productsRepository'
import { historyRepository } from '@/repositories/historyRepository'
import { hasPermission } from '@/utils/permissions'
import { useAuthStore } from '@/features/auth/store/authStore'

export const inventoryService = {
  /**
   * Reconciles physical stock with system stock
   * Creates an 'adjustment' movement for the difference
   */
  async reconcileStock(
    productId: string,
    physicalQty: number,
    userId: string,
    companyId: string,
    reason?: string
  ): Promise<void> {
    const { user } = useAuthStore.getState()
    if (!user || !hasPermission(user.role, 'manage_movements')) {
        throw new Error('Sem permissão para realizar auditoria de stock')
    }

    const product = productsRepository.getById(productId)
    if (!product) throw new Error('Produto não encontrado')

    const diff = physicalQty - product.current_stock
    if (diff === 0) return // No adjustment needed

    // Create adjustment movement
    await movementsRepository.create({
      product_id: productId,
      type: 'adjustment',
      quantity: diff,
      user_id: userId,
      company_id: companyId,
      reason: reason || `Auditoria física: Contados ${physicalQty} (Sistema: ${product.current_stock})`
    })

    historyRepository.log(companyId, 'AUDIT', 'products', productId, userId, { 
        physical_qty: physicalQty, 
        system_qty: product.current_stock,
        diff 
    })
  }
}
