import { BaseEntity } from '@/types'

export type EmploymentType = 'permanent' | 'fixed-term' | 'probation'
export type EmployeeStatus = 'active' | 'suspended' | 'terminated'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'justified'
export type LeaveType = 'vacation' | 'sick' | 'maternity' | 'paternity' | 'other'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'
export type PayrollStatus = 'draft' | 'paid' | 'cancelled' | 'processed'

export interface Department extends BaseEntity {
  name: string
  description: string | null
  is_active: 0 | 1
}

export interface Position extends BaseEntity {
  department_id: string
  title: string
  base_salary: number
  is_active: 0 | 1
  department?: string // JOINED
}

export interface Employee extends BaseEntity {
  position_id: string | null
  name: string
  bi_number: string | null
  nit: string | null
  address: string | null
  contacts: string | null // JSON { phone: string, email: string }
  photo_url: string | null
  employment_type: EmploymentType
  status: EmployeeStatus
  contract_start_date: string | null
  contract_end_date: string | null
  emergency_contact: string | null
  bank_details: string | null
  nacionality: string | null
  civil_status: string | null
  bank_name: string | null
  bank_account: string | null
  nib: string | null
  base_salary?: number // From Position
  is_active: 0 | 1
  position?: string // JOINED
  department?: string // JOINED
}

export interface Attendance extends BaseEntity {
  employee_id: string
  date: string // YYYY-MM-DD
  clock_in: string | null
  clock_out: string | null
  breaks: string | null // JSON array
  status: AttendanceStatus
  justification: string | null
  total_minutes: number
  employee_name?: string // JOINED
}

export interface Leave extends BaseEntity {
  employee_id: string
  type: LeaveType
  start_date: string
  end_date: string
  status: LeaveStatus
  reason: string | null
  approved_by: string | null
  employee_name?: string // JOINED
}

export interface Payroll extends BaseEntity {
  employee_id: string
  period_month: number
  period_year: number
  base_salary: number
  overtime_pay: number
  bonus: number
  subsidy_meal: number
  subsidy_transport: number
  deduction_inss: number
  deduction_irps: number
  deduction_other: number
  net_salary: number
  status: PayrollStatus
  payment_date: string | null
  employee_name?: string // JOINED
}
