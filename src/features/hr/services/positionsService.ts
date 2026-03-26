import { positionsRepository } from '@/repositories/positionsRepository'
import { Position } from '../types'

export const positionsService = {
  getAll(companyId: string): Position[] {
    return positionsRepository.getAll(companyId)
  },

  create(companyId: string, data: Omit<Position, 'id' | 'created_at' | 'updated_at' | 'synced' | 'company_id' | 'department'>): Position {
    return positionsRepository.create({ ...data, company_id: companyId })
  },

  update(companyId: string, id: string, data: Partial<Position>): void {
    positionsRepository.update(companyId, id, data)
  },

  delete(companyId: string, id: string): void {
    positionsRepository.delete(companyId, id)
  }
}
