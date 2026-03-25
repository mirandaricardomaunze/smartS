import { movementsRepository } from '@/repositories/movementsRepository'
import { productsRepository } from '@/repositories/productsRepository'
import { historyRepository } from '@/repositories/historyRepository'
import { hasPermission } from '@/utils/permissions'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useCompanyStore } from '@/store/companyStore'
import { StockMovement } from '@/types'

export const movementsService = {
  getAll(): StockMovement[] {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return []
    return movementsRepository.getAll(activeCompanyId)
  },
  getByProductId(productId: string): StockMovement[] {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return []
    return movementsRepository.getByProductId(activeCompanyId, productId)
  },
  create(data: Omit<StockMovement, 'id' | 'created_at' | 'synced' | 'user_id' | 'company_id'>): StockMovement {
    const { user } = useAuthStore.getState()
    if (!user || !hasPermission(user.role, 'manage_movements')) {
      throw new Error('Sem permissão para gerir movimentos')
    }

    if (!user.company_id) {
        throw new Error('Utilizador não associado a uma empresa')
    }

    const product = productsRepository.getById(data.product_id)
    if (!product) {
        throw new Error('Produto não encontrado')
    }

    if (data.type === 'exit' && product.current_stock < data.quantity) {
        throw new Error('Stock insuficiente para esta saída')
    }

    const movement = movementsRepository.create({
        ...data,
        company_id: user.company_id,
        user_id: user.id
    })
    
    historyRepository.log(user.company_id, 'CREATE', 'movements', movement.id, user.id, movement)
    return movement
  },
}
