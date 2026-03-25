import { expiryRepository } from '@/repositories/expiryRepository'
import { historyRepository } from '@/repositories/historyRepository'
import { hasPermission } from '@/utils/permissions'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useCompanyStore } from '@/store/companyStore'
import { ExpiryLot } from '@/types'

export const expiryService = {
  getAll(): ExpiryLot[] {
    return expiryRepository.getAll()
  },
  getByProductId(productId: string): ExpiryLot[] {
    return expiryRepository.getByProductId(productId)
  },
  create(data: Omit<ExpiryLot, 'id' | 'created_at' | 'updated_at' | 'synced'>): ExpiryLot {
    const { user } = useAuthStore.getState()
    if (!user || !hasPermission(user.role, 'manage_movements')) {
        // Assume managing expiry lots needs manage_movements or specific role
      throw new Error('Sem permissão para gerir lotes de validade')
    }
    
    const lot = expiryRepository.create(data)
    historyRepository.log(lot.company_id, 'CREATE', 'expiry_lots', lot.id, user.id, lot)
    return lot
  },
  update(id: string, data: Partial<ExpiryLot>): void {
    const { user } = useAuthStore.getState()
    if (!user || !hasPermission(user.role, 'manage_movements')) {
      throw new Error('Sem permissão para editar lotes')
    }
    const { activeCompanyId } = useCompanyStore.getState()
    expiryRepository.update(id, data)
    if (activeCompanyId) {
       historyRepository.log(activeCompanyId, 'UPDATE', 'expiry_lots', id, user.id, data)
    }
  },
  delete(id: string): void {
    const { user } = useAuthStore.getState()
    if (!user || !hasPermission(user.role, 'manage_movements')) {
      throw new Error('Sem permissão para apagar lotes')
    }
    const { activeCompanyId } = useCompanyStore.getState()
    expiryRepository.delete(id)
    if (activeCompanyId) {
      historyRepository.log(activeCompanyId, 'DELETE', 'expiry_lots', id, user.id, { id })
    }
  },
}
