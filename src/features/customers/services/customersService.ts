import { customerRepository } from '@/repositories/customerRepository'
import { historyRepository } from '@/repositories/historyRepository'
import { hasPermission } from '@/utils/permissions'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useCompanyStore } from '@/store/companyStore'
import { Customer } from '@/types'

export const customersService = {
  getAll(limit: number = 20, offset: number = 0): Customer[] {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return []
    return customerRepository.getAll(activeCompanyId, limit, offset)
  },

  create(data: Omit<Customer, 'id' | 'created_at' | 'synced'>): Customer {
    const { user } = useAuthStore.getState()
    // Customers creation allowed for Admin, Manager and Operator (it's crucial for POS sales)
    if (!user || (!hasPermission(user.role, 'create_products') && !hasPermission(user.role, 'manage_movements'))) {
      throw new Error('Sem permissão para criar clientes')
    }
    
    const customer = customerRepository.create(data)
    historyRepository.log(customer.company_id, 'CREATE', 'customers', customer.id, user.id, customer)
    return customer
  },

  update(id: string, data: Partial<Customer>): void {
    const { user } = useAuthStore.getState()
    if (!user || (!hasPermission(user.role, 'edit_products') && !hasPermission(user.role, 'manage_movements'))) {
      throw new Error('Sem permissão para editar clientes')
    }
    const { activeCompanyId } = useCompanyStore.getState()
    if (activeCompanyId) {
      customerRepository.update(activeCompanyId, id, data)
      historyRepository.log(activeCompanyId, 'UPDATE', 'customers', id, user.id, data)
    }
  },

  delete(id: string): void {
    const { user } = useAuthStore.getState()
    if (!user || !hasPermission(user.role, 'delete_products')) {
      throw new Error('Sem permissão para apagar clientes')
    }
    const { activeCompanyId } = useCompanyStore.getState()
    if (activeCompanyId) {
      customerRepository.delete(activeCompanyId, id)
      historyRepository.log(activeCompanyId, 'DELETE', 'customers', id, user.id, { id })
    }
  }
}
