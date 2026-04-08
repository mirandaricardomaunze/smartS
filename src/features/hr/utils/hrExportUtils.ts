import * as Print from 'expo-print'
import { shareAsync } from 'expo-sharing'
import { Payroll, Employee } from '@/features/hr/types'
import { CountryConfig } from '@/config/countries'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export async function generatePayslipPDF(
  payroll: Payroll,
  employee: Employee,
  countryConfig: CountryConfig,
  companyName: string = 'SmartS Business'
) {
  const { tax, locale, currency } = countryConfig
  const fmt = (n: number) => n.toLocaleString(locale, { minimumFractionDigits: 2 })
  const monthLabel = MONTH_NAMES[payroll.period_month - 1]

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; align-items: center; }
          .company-info h1 { margin: 0; color: #4f46e5; font-size: 28px; font-weight: 900; }
          .payslip-details { text-align: right; }
          .employee-card { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 30px; }
          .section-label { font-size: 10px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; font-weight: bold; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th { text-align: left; padding: 12px; background-color: #4f46e5; color: white; font-size: 11px; text-transform: uppercase; }
          .table td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .total-box { margin-top: 30px; padding: 25px; background-color: #1e293b; color: white; border-radius: 12px; text-align: right; }
          .footer { margin-top: 60px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          .amount { font-family: monospace; font-weight: bold; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; background: #4f46e5; color: white; font-size: 10px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>${companyName}</h1>
            <p style="margin: 5px 0 0 0; color: #64748b; font-weight: bold;">Recibo de Vencimento</p>
          </div>
          <div class="payslip-details">
            <span class="badge">${monthLabel} ${payroll.period_year}</span>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">Emitido em: ${new Date().toLocaleDateString(locale)}</p>
          </div>
        </div>

        <div class="employee-card">
          <p class="section-label">Colaborador</p>
          <p style="font-size: 20px; font-weight: 900; margin: 8px 0 4px 0;">${employee.name}</p>
          <p style="margin: 0; color: #64748b; font-size: 13px;">${employee.position || '—'} &nbsp;|&nbsp; ${tax.taxIdLabel}: ${employee.nit || '—'}</p>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th style="text-align: right;">Vencimentos</th>
              <th style="text-align: right;">Deduções</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Salário Base</td>
              <td style="text-align: right;" class="amount">${fmt(payroll.base_salary)}</td>
              <td></td>
            </tr>
            ${payroll.overtime_pay > 0 ? `
            <tr>
              <td>Horas Extra</td>
              <td style="text-align: right;" class="amount">${fmt(payroll.overtime_pay)}</td>
              <td></td>
            </tr>` : ''}
            ${(payroll.subsidy_meal + payroll.subsidy_transport) > 0 ? `
            <tr>
              <td>Subsídios (Alimentação + Transporte)</td>
              <td style="text-align: right;" class="amount">${fmt(payroll.subsidy_meal + payroll.subsidy_transport)}</td>
              <td></td>
            </tr>` : ''}
            ${payroll.bonus > 0 ? `
            <tr>
              <td>Prémios / Bónus</td>
              <td style="text-align: right;" class="amount">${fmt(payroll.bonus)}</td>
              <td></td>
            </tr>` : ''}
            <tr>
              <td>${tax.socialSecurity.employeeLabel} (${(tax.socialSecurity.employeeRate * 100).toFixed(1)}%)</td>
              <td></td>
              <td style="text-align: right; color: #ef4444;" class="amount">-${fmt(payroll.deduction_inss)}</td>
            </tr>
            <tr>
              <td>${tax.incomeTax.label}</td>
              <td></td>
              <td style="text-align: right; color: #ef4444;" class="amount">-${fmt(payroll.deduction_irps)}</td>
            </tr>
            ${payroll.deduction_other > 0 ? `
            <tr>
              <td>Outras Deduções</td>
              <td></td>
              <td style="text-align: right; color: #ef4444;" class="amount">-${fmt(payroll.deduction_other)}</td>
            </tr>` : ''}
          </tbody>
        </table>

        <div class="total-box">
          <p style="font-size: 12px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7;">Líquido a Receber</p>
          <h2 style="margin: 0; font-size: 34px;">${fmt(payroll.net_salary)} <span style="font-size: 16px; opacity: 0.8;">${currency}</span></h2>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px;">
          <div style="text-align: center;">
            <div style="border-top: 1px solid #94a3b8; padding-top: 10px;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">Assinatura do Colaborador</p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">${employee.name}</p>
            </div>
          </div>
          <div style="text-align: center;">
            <div style="border-top: 1px solid #94a3b8; padding-top: 10px;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">Assinatura da Entidade Empregadora</p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">${companyName}</p>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Gerado por SmartS RH &nbsp;•&nbsp; ${companyName} &nbsp;•&nbsp; ${countryConfig.name}</p>
          <p style="margin-top: 4px;">Documento gerado electronicamente em ${new Date().toLocaleDateString(locale)}.</p>
        </div>
      </body>
    </html>
  `

  const { uri } = await Print.printToFileAsync({ html })
  await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' })
}

export async function generateAttendancePDF(
  summary: any[],
  month: number,
  year: number,
  countryConfig: CountryConfig,
  companyName: string = 'SmartS Business'
) {
  const { locale } = countryConfig
  const monthLabel = MONTH_NAMES[month - 1]
  const totalPresent = summary.reduce((acc, i) => acc + (i.present_days ?? 0), 0)
  const totalHours = summary.reduce((acc, i) => acc + Math.round(i.total_hours ?? 0), 0)

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; align-items: center; }
          .company-info h1 { margin: 0; color: #4f46e5; font-size: 28px; font-weight: 900; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 30px; }
          .summary-card { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; }
          .summary-card .label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 6px; }
          .summary-card .value { font-size: 24px; font-weight: 900; color: #4f46e5; }
          .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .table th { text-align: left; padding: 12px 15px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 11px; text-transform: uppercase; color: #64748b; }
          .table td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .table tr:hover td { background: #f8fafc; }
          .badge { padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; }
          .badge-good { background: #d1fae5; color: #065f46; }
          .badge-regular { background: #fef3c7; color: #92400e; }
          .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>${companyName}</h1>
            <p style="margin: 5px 0 0 0; color: #64748b; font-weight: bold;">Relatório de Assiduidade Mensal</p>
          </div>
          <div style="text-align: right">
            <h3 style="margin: 0; color: #4f46e5; font-size: 20px;">${monthLabel} ${year}</h3>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #94a3b8;">Emitido em ${new Date().toLocaleDateString(locale)}</p>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="label">Colaboradores</div>
            <div class="value">${summary.length}</div>
          </div>
          <div class="summary-card">
            <div class="label">Total Presenças</div>
            <div class="value">${totalPresent}</div>
          </div>
          <div class="summary-card">
            <div class="label">Total Horas</div>
            <div class="value">${totalHours}h</div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th style="text-align: center;">Presenças</th>
              <th style="text-align: center;">Atrasos</th>
              <th style="text-align: center;">Faltas</th>
              <th style="text-align: center;">Justif.</th>
              <th style="text-align: center;">Horas</th>
              <th style="text-align: right;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${summary.map(item => `
              <tr>
                <td style="font-weight: bold;">${item.employee_name}</td>
                <td style="text-align: center;">${item.present_days ?? 0}</td>
                <td style="text-align: center; color: #d97706;">${item.late_days ?? 0}</td>
                <td style="text-align: center; color: #dc2626;">${item.absent_days ?? 0}</td>
                <td style="text-align: center; color: #059669;">${item.justified_days ?? 0}</td>
                <td style="text-align: center;">${Math.round(item.total_hours ?? 0)}h</td>
                <td style="text-align: right;">
                  <span class="badge ${(item.present_days ?? 0) >= 18 ? 'badge-good' : 'badge-regular'}">
                    ${(item.present_days ?? 0) >= 18 ? 'Regular' : 'Atenção'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Gerado por SmartS RH &nbsp;•&nbsp; ${companyName} &nbsp;•&nbsp; ${countryConfig.name}</p>
        </div>
      </body>
    </html>
  `

  const { uri } = await Print.printToFileAsync({ html })
  await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' })
}

export async function generateINSSReportPDF(
  inssData: any,
  month: number,
  year: number,
  countryConfig: CountryConfig,
  companyName: string = 'SmartS Business'
) {
  const { tax, locale, currency } = countryConfig
  const fmt = (n: number) => (n ?? 0).toLocaleString(locale, { minimumFractionDigits: 2 })
  const totalRate = ((tax.socialSecurity.employeeRate + tax.socialSecurity.employerRate) * 100).toFixed(1)
  const empRate = (tax.socialSecurity.employeeRate * 100).toFixed(1)
  const emplRate = (tax.socialSecurity.employerRate * 100).toFixed(1)
  const monthLabel = MONTH_NAMES[month - 1]

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; align-items: center; }
          .company-info h1 { margin: 0; color: #4f46e5; font-size: 26px; font-weight: 900; }
          .section-title { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 8px; }
          .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .stat-card { background: #f8fafc; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0; }
          .stat-card.primary { background: #4f46e5; border: none; color: white; grid-column: span 2; }
          .stat-card.primary .section-title { color: rgba(255,255,255,0.7); }
          .table { width: 100%; border-collapse: collapse; }
          .table td { padding: 14px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .table .label-cell { color: #64748b; }
          .table .value-cell { text-align: right; font-weight: bold; }
          .footer { margin-top: 60px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          .note { margin-top: 30px; padding: 16px; border: 1px dashed #e2e8f0; border-radius: 12px; background: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>${companyName}</h1>
            <p style="margin: 5px 0 0 0; color: #64748b; font-weight: bold;">${tax.socialSecurity.reportTitle}</p>
          </div>
          <div style="text-align: right">
            <h3 style="margin: 0; color: #4f46e5; font-size: 20px;">${monthLabel} ${year}</h3>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #94a3b8;">Emitido em ${new Date().toLocaleDateString(locale)}</p>
          </div>
        </div>

        <div class="stat-grid">
          <div class="stat-card primary">
            <p class="section-title">Total Contribuições (${totalRate}%)</p>
            <h2 style="margin: 0; font-size: 30px;">${fmt(inssData.total_inss)} ${currency}</h2>
          </div>
          <div class="stat-card">
            <p class="section-title">${tax.socialSecurity.employeeLabel} — Trabalhador (${empRate}%)</p>
            <p style="margin: 0; font-size: 20px; font-weight: bold;">${fmt(inssData.total_inss_employee)} ${currency}</p>
          </div>
          <div class="stat-card">
            <p class="section-title">${tax.socialSecurity.employerLabel} — Entidade (${emplRate}%)</p>
            <p style="margin: 0; font-size: 20px; font-weight: bold;">${fmt(inssData.inss_employer)} ${currency}</p>
          </div>
        </div>

        <p class="section-title">Resumo da Folha de Pagamento</p>
        <table class="table">
          <tbody>
            <tr>
              <td class="label-cell">Número de Colaboradores</td>
              <td class="value-cell">${inssData.employee_count}</td>
            </tr>
            <tr>
              <td class="label-cell">Total Salários Base</td>
              <td class="value-cell">${fmt(inssData.total_base)} ${currency}</td>
            </tr>
            <tr>
              <td class="label-cell">${tax.incomeTax.label} (Retido na Fonte)</td>
              <td class="value-cell">${fmt(inssData.total_irps)} ${currency}</td>
            </tr>
            <tr>
              <td class="label-cell">Total Líquido Pago</td>
              <td class="value-cell">${fmt(inssData.total_net)} ${currency}</td>
            </tr>
          </tbody>
        </table>

        ${tax.socialSecurity.portalNote ? `
        <div class="note">
          <p style="font-size: 11px; color: #64748b; margin: 0;"><strong>Nota:</strong> ${tax.socialSecurity.portalNote}</p>
        </div>` : ''}

        <div class="footer">
          <p>Gerado por SmartS RH &nbsp;•&nbsp; ${companyName} &nbsp;•&nbsp; ${countryConfig.name}</p>
          <p style="margin-top: 4px;">Este documento foi gerado electronicamente.</p>
        </div>
      </body>
    </html>
  `

  const { uri } = await Print.printToFileAsync({ html })
  await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' })
}
