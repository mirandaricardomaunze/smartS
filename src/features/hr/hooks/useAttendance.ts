import { useState, useCallback, useEffect } from 'react'
import { attendanceService } from '../services/attendanceService'
import { Attendance } from '../types'
import { useAuthStore } from '@/features/auth/store/authStore'

export function useAttendance(config: { date?: string, employeeId?: string, month?: number, year?: number } = {}) {
  const { user } = useAuthStore()
  const date = config.date || new Date().toISOString().split('T')[0]
  
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [summary, setSummary] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAttendance = useCallback(async () => {
    if (!user?.company_id) return
    try {
      setIsLoading(true)
      let data: Attendance[] = []
      if (config.employeeId) {
        data = attendanceService.getEmployeeAttendance(user.company_id, config.employeeId)
      } else {
        data = attendanceService.getToday(user.company_id, date)
      }
      setAttendance(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [user?.company_id, date, config.employeeId])

  const loadSummary = useCallback(async () => {
    if (!user?.company_id || !config.month || !config.year) return
    try {
      setIsLoading(true)
      const data = attendanceService.getMonthlySummary(user.company_id, config.month, config.year)
      setSummary(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [user?.company_id, config.month, config.year])

  useEffect(() => {
    if (config.month && config.year) {
      loadSummary()
    } else {
      loadAttendance()
    }
  }, [loadAttendance, loadSummary, config.month, config.year])

  const clockIn = async (employeeId: string, time: string) => {
    if (!user?.company_id) return
    try {
      const record = attendanceService.registerAttendance({
        company_id: user.company_id,
        employee_id: employeeId,
        date: date,
        clock_in: time,
        clock_out: null,
        breaks: null,
        status: 'present',
        justification: null,
        total_minutes: 0
      })
      setAttendance(prev => [...prev, record])
      return record
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }

  const clockOut = async (id: string, time: string, totalMinutes: number) => {
    if (!user?.company_id) return
    try {
      attendanceService.updateAttendance(user.company_id, id, { 
        clock_out: time, 
        total_minutes: totalMinutes 
      })
      setAttendance(prev => prev.map(a => a.id === id ? { ...a, clock_out: time, total_minutes: totalMinutes } : a))
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }

  const addManualEntry = async (data: any) => {
    if (!user?.company_id) return
    try {
      const record = attendanceService.registerAttendance({
        ...data,
        company_id: user.company_id,
        synced: 0
      })
      setAttendance(prev => [record, ...prev])
      return record
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }

  return { attendance, summary, isLoading, error, loadAttendance, loadSummary, clockIn, clockOut, addManualEntry }
}
