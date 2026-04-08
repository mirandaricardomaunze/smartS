export interface TaxBracket {
  threshold: number
  rate: number
  base: number
}

export interface TaxConfig {
  socialSecurity: {
    employeeLabel: string
    employeeRate: number
    employerLabel: string
    employerRate: number
    reportTitle: string
    portalNote?: string
  }
  incomeTax: {
    label: string
    brackets: TaxBracket[]
    taxableBase: 'gross' | 'gross_minus_social'
  }
  taxIdLabel: string
}

export interface CountryConfig {
  name: string
  code: string
  locale: string
  currency: string
  flag: string
  tax: TaxConfig
}

export const COUNTRIES: Record<string, CountryConfig> = {
  MZ: {
    name: 'Moçambique',
    code: 'MZ',
    locale: 'pt-MZ',
    currency: 'MZN',
    flag: '🇲🇿',
    tax: {
      socialSecurity: {
        employeeLabel: 'INSS',
        employeeRate: 0.04,
        employerLabel: 'INSS (Empresa)',
        employerRate: 0.04,
        reportTitle: 'Declaração de Contribuições (INSS)',
        portalNote: 'Esta guia deve ser validada contra o portal SISSMO para submissão oficial.',
      },
      incomeTax: {
        label: 'IRPS',
        taxableBase: 'gross_minus_social',
        brackets: [
          { threshold: 144500, rate: 0.32, base: 30487.5 },
          { threshold: 60000, rate: 0.25, base: 9362.5 },
          { threshold: 32500, rate: 0.20, base: 3862.5 },
          { threshold: 20250, rate: 0.15, base: 2025 },
          { threshold: 0, rate: 0.10, base: 0 },
        ],
      },
      taxIdLabel: 'NUIT',
    },
  },
  AO: {
    name: 'Angola',
    code: 'AO',
    locale: 'pt-AO',
    currency: 'AOA',
    flag: '🇦🇴',
    tax: {
      socialSecurity: {
        employeeLabel: 'Seguridad Social (3%)',
        employeeRate: 0.03,
        employerLabel: 'Seg. Social - Empresa (8%)',
        employerRate: 0.08,
        reportTitle: 'Relatório Mensal de Segurança Social',
      },
      incomeTax: {
        label: 'IRT (Conta de Outrem)',
        taxableBase: 'gross_minus_social',
        brackets: [
          { threshold: 10000000, rate: 0.25, base: 2080000 },
          { threshold: 5000000, rate: 0.24, base: 880000 },
          { threshold: 2000000, rate: 0.22, base: 220000 },
          { threshold: 1000000, rate: 0.21, base: 100000 },
          { threshold: 500000, rate: 0.19, base: 43000 },
          { threshold: 300000, rate: 0.18, base: 22500 },
          { threshold: 200000, rate: 0.16, base: 12500 },
          { threshold: 150000, rate: 0.13, base: 3000 },
          { threshold: 100000, rate: 0.10, base: 0 },
        ],
      },
      taxIdLabel: 'NIF',
    },
  },
  PT: {
    name: 'Portugal',
    code: 'PT',
    locale: 'pt-PT',
    currency: 'EUR',
    flag: '🇵🇹',
    tax: {
      socialSecurity: {
        employeeLabel: 'Segurança Social (11%)',
        employeeRate: 0.11,
        employerLabel: 'Seg. Social - TSU (23.75%)',
        employerRate: 0.2375,
        reportTitle: 'Declaração Mensal de Remunerações (DMR)',
      },
      incomeTax: {
        label: 'IRS (Escalões 2024)',
        taxableBase: 'gross_minus_social',
        brackets: [
          { threshold: 81199, rate: 0.48, base: 22862 },
          { threshold: 38631, rate: 0.45, base: 8286 },
          { threshold: 25075, rate: 0.35, base: 5523 },
          { threshold: 16472, rate: 0.285, base: 3230 },
          { threshold: 11284, rate: 0.24, base: 1663 },
          { threshold: 7479, rate: 0.21, base: 821 },
          { threshold: 0, rate: 0.145, base: 0 },
        ],
      },
      taxIdLabel: 'NIF',
    },
  },
  BR: {
    name: 'Brasil',
    code: 'BR',
    locale: 'pt-BR',
    currency: 'BRL',
    flag: '🇧🇷',
    tax: {
      socialSecurity: {
        employeeLabel: 'INSS',
        employeeRate: 0.075,
        employerLabel: 'FGTS (Reservado)',
        employerRate: 0.08,
        reportTitle: 'Folha de Pagamento - SEFIP/eSocial',
      },
      incomeTax: {
        label: 'IRRF (Mensal)',
        taxableBase: 'gross_minus_social',
        brackets: [
          { threshold: 4664.68, rate: 0.275, base: 893.66 },
          { threshold: 3751.05, rate: 0.225, base: 662.77 },
          { threshold: 2826.65, rate: 0.15, base: 381.44 },
          { threshold: 2259.20, rate: 0.075, base: 169.44 },
          { threshold: 0, rate: 0, base: 0 },
        ],
      },
      taxIdLabel: 'CPF',
    },
  },
  ZA: {
    name: 'South Africa',
    code: 'ZA',
    locale: 'en-ZA',
    currency: 'ZAR',
    flag: '🇿🇦',
    tax: {
      socialSecurity: {
        employeeLabel: 'UIF',
        employeeRate: 0.01,
        employerLabel: 'UIF (Employer)',
        employerRate: 0.01,
        reportTitle: 'UIF Contributions Declaration',
      },
      incomeTax: {
        label: 'PAYE',
        taxableBase: 'gross',
        brackets: [
          { threshold: 1817000, rate: 0.45, base: 644489 },
          { threshold: 1500001, rate: 0.41, base: 514089 },
          { threshold: 1043001, rate: 0.39, base: 321890 },
          { threshold: 488700, rate: 0.36, base: 122670 },
          { threshold: 237101, rate: 0.31, base: 44268 },
          { threshold: 91251, rate: 0.26, base: 20248 },
          { threshold: 0, rate: 0.18, base: 0 },
        ],
      },
      taxIdLabel: 'SARS Number',
    },
  },
  GENERIC: {
    name: 'Genérico / Personalizado',
    code: 'GENERIC',
    locale: 'en-US',
    currency: 'USD',
    flag: '🌐',
    tax: {
      socialSecurity: {
        employeeLabel: 'Social Security',
        employeeRate: 0,
        employerLabel: 'Social Security (Employer)',
        employerRate: 0,
        reportTitle: 'Social Security Contributions',
      },
      incomeTax: {
        label: 'Income Tax',
        taxableBase: 'gross_minus_social',
        brackets: [],
      },
      taxIdLabel: 'Tax ID',
    },
  },
}

export function getCountryConfig(code: string): CountryConfig {
  return COUNTRIES[code] ?? COUNTRIES['GENERIC']
}

export function calculatePayrollTax(
  grossSalary: number,
  config: CountryConfig
): { deduction_social: number; deduction_income: number; net_salary: number } {
  const { tax } = config
  const deduction_social = grossSalary * tax.socialSecurity.employeeRate

  const taxableIncome =
    tax.incomeTax.taxableBase === 'gross_minus_social'
      ? grossSalary - deduction_social
      : grossSalary

  let deduction_income = 0
  for (const bracket of tax.incomeTax.brackets) {
    if (taxableIncome > bracket.threshold) {
      deduction_income = (taxableIncome - bracket.threshold) * bracket.rate + bracket.base
      break
    }
  }

  return {
    deduction_social,
    deduction_income,
    net_salary: grossSalary - deduction_social - deduction_income,
  }
}
