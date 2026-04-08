import { payrollService } from '../../features/hr/services/payrollService'
import { getCountryConfig } from '../../config/countries'

// ── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('@/repositories/payrollRepository', () => ({
  payrollRepository: {
    getByPeriod: jest.fn(),
    getEmployeePayroll: jest.fn(),
    create: jest.fn(),
    lockPeriod: jest.fn(),
    getPeriodTotals: jest.fn(),
  },
}))

import { payrollRepository } from '../../repositories/payrollRepository'

const mockRepo = payrollRepository as jest.Mocked<typeof payrollRepository>

beforeEach(() => jest.clearAllMocks())

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeEmployee(overrides: Record<string, unknown> = {}) {
  return {
    id: 'emp-1',
    company_id: 'company-1',
    position_id: 'pos-1',
    name: 'João Silva',
    bi_number: null,
    nit: null,
    address: null,
    contacts: null,
    photo_url: null,
    employment_type: 'permanent' as const,
    status: 'active' as const,
    contract_start_date: null,
    contract_end_date: null,
    emergency_contact: null,
    bank_details: null,
    nacionality: null,
    civil_status: null,
    bank_name: null,
    bank_account: null,
    nib: null,
    is_active: 1 as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    synced: 0 as const,
    base_salary: 50000,
    ...overrides,
  }
}

// ── getPeriodPayroll ─────────────────────────────────────────────────────────

describe('payrollService.getPeriodPayroll', () => {
  it('should delegate to repository', () => {
    const payrolls = [{ id: 'p-1' }]
    mockRepo.getByPeriod.mockReturnValue(payrolls as any)
    const result = payrollService.getPeriodPayroll('company-1', 1, 2024)
    expect(mockRepo.getByPeriod).toHaveBeenCalledWith('company-1', 1, 2024)
    expect(result).toEqual(payrolls)
  })
})

// ── getEmployeePayroll ───────────────────────────────────────────────────────

describe('payrollService.getEmployeePayroll', () => {
  it('should delegate to repository', () => {
    mockRepo.getEmployeePayroll.mockReturnValue([])
    payrollService.getEmployeePayroll('company-1', 'emp-1')
    expect(mockRepo.getEmployeePayroll).toHaveBeenCalledWith('company-1', 'emp-1')
  })
})

// ── lockPeriod ───────────────────────────────────────────────────────────────

describe('payrollService.lockPeriod', () => {
  it('should call repository lockPeriod', () => {
    payrollService.lockPeriod('company-1', 3, 2024)
    expect(mockRepo.lockPeriod).toHaveBeenCalledWith('company-1', 3, 2024)
  })
})

// ── calculateEmployeePayroll — Moçambique ────────────────────────────────────

