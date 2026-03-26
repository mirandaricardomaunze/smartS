import { payrollRepository } from '@/repositories/payrollRepository'
import { Payroll, Employee } from '../types'

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
    extra: { subsidy_meal?: number, subsidy_transport?: number, bonus?: number, overtime_pay?: number } = {}
  ): Payroll {
    const baseSalary = employee.base_salary || 0
    const subsidy_meal = extra.subsidy_meal || 0
    const subsidy_transport = extra.subsidy_transport || 0
    const bonus = extra.bonus || 0
    const overtime_pay = extra.overtime_pay || 0
    const grossSalary = baseSalary + subsidy_meal + subsidy_transport + bonus + overtime_pay

    const deduction_inss = grossSalary * 0.04
    
    // IRPS Calculation (Simplified 2024 Mozambican Table)
    let deduction_irps = 0
    const taxableIncome = grossSalary - deduction_inss

    if (taxableIncome > 150000) {
      deduction_irps = (taxableIncome - 150000) * 0.32 + 30000 
    } else if (taxableIncome > 60000) {
      deduction_irps = (taxableIncome - 60000) * 0.20 + 8000
    } else if (taxableIncome > 20000) {
      deduction_irps = (taxableIncome - 20000) * 0.10
    }

    const netSalary = grossSalary - deduction_inss - deduction_irps

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
      deduction_inss,
      deduction_irps,
      deduction_other: 0,
      net_salary: netSalary,
      status: 'processed',
      payment_date: null
    })
  },

  lockPeriod(companyId: string, month: number, year: number): void {
    payrollRepository.lockPeriod(companyId, month, year)
  },

  getINSSDeclaration(companyId: string, month: number, year: number) {
    const totals = payrollRepository.getPeriodTotals(companyId, month, year)
    if (!totals) return null

    // Company INSS is usually 4% as well
    const inssEmployer = (totals.total_base || 0) * 0.04
    
    return {
      ...totals,
      inss_employer: inssEmployer,
      total_inss: (totals.total_inss_employee || 0) + inssEmployer
    }
  }
}
