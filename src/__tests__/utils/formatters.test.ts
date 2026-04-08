import {
  formatCurrency,
  getCurrencySymbol,
  formatDate,
  formatShortDate,
} from '../../utils/formatters'

// ── formatCurrency ──────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('should format USD by default', () => {
    const result = formatCurrency(1000)
    expect(result).toContain('1,000')
    expect(result).toContain('$') // symbol or $1,000.00
  })

  it('should format MZN', () => {
    const result = formatCurrency(50000, 'MZN', 'pt-MZ')
    expect(result).toContain('50')
    expect(result).toBeTruthy()
  })

  it('should format EUR', () => {
    const result = formatCurrency(2500.5, 'EUR', 'pt-PT')
    expect(result).toContain('2')
    expect(result).toBeTruthy()
  })

  it('should format BRL', () => {
    const result = formatCurrency(100, 'BRL', 'pt-BR')
    expect(result).toContain('100')
  })

  it('should format zero correctly', () => {
    const result = formatCurrency(0, 'USD', 'en-US')
    expect(result).toContain('0')
  })

  it('should format negative values', () => {
    const result = formatCurrency(-500, 'USD', 'en-US')
    expect(result).toContain('500')
    // Negative sign or parentheses depending on locale
    expect(result.includes('-') || result.includes('(')).toBe(true)
  })
})

// ── getCurrencySymbol ───────────────────────────────────────────────────────

describe('getCurrencySymbol', () => {
  it('should return MT for MZN', () => {
    expect(getCurrencySymbol('MZN')).toBe('MT')
  })

  it('should return Kz for AOA', () => {
    expect(getCurrencySymbol('AOA')).toBe('Kz')
  })

  it('should return € for EUR', () => {
    expect(getCurrencySymbol('EUR')).toBe('€')
  })

  it('should return $ for USD', () => {
    expect(getCurrencySymbol('USD')).toBe('$')
  })

  it('should return R$ for BRL', () => {
    expect(getCurrencySymbol('BRL')).toBe('R$')
  })

  it('should return R for ZAR', () => {
    expect(getCurrencySymbol('ZAR')).toBe('R')
  })

  it('should return the currency code for unknown currencies', () => {
    expect(getCurrencySymbol('GBP')).toBe('GBP')
    expect(getCurrencySymbol('JPY')).toBe('JPY')
  })

  it('should return $ when called with no arguments', () => {
    expect(getCurrencySymbol()).toBe('$')
  })
})

// ── formatDate ──────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('should return --- for null', () => {
    expect(formatDate(null)).toBe('---')
  })

  it('should return --- for undefined', () => {
    expect(formatDate(undefined)).toBe('---')
  })

  it('should return --- for empty string', () => {
    expect(formatDate('')).toBe('---')
  })

  it('should return --- for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('---')
  })

  it('should format a valid ISO date string', () => {
    const result = formatDate('2024-01-15T10:30:00.000Z', 'en-US')
    expect(result).not.toBe('---')
    expect(result).toContain('2024')
    expect(result).toContain('01')
    expect(result).toContain('15')
  })

  it('should include time (hours and minutes)', () => {
    const result = formatDate('2024-06-20T14:45:00.000Z', 'en-US')
    expect(result).not.toBe('---')
    // The result should contain hour/minute values
    expect(result.length).toBeGreaterThan(6)
  })

  it('should use default locale en-US when not specified', () => {
    const result = formatDate('2024-03-10T08:00:00.000Z')
    expect(result).not.toBe('---')
  })
})

// ── formatShortDate ─────────────────────────────────────────────────────────

describe('formatShortDate', () => {
  it('should return --- for null', () => {
    expect(formatShortDate(null)).toBe('---')
  })

  it('should return --- for undefined', () => {
    expect(formatShortDate(undefined)).toBe('---')
  })

  it('should return --- for empty string', () => {
    expect(formatShortDate('')).toBe('---')
  })

  it('should return --- for invalid date string', () => {
    expect(formatShortDate('invalid')).toBe('---')
  })

  it('should format a valid date without time', () => {
    const result = formatShortDate('2024-12-25T00:00:00.000Z', 'en-US')
    expect(result).not.toBe('---')
    expect(result).toContain('2024')
    expect(result).toContain('12')
    expect(result).toContain('25')
  })

  it('should not include time in output', () => {
    const full = formatDate('2024-01-01T10:30:00.000Z', 'en-US')
    const short = formatShortDate('2024-01-01T10:30:00.000Z', 'en-US')
    // Short date should be shorter than full date (no time component)
    expect(short.length).toBeLessThan(full.length)
  })
})
