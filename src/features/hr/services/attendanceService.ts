import { attendanceRepository } from '@/repositories/attendanceRepository'
import { Attendance } from '../types'

export const attendanceService = {
  getToday(companyId: string, date: string): Attendance[] {
    return attendanceRepository.getToday(companyId, date)
  },

  getEmployeeAttendance(companyId: string, employeeId: string): Attendance[] {
    return attendanceRepository.getEmployeeAttendance(companyId, employeeId)
  },

  registerAttendance(data: Omit<Attendance, 'id' | 'created_at' | 'updated_at' | 'synced'>): Attendance {
    return attendanceRepository.create(data)
  },

  updateAttendance(companyId: string, id: string, data: Partial<Attendance>): void {
    attendanceRepository.update(companyId, id, data)
  },

  getMonthlySummary(companyId: string, month: number, year: number) {
    const monthStr = month.toString().padStart(2, '0')
    const yearStr = year.toString()
    return attendanceRepository.getPeriodSummary(companyId, monthStr, yearStr)
  }
}
