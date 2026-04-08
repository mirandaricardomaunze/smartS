import { payrollRepository } from '@/repositories/payrollRepository'
import { Payroll, Employee } from '../types'
import { CountryConfig, calculatePayrollTax } from '@/config/countries'

export const payrollService = {
  getPeriodPayroll(companyId: string, month: number, year: number): Payroll[] {
    return payrollRepository.getByPeriod(companyId, month, year)
  },

  getEmployeePayroll(companyId: string, employeeId: string): Payroll[] {
    return payrollRepository.getEmployeePayroll(companyId, employeeId)
  },

  calculateEmployeePayroll(
    companyId: string,
    employee: Employee,
    month: number,
    year: number,
    countryConfig: CountryConfig,
    extra: { subsidy_meal?: number; subsidy_transport?: number; bonus?: number; overtime_pay?: number } = {}
  ): Payroll {
    const baseSalary = employee.base_salary || 0
    const subsidy_meal = extra.subsidy_meal || 0
    const subsidy_transport = extra.subsidy_transport || 0
    const bonus = extra.bonus || 0
    const overtime_pay = extra.overtime_pay || 0
    const grossSalary = baseSalary + subsidy_meal + subsidy_transport + bonus + overtime_pay

    const { deduction_social, deduction_income } = calculatePayrollTax(grossSalary, countryConfig)
    const netSalary = grossSalary - deduction_social - deduction_income

    return payrollRepository.create({
      company_id: companyId,
      employee_id: employee.id,
      period_month: month,
      period_year: year,
      base_salary: baseSalary,
      overtime_pay,
      bonus,
      subsidy_meal,
      subsidy_transport,
      deduction_inss: deduction_social,
      deduction_irps: deduction_income,
      deduction_other: 0,
      net_salary: netSalary,
      status: 'processed',
      payment_date: null,
    })
  },

  lockPeriod(companyId: string, month: number, year: number): void {
    payrollRepository.lockPeriod(companyId, month, year)
  },

  getSocialSecurityDeclaration(companyId: string, month: number, year: number, countryConfig: CountryConfig) {
    const totals = payrollRepository.getPeriodTotals(companyId, month, year)
    if (!totals) return null

    const inssEmployer = (totals.total_base || 0) * countryConfig.tax.socialSecurity.employerRate

    return {
      ...totals,
      inss_employer: inssEmployer,
      total_inss: (totals.total_inss_employee || 0) + inssEmployer,
    }
  },

  /** @deprecated use getSocialSecurityDeclaration */
  getINSSDeclaration(companyId: string, month: number, year: number) {
    const totals = payrollRepository.getPeriodTotals(companyId, month, year)
    if (!totals) return null
    const inssEmployer = (totals.total_base || 0) * 0.04
    return {
      ...totals,
      inss_employer: inssEmployer,
      total_inss: (totals.total_inss_employee || 0) + inssEmployer,
    }
  },
}
