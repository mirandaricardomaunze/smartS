import { departmentsRepository } from '@/repositories/departmentsRepository'
import { Department } from '../types'

export const departmentsService = {
  getAll(companyId: string): Department[] {
    return departmentsRepository.getAll(companyId)
  },

  create(companyId: string, data: Omit<Department, 'id' | 'created_at' | 'updated_at' | 'synced' | 'company_id'>): Department {
    return departmentsRepository.create({ ...data, company_id: companyId })
  },

  update(companyId: string, id: string, data: Partial<Department>): void {
    departmentsRepository.update(companyId, id, data)
  },

  delete(companyId: string, id: string): void {
    departmentsRepository.delete(companyId, id)
  }
}
