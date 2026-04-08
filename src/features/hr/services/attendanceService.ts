import { attendanceRepository } from '@/repositories/attendanceRepository'
import { historyRepository } from '@/repositories/historyRepository'
import { Attendance } from '../types'

/**
 * Pure attendance service — receives all required context as parameters.
 * No Zustand/React imports. Fully testable and side-effect free.
 */
export const attendanceService = {
  getToday(companyId: string, date: string): Attendance[] {
    return attendanceRepository.getToday(companyId, date)
  },

  getEmployeeAttendance(companyId: string, employeeId: string): Attendance[] {
    return attendanceRepository.getEmployeeAttendance(companyId, employeeId)
  },

  registerAttendance(
    data: Omit<Attendance, 'id' | 'created_at' | 'updated_at' | 'synced'>,
    userId: string
  ): Attendance {
    const record = attendanceRepository.create(data)

    historyRepository.log(
      record.company_id,
      'CREATE',
      'attendance',
      record.id,
      userId,
      { employee_id: record.employee_id, date: record.date, status: record.status }
    )

    return record
  },

  updateAttendance(
    companyId: string,
    id: string,
    data: Partial<Attendance>,
    userId: string
  ): void {
    attendanceRepository.update(companyId, id, data)

    historyRepository.log(
      companyId,
      'UPDATE',
      'attendance',
      id,
      userId,
      data
    )
  },

  getMonthlySummary(companyId: string, month: number, year: number) {
    const monthStr = month.toString().padStart(2, '0')
    const yearStr = year.toString()
    return attendanceRepository.getPeriodSummary(companyId, monthStr, yearStr)
  },
}
