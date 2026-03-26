import { useState, useCallback, useEffect } from 'react'
import { leavesService } from '../services/leavesService'
import { Leave } from '../types'
import { useAuthStore } from '@/features/auth/store/authStore'

export function useLeaves(config: { employeeId?: string } = {}) {
  const { user } = useAuthStore()
  const { employeeId } = config
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadLeaves = useCallback(async () => {
    if (!user?.company_id) return
    try {
      setIsLoading(true)
      const data = employeeId 
        ? leavesService.getEmployeeLeaves(user.company_id, employeeId)
        : leavesService.getAll(user.company_id)
      setLeaves(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [user?.company_id, employeeId])

  useEffect(() => {
    loadLeaves()
  }, [loadLeaves])

  const requestLeave = async (data: Omit<Leave, 'id' | 'created_at' | 'updated_at' | 'synced' | 'company_id' | 'approved_by' | 'employee_name'>) => {
    if (!user?.company_id) return
    try {
      const newLeave = leavesService.requestLeave(user.company_id, data)
      setLeaves(prev => [newLeave, ...prev])
      return newLeave
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    if (!user?.company_id || !user?.id) return
    try {
      if (status === 'approved') {
        leavesService.approveLeave(user.company_id, id, user.id)
      } else {
        leavesService.rejectLeave(user.company_id, id, user.id)
      }
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, status, approved_by: user.id } : l))
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }

  return { leaves, isLoading, error, loadLeaves, requestLeave, handleStatusUpdate }
}
