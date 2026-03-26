import { useState, useCallback, useEffect } from 'react'
import { payrollService } from '../services/payrollService'
import { Payroll, Employee } from '../types'
import { useAuthStore } from '@/features/auth/store/authStore'

export function usePayroll(config: { month?: number, year?: number } = {}) {
  const { user } = useAuthStore()
  const month = config.month || new Date().getMonth() + 1
  const year = config.year || new Date().getFullYear()

  const [payslips, setPayslips] = useState<Payroll[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPayroll = useCallback(async () => {
    if (!user?.company_id) return
    try {
      setIsLoading(true)
      const data = payrollService.getPeriodPayroll(user.company_id, month, year)
      setPayslips(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [user?.company_id, month, year])

  useEffect(() => {
    loadPayroll()
  }, [loadPayroll])

  const processEmployee = async (employee: Employee, extra: any = {}) => {
    if (!user?.company_id) return
    try {
      const record = payrollService.calculateEmployeePayroll(user.company_id, employee, month, year, extra)
      setPayslips(prev => [...prev, record])
      return record
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }

  const lockPeriod = async () => {
    if (!user?.company_id) return
    try {
      payrollService.lockPeriod(user.company_id, month, year)
      await loadPayroll()
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }

  const getINSSData = () => {
    if (!user?.company_id) return null
    return payrollService.getINSSDeclaration(user.company_id, month, year)
  }

  return { payslips, isLoading, error, loadPayroll, processEmployee, lockPeriod, getINSSData }
}
