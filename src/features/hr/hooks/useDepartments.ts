import { departmentsService } from '../services/departmentsService'
import { Department } from '../types'
import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/features/auth/store/authStore'

export function useDepartments() {
  const { user } = useAuthStore()
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDepartments = useCallback(async () => {
    if (!user?.company_id) return
    try {
      setIsLoading(true)
      const data = departmentsService.getAll(user.company_id)
      setDepartments(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [user?.company_id])

  useEffect(() => {
    loadDepartments()
  }, [loadDepartments])

  const createDepartment = async (data: Omit<Department, 'id' | 'created_at' | 'updated_at' | 'synced' | 'company_id'>) => {
    if (!user?.company_id) return
    try {
      const newDept = departmentsService.create(user.company_id, data)
      setDepartments(prev => [newDept, ...prev])
      return newDept
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }

  const updateDepartment = async (id: string, data: Partial<Department>) => {
    if (!user?.company_id) return
    try {
      departmentsService.update(user.company_id, id, data)
      setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...data } : d))
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }

  const deleteDepartment = async (id: string) => {
    if (!user?.company_id) return
    try {
      departmentsService.delete(user.company_id, id)
      setDepartments(prev => prev.filter(d => d.id !== id))
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }

  return { departments, isLoading, error, loadDepartments, createDepartment, updateDepartment, deleteDepartment }
}
