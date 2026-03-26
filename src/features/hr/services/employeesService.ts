import { employeesRepository } from '@/repositories/employeesRepository'
import { Employee } from '../types'

export const employeesService = {
  getAll(companyId: string, page: number = 1): Employee[] {
    const limit = 20
    const offset = (page - 1) * limit
    return employeesRepository.getAll(companyId, limit, offset)
  },

  getById(companyId: string, id: string): Employee | null {
    return employeesRepository.getById(companyId, id)
  },

  create(companyId: string, data: Omit<Employee, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'synced' | 'position' | 'department' | 'is_active'>): Employee {
    if (!data.name) throw new Error('O nome do funcionário é obrigatório')
    
    return employeesRepository.create({
      ...data,
      company_id: companyId,
      is_active: 1
    })
  },

  update(companyId: string, id: string, data: Partial<Employee>): void {
    employeesRepository.update(companyId, id, data)
  },

  delete(companyId: string, id: string): void {
    employeesRepository.delete(companyId, id)
  }
}
