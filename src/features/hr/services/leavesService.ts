import { leavesRepository } from '@/repositories/leavesRepository'
import { Leave } from '../types'

export const leavesService = {
  getAll(companyId: string): Leave[] {
    return leavesRepository.getAll(companyId)
  },

  getEmployeeLeaves(companyId: string, employeeId: string): Leave[] {
    return leavesRepository.getEmployeeLeaves(companyId, employeeId)
  },

  requestLeave(companyId: string, data: Omit<Leave, 'id' | 'created_at' | 'updated_at' | 'synced' | 'company_id' | 'approved_by'>): Leave {
    return leavesRepository.create({
      ...data,
      company_id: companyId,
      status: 'pending',
      approved_by: null
    })
  },

  approveLeave(companyId: string, id: string, adminId: string): void {
    leavesRepository.updateStatus(companyId, id, 'approved', adminId)
  },

  rejectLeave(companyId: string, id: string, adminId: string): void {
    leavesRepository.updateStatus(companyId, id, 'rejected', adminId)
  }
}
