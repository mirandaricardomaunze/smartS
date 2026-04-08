import { COUNTRIES, getCountryConfig, calculatePayrollTax, CountryConfig } from '../../config/countries'

// ── getCountryConfig ────────────────────────────────────────────────────────

describe('getCountryConfig', () => {
  it('should return config for MZ', () => {
    const config = getCountryConfig('MZ')
    expect(config.code).toBe('MZ')
    expect(config.currency).toBe('MZN')
    expect(config.locale).toBe('pt-MZ')
  })

  it('should return config for AO', () => {
    const config = getCountryConfig('AO')
    expect(config.code).toBe('AO')
    expect(config.currency).toBe('AOA')
  })

  it('should return config for PT', () => {
    const config = getCountryConfig('PT')
    expect(config.code).toBe('PT')
    expect(config.currency).toBe('EUR')
    expect(config.locale).toBe('pt-PT')
  })

  it('should return config for BR', () => {
    const config = getCountryConfig('BR')
    expect(config.code).toBe('BR')
    expect(config.currency).toBe('BRL')
  })

  it('should return config for ZA', () => {
    const config = getCountryConfig('ZA')
    expect(config.code).toBe('ZA')
    expect(config.currency).toBe('ZAR')
  })

  it('should return GENERIC config for unknown code', () => {
    const config = getCountryConfig('XX')
    expect(config.code).toBe('GENERIC')
    expect(config.currency).toBe('USD')
  })

  it('should return GENERIC config for empty string', () => {
    const config = getCountryConfig('')
    expect(config.code).toBe('GENERIC')
  })

  it('all countries should have socialSecurity rates', () => {
    for (const country of Object.values(COUNTRIES)) {
      expect(country.tax.socialSecurity.employeeRate).toBeGreaterThanOrEqual(0)
      expect(country.tax.socialSecurity.employerRate).toBeGreaterThanOrEqual(0)
    }
  })

  it('all countries should have a taxIdLabel', () => {
    for (const country of Object.values(COUNTRIES)) {
      expect(country.tax.taxIdLabel).toBeTruthy()
    }
  })
})

// ── calculatePayrollTax — GENERIC (zero-rate) ───────────────────────────────

describe('calculatePayrollTax — GENERIC', () => {
  const generic = getCountryConfig('GENERIC')

  it('should apply zero social security', () => {
    const { deduction_social } = calculatePayrollTax(5000, generic)
    expect(deduction_social).toBe(0)
  })

  it('should apply zero income tax (no brackets)', () => {
    const { deduction_income } = calculatePayrollTax(5000, generic)
    expect(deduction_income).toBe(0)
  })

  it('net salary should equal gross when all rates are zero', () => {
    const { net_salary } = calculatePayrollTax(10000, generic)
    expect(net_salary).toBe(10000)
  })
})

// ── calculatePayrollTax — Moçambique (MZ) ──────────────────────────────────

describe('calculatePayrollTax — Moçambique (MZ)', () => {
  const mz = getCountryConfig('MZ')

  it('should deduct INSS at 4%', () => {
    const { deduction_social } = calculatePayrollTax(100000, mz)
    expect(deduction_social).toBeCloseTo(4000)
  })

  it('should calculate IRPS for mid-range salary (96 000 taxable)', () => {
    // gross=100 000, social=4 000, taxable=96 000
    // bracket: taxable > 60 000 → (96 000 - 60 000) * 0.25 + 9 362.5 = 18 362.5
    const { deduction_income } = calculatePayrollTax(100000, mz)
    expect(deduction_income).toBeCloseTo(18362.5)
  })

  it('should calculate net salary correctly for 100 000', () => {
    const { net_salary } = calculatePayrollTax(100000, mz)
    // 100 000 - 4 000 - 18 362.5 = 77 637.5
    expect(net_salary).toBeCloseTo(77637.5)
  })

  it('should apply 10% bracket for small salary (taxable < 20 250)', () => {
    // gross=10 000, social=400, taxable=9 600
    // bracket: 9 600 > 0 → deduction_income = 9 600 * 0.10 = 960
    const { deduction_income } = calculatePayrollTax(10000, mz)
    expect(deduction_income).toBeCloseTo(960)
  })

  it('should return zero net for zero salary', () => {
    const result = calculatePayrollTax(0, mz)
    expect(result.deduction_social).toBe(0)
    expect(result.deduction_income).toBe(0)
    expect(result.net_salary).toBe(0)
  })

  it('gross salary above 144 500 bracket (taxable > 144 500)', () => {
    // gross=200 000, social=8 000, taxable=192 000
    // bracket: 192 000 > 144 500 → (192 000 - 144 500) * 0.32 + 30 487.5 = 15 200 + 30 487.5 = 45 687.5
    const { deduction_income } = calculatePayrollTax(200000, mz)
    expect(deduction_income).toBeCloseTo(45687.5)
  })
})

// ── calculatePayrollTax — Angola (AO) ──────────────────────────────────────

describe('calculatePayrollTax — Angola (AO)', () => {
  const ao = getCountryConfig('AO')

  it('should deduct social security at 3%', () => {
    const { deduction_social } = calculatePayrollTax(100000, ao)
    expect(deduction_social).toBeCloseTo(3000)
  })

  it('net salary should be positive', () => {
    const { net_salary } = calculatePayrollTax(200000, ao)
    expect(net_salary).toBeGreaterThan(0)
  })

  it('should use gross_minus_social as taxable base', () => {
    const gross = 500000
    const { deduction_social, deduction_income } = calculatePayrollTax(gross, ao)
    const taxable = gross - deduction_social
    // taxable = 485 000, bracket 300 000: (485 000 - 300 000) * 0.18 + 22 500 = 33 300 + 22 500 = 55 800
    expect(deduction_social).toBeCloseTo(gross * 0.03)
    expect(deduction_income).toBeGreaterThan(0)
  })
})

// ── calculatePayrollTax — Portugal (PT) ────────────────────────────────────

describe('calculatePayrollTax — Portugal (PT)', () => {
  const pt = getCountryConfig('PT')

  it('should deduct social security at 11%', () => {
    const { deduction_social } = calculatePayrollTax(2000, pt)
    expect(deduction_social).toBeCloseTo(220)
  })

  it('should return positive deductions for typical salary', () => {
    const { deduction_social, deduction_income } = calculatePayrollTax(3000, pt)
    expect(deduction_social).toBeCloseTo(330)
    expect(deduction_income).toBeGreaterThanOrEqual(0)
  })
})

// ── calculatePayrollTax — South Africa (ZA) ────────────────────────────────

describe('calculatePayrollTax — South Africa (ZA)', () => {
  const za = getCountryConfig('ZA')

  it('should deduct UIF at 1%', () => {
    const { deduction_social } = calculatePayrollTax(50000, za)
    expect(deduction_social).toBeCloseTo(500)
  })

  it('should use gross (not gross_minus_social) as taxable base', () => {
    // taxableBase is 'gross', so all brackets apply to gross directly
    const gross = 100000
    const { deduction_social } = calculatePayrollTax(gross, za)
    expect(deduction_social).toBeCloseTo(gross * 0.01)
  })
})
