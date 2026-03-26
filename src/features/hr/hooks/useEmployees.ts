import { useState, useCallback, useEffect } from 'react'
import { employeesService } from '../services/employeesService'
import { Employee } from '../types'
import { useAuthStore } from '@/features/auth/store/authStore'

export function useEmployees() {
  const { user } = useAuthStore()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadEmployees = useCallback(async (reset = false) => {
    if (!user?.company_id) return
    try {
      setIsLoading(true)
      const targetPage = reset ? 1 : page
      const data = employeesService.getAll(user.company_id, targetPage)
      
      if (reset) {
        setEmployees(data)
        setPage(2)
      } else {
        setEmployees(prev => [...prev, ...data])
        setPage(prev => prev + 1)
      }
      
      setHasMore(data.length === 20)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [user?.company_id, page])

  useEffect(() => {
    loadEmployees(true)
  }, [user?.company_id])

  const createEmployee = async (data: any) => {
    if (!user?.company_id) return
    try {
      const newEmp = employeesService.create(user.company_id, data)
      setEmployees(prev => [newEmp, ...prev])
      return newEmp
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }

  const updateEmployee = async (id: string, data: Partial<Employee>) => {
    if (!user?.company_id) return
    try {
      employeesService.update(user.company_id, id, data)
      setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }

  const deleteEmployee = async (id: string) => {
    if (!user?.company_id) return
    try {
      employeesService.delete(user.company_id, id)
      setEmployees(prev => prev.filter(e => e.id !== id))
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }

  return { employees, isLoading, error, hasMore, loadMore: () => loadEmployees(), createEmployee, updateEmployee, deleteEmployee }
}
