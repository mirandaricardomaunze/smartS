import { useState, useCallback, useEffect, useRef } from 'react'
import { attendanceService } from '../services/attendanceService'
import { Attendance, AttendanceStatus } from '../types'
import { useAuthStore } from '@/features/auth/store/authStore'

interface UseAttendanceConfig {
  date?: string
  employeeId?: string
  month?: number
  year?: number
}

export interface MonthlySummaryItem {
  employee_id: string
  employee_name: string
  present_days: number
  late_days: number
  absent_days: number
  justified_days: number
  total_hours: number
}

export function useAttendance(config: UseAttendanceConfig = {}) {
  const { user } = useAuthStore()
  const isMounted = useRef(true)

  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [summary, setSummary] = useState<MonthlySummaryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // ─── Load today's attendance ─────────────────────────────────────────────
  const loadAttendance = useCallback(async () => {
    if (!user?.company_id) return
    const date = config.date ?? new Date().toISOString().split('T')[0]

    if (isMounted.current) setIsLoading(true)
    try {
      const data = config.employeeId
        ? attendanceService.getEmployeeAttendance(user.company_id, config.employeeId)
        : attendanceService.getToday(user.company_id, date)

      if (isMounted.current) {
        setAttendance(data)
        setError(null)
      }
    } catch (e: any) {
      if (isMounted.current) setError(e?.message ?? 'Erro ao carregar assiduidade')
    } finally {
      if (isMounted.current) setIsLoading(false)
    }
  }, [user?.company_id, config.date, config.employeeId])

  // ─── Load monthly summary ────────────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    if (!user?.company_id || config.month == null || config.year == null) return

    if (isMounted.current) setIsLoading(true)
    try {
      const data = attendanceService.getMonthlySummary(
        user.company_id,
        config.month,
        config.year
      ) as MonthlySummaryItem[]

      if (isMounted.current) {
        setSummary(data)
        setError(null)
      }
    } catch (e: any) {
      if (isMounted.current) setError(e?.message ?? 'Erro ao carregar resumo mensal')
    } finally {
      if (isMounted.current) setIsLoading(false)
    }
  }, [user?.company_id, config.month, config.year])

  // ─── Auto-load on mount / config change ─────────────────────────────────
  useEffect(() => {
    if (config.month != null && config.year != null) {
      loadSummary()
    } else {
      loadAttendance()
    }
  }, [loadAttendance, loadSummary, config.month, config.year])

  // ─── Actions ─────────────────────────────────────────────────────────────
  const clockIn = useCallback(
    async (employeeId: string, time: string): Promise<Attendance> => {
      if (!user?.company_id || !user.id) throw new Error('Sessão inválida')
      const date = config.date ?? new Date().toISOString().split('T')[0]

      const record = attendanceService.registerAttendance(
        {
          company_id: user.company_id,
          employee_id: employeeId,
          date,
          clock_in: time,
          clock_out: null,
          breaks: null,
          status: 'present',
          justification: null,
          total_minutes: 0,
        },
        user.id
      )

      if (isMounted.current) {
        setAttendance((prev: Attendance[]) => [record, ...prev])
      }
      return record
    },
    [user, config.date]
  )

  const clockOut = useCallback(
    async (id: string, time: string, totalMinutes: number): Promise<void> => {
      if (!user?.company_id || !user.id) throw new Error('Sessão inválida')

      attendanceService.updateAttendance(
        user.company_id,
        id,
        { clock_out: time, total_minutes: totalMinutes },
        user.id
      )

      if (isMounted.current) {
        setAttendance((prev: Attendance[]) =>
          prev.map((a: Attendance) =>
            a.id === id ? { ...a, clock_out: time, total_minutes: totalMinutes } : a
          )
        )
      }
    },
    [user]
  )

  const addManualEntry = useCallback(
    async (data: {
      employee_id: string
      date: string
      clock_in: string
      clock_out: string
      status: AttendanceStatus
      justification: string
      total_minutes: number
      breaks: null
    }): Promise<Attendance> => {
      if (!user?.company_id || !user.id) throw new Error('Sessão inválida')

      const record = attendanceService.registerAttendance(
        { ...data, company_id: user.company_id },
        user.id
      )

      if (isMounted.current) {
        setAttendance((prev: Attendance[]) => [record, ...prev])
      }
      return record
    },
    [user]
  )

  const refresh = useCallback(() => {
    if (config.month != null && config.year != null) {
      loadSummary()
    } else {
      loadAttendance()
    }
  }, [loadAttendance, loadSummary, config.month, config.year])

  return {
    attendance,
    summary,
    isLoading,
    error,
    clockIn,
    clockOut,
    addManualEntry,
    refresh,
  }
}