describe('payrollService.calculateEmployeePayroll — MZ', () => {
  const mz = getCountryConfig('MZ')

  it('should call repository.create with calculated net salary', () => {
    const employee = makeEmployee({ base_salary: 50000 })
    mockRepo.create.mockReturnValue({ id: 'payroll-1' } as any)

    payrollService.calculateEmployeePayroll('company-1', employee as any, 1, 2024, mz)

    expect(mockRepo.create).toHaveBeenCalledTimes(1)
    const call = mockRepo.create.mock.calls[0][0]
    expect(call.base_salary).toBe(50000)
    expect(call.deduction_inss).toBeCloseTo(2000) // 4% of 50 000
    expect(call.net_salary).toBeLessThan(50000)
    expect(call.net_salary).toBeGreaterThan(0)
  })

  it('should include subsidies in gross salary calculation', () => {
    const employee = makeEmployee({ base_salary: 40000 })
    mockRepo.create.mockReturnValue({ id: 'payroll-2' } as any)

    payrollService.calculateEmployeePayroll('company-1', employee as any, 2, 2024, mz, {
      subsidy_meal: 5000,
      subsidy_transport: 3000,
    })

    const call = mockRepo.create.mock.calls[0][0]
    // gross = 40000 + 5000 + 3000 = 48000
    // social = 48000 * 0.04 = 1920
    expect(call.deduction_inss).toBeCloseTo(1920)
    expect(call.subsidy_meal).toBe(5000)
    expect(call.subsidy_transport).toBe(3000)
  })

  it('should include bonus and overtime in gross salary', () => {
    const employee = makeEmployee({ base_salary: 30000 })
    mockRepo.create.mockReturnValue({ id: 'payroll-3' } as any)

    payrollService.calculateEmployeePayroll('company-1', employee as any, 3, 2024, mz, {
      bonus: 10000,
      overtime_pay: 5000,
    })

    const call = mockRepo.create.mock.calls[0][0]
    // gross = 30000 + 10000 + 5000 = 45000
    expect(call.deduction_inss).toBeCloseTo(45000 * 0.04)
    expect(call.bonus).toBe(10000)
    expect(call.overtime_pay).toBe(5000)
  })

  it('should set status to processed', () => {
    const employee = makeEmployee()
    mockRepo.create.mockReturnValue({ id: 'payroll-4' } as any)

    payrollService.calculateEmployeePayroll('company-1', employee as any, 4, 2024, mz)

    const call = mockRepo.create.mock.calls[0][0]
    expect(call.status).toBe('processed')
  })

  it('should handle employee with no base salary (zero)', () => {
    const employee = makeEmployee({ base_salary: 0 })
    mockRepo.create.mockReturnValue({ id: 'payroll-5' } as any)

    payrollService.calculateEmployeePayroll('company-1', employee as any, 5, 2024, mz)

    const call = mockRepo.create.mock.calls[0][0]
    expect(call.base_salary).toBe(0)
    expect(call.net_salary).toBe(0)
    expect(call.deduction_inss).toBe(0)
    expect(call.deduction_irps).toBe(0)
  })

  it('should handle employee with undefined base_salary', () => {
    const employee = makeEmployee({ base_salary: undefined })
    mockRepo.create.mockReturnValue({ id: 'payroll-6' } as any)

    payrollService.calculateEmployeePayroll('company-1', employee as any, 6, 2024, mz)

    const call = mockRepo.create.mock.calls[0][0]
    expect(call.base_salary).toBe(0)
  })

  it('should correctly assign period month and year', () => {
    const employee = makeEmployee()
    mockRepo.create.mockReturnValue({ id: 'payroll-7' } as any)

    payrollService.calculateEmployeePayroll('company-1', employee as any, 12, 2025, mz)

    const call = mockRepo.create.mock.calls[0][0]
    expect(call.period_month).toBe(12)
    expect(call.period_year).toBe(2025)
    expect(call.company_id).toBe('company-1')
    expect(call.employee_id).toBe('emp-1')
  })
})

// ── calculateEmployeePayroll — GENERIC (zero-tax) ───────────────────────────

describe('payrollService.calculateEmployeePayroll — GENERIC', () => {
  const generic = getCountryConfig('GENERIC')

  it('should have zero deductions with generic config', () => {
    const employee = makeEmployee({ base_salary: 100000 })
    mockRepo.create.mockReturnValue({ id: 'payroll-gen' } as any)

    payrollService.calculateEmployeePayroll('company-1', employee as any, 1, 2024, generic)

    const call = mockRepo.create.mock.calls[0][0]
    expect(call.deduction_inss).toBe(0)
    expect(call.deduction_irps).toBe(0)
    expect(call.net_salary).toBe(100000)
  })
})

// ── getSocialSecurityDeclaration ─────────────────────────────────────────────

describe('payrollService.getSocialSecurityDeclaration', () => {
  const mz = getCountryConfig('MZ')

  it('should return null when no period totals found', () => {
    mockRepo.getPeriodTotals.mockReturnValue(null)
    const result = payrollService.getSocialSecurityDeclaration('company-1', 1, 2024, mz)
    expect(result).toBeNull()
  })

  it('should calculate employer INSS at employer rate', () => {
    mockRepo.getPeriodTotals.mockReturnValue({
      total_base: 200000,
      total_inss_employee: 8000, // 4% of 200 000
    } as any)

    const result = payrollService.getSocialSecurityDeclaration('company-1', 1, 2024, mz)

    // employer rate for MZ = 4%
    expect(result!.inss_employer).toBeCloseTo(200000 * 0.04)
    // total = employee + employer
    expect(result!.total_inss).toBeCloseTo(8000 + 8000)
  })

  it('should include period totals in result', () => {
    const totals = { total_base: 150000, total_inss_employee: 6000, total_net: 140000 }
    mockRepo.getPeriodTotals.mockReturnValue(totals as any)

    const result = payrollService.getSocialSecurityDeclaration('company-1', 2, 2024, mz)

    expect(result).toMatchObject(totals)
  })
})
