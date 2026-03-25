import { supplierRepository } from '@/repositories/supplierRepository'
import { historyRepository } from '@/repositories/historyRepository'
import { hasPermission } from '@/utils/permissions'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useCompanyStore } from '@/store/companyStore'
import { Supplier } from '@/types'

export const suppliersService = {
  getAll(): Supplier[] {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return []
    return supplierRepository.getAll(activeCompanyId)
  },

  create(data: Omit<Supplier, 'id' | 'created_at' | 'synced'>): Supplier {
    const { user } = useAuthStore.getState()
    // Fornecedores fall under management role. Using create_products as a proxy if not specific.
    // However, since it's not in the matrix, we follow 'manage_movements' or similar for operators?
    // Let's stick to Admin/Manager for suppliers/customers creation as per standard ERP.
    if (!user || !hasPermission(user.role, 'create_products')) {
      throw new Error('Sem permissão para gerir fornecedores')
    }
    
    const supplier = supplierRepository.create(data)
    historyRepository.log(supplier.company_id, 'CREATE', 'suppliers', supplier.id, user.id, supplier)
    return supplier
  },

  update(id: string, data: Partial<Supplier>): void {
    const { user } = useAuthStore.getState()
    if (!user || !hasPermission(user.role, 'edit_products')) {
      throw new Error('Sem permissão para editar fornecedores')
    }
    const { activeCompanyId } = useCompanyStore.getState()
    supplierRepository.update(id, data)
    if (activeCompanyId) {
      historyRepository.log(activeCompanyId, 'UPDATE', 'suppliers', id, user.id, data)
    }
  },

  delete(id: string): void {
    const { user } = useAuthStore.getState()
    if (!user || !hasPermission(user.role, 'delete_products')) {
      throw new Error('Sem permissão para apagar fornecedores')
    }
    const { activeCompanyId } = useCompanyStore.getState()
    supplierRepository.delete(id)
    if (activeCompanyId) {
      historyRepository.log(activeCompanyId, 'DELETE', 'suppliers', id, user.id, { id })
    }
  }
}
