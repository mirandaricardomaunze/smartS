import { useState, useCallback, useEffect } from 'react'
import { payrollService } from '../services/payrollService'
import { Payroll, Employee } from '../types'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useCountryConfig } from '@/hooks/useCountryConfig'

interface UsePayrollConfig {
  month?: number
  year?: number
  /** Quando fornecido, carrega todo o histórico do funcionário (ignora month/year) */
  employeeId?: string
}

export function usePayroll(config: UsePayrollConfig = {}) {
  const { user } = useAuthStore()
  const countryConfig = useCountryConfig()
  const month = config.month || new Date().getMonth() + 1
  const year = config.year || new Date().getFullYear()
  const { employeeId } = config

  const [payslips, setPayslips] = useState<Payroll[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPayroll = useCallback(async () => {
    if (!user?.company_id) return
    try {
      setIsLoading(true)
      const data = employeeId
        ? payrollService.getEmployeePayroll(user.company_id, employeeId)
        : payrollService.getPeriodPayroll(user.company_id, month, year)
      setPayslips(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [user?.company_id, month, year, employeeId])

  useEffect(() => {
    loadPayroll()
  }, [loadPayroll])

  const processEmployee = async (employee: Employee, extra: any = {}) => {
    if (!user?.company_id) return
    try {
      const record = payrollService.calculateEmployeePayroll(
        user.company_id,
        employee,
        month,
        year,
        countryConfig,
        extra
      )
      // Upsert local: se já existe, substitui; senão adiciona
      setPayslips(prev => {
        const idx = prev.findIndex(
          p => p.employee_id === record.employee_id &&
               p.period_month === record.period_month &&
               p.period_year === record.period_year
        )
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = record
          return updated
        }
        return [...prev, record]
      })
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
    return payrollService.getSocialSecurityDeclaration(user.company_id, month, year, countryConfig)
  }

  return { payslips, isLoading, error, loadPayroll, processEmployee, lockPeriod, getINSSData, countryConfig }
}
