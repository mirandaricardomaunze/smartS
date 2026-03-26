import * as Print from 'expo-print'
import { shareAsync } from 'expo-sharing'
import { Payroll, Employee } from '@/features/hr/types'

export async function generatePayslipPDF(
  payroll: Payroll, 
  employee: Employee, 
  currencySymbol: string = 'MT',
  companyName: string = 'SmartS Business'
) {
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
          .employee-card h3 { margin: 0 0 10px 0; font-size: 10px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th { text-align: left; padding: 12px; background-color: #4f46e5; color: white; font-size: 11px; text-transform: uppercase; }
          .table td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .total-box { margin-top: 30px; padding: 25px; background-color: #1e293b; color: white; border-radius: 12px; text-align: right; }
          .footer { margin-top: 60px; text-align: center; color: #94a3b8; font-size: 11px; }
          .amount { font-family: monospace; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>${companyName}</h1>
            <p style="margin: 5px 0 0 0; color: #64748b; font-weight: bold;">Recibo de Vencimento</p>
          </div>
          <div class="payslip-details">
            <h3 style="margin: 0; color: #1e293b;">Mês: ${payroll.period_month}/${payroll.period_year}</h3>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">Processado em: ${new Date().toLocaleDateString('pt-PT')}</p>
          </div>
        </div>

        <div class="employee-card">
          <h3>Dados do Colaborador</h3>
          <p style="font-size: 18px; font-weight: 900; margin: 0;">${employee.name}</p>
          <p style="margin: 5px 0 0 0; color: #64748b;">${employee.position || 'Colaborador'} | NUIT: ${employee.nit || '---'}</p>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Descrição das Verbas</th>
              <th style="text-align: right;">Rendimentos</th>
              <th style="text-align: right;">Descontos</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Salário Base</td>
              <td style="text-align: right;" class="amount">${payroll.base_salary.toFixed(2)}</td>
              <td></td>
            </tr>
            ${(payroll.subsidy_meal + payroll.subsidy_transport) > 0 ? `
            <tr>
              <td>Subsídios e Abonos</td>
              <td style="text-align: right;" class="amount">${(payroll.subsidy_meal + payroll.subsidy_transport).toFixed(2)}</td>
              <td></td>
            </tr>` : ''}
            ${payroll.bonus > 0 ? `
            <tr>
              <td>Bónus e Prémios</td>
              <td style="text-align: right;" class="amount">${payroll.bonus.toFixed(2)}</td>
              <td></td>
            </tr>` : ''}
            <tr>
              <td>Segurança Social - INSS (4%)</td>
              <td></td>
              <td style="text-align: right; color: #ef4444;" class="amount">-${payroll.deduction_inss.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Imposto sobre Rendimento - IRPS</td>
              <td></td>
              <td style="text-align: right; color: #ef4444;" class="amount">-${payroll.deduction_irps.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <p style="font-size: 12px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8;">Valor Líquido a Receber</p>
          <h2 style="margin: 0; font-size: 32px;">${payroll.net_salary.toFixed(2)} <span style="font-size: 16px;">${currencySymbol}</span></h2>
        </div>

        <div class="footer">
          <p>Gerado automaticamente pelo Sistema SmartS HR - Conformidade Legal 2024</p>
          <p>Este documento serve como comprovativo de rendimentos.</p>
        </div>
      </body>
    </html>
  `

  const { uri } = await Print.printToFileAsync({ html })
  await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' })
}

export async function generateAttendancePDF(summary: any[], month: number, year: number, companyName: string = 'SmartS Business') {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 40px; align-items: center; }
          .company-info h1 { margin: 0; color: #4f46e5; font-size: 28px; font-weight: 900; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th { text-align: left; padding: 15px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 11px; text-transform: uppercase; color: #64748b; }
          .table td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .footer { margin-top: 60px; text-align: center; color: #94a3b8; font-size: 11px; }
          .badge { padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; background: #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>${companyName}</h1>
            <p style="margin: 5px 0 0 0; color: #64748b; font-weight: bold;">Relatório Mensal de Assiduidade</p>
          </div>
          <div style="text-align: right">
            <h3 style="margin: 0; color: #4f46e5;">Período: ${month.toString().padStart(2, '0')}/${year}</h3>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #94a3b8;">Gerado em: ${new Date().toLocaleDateString('pt-PT')}</p>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th style="text-align: center;">Dias Presentes</th>
              <th style="text-align: center;">Total Horas</th>
              <th style="text-align: right;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${summary.map(item => `
              <tr>
                <td style="font-weight: bold;">${item.employee_name}</td>
                <td style="text-align: center;">${item.present_days}</td>
                <td style="text-align: center;">${Math.round(item.total_minutes / 60)}h</td>
                <td style="text-align: right;"><span class="badge">${item.present_days >= 20 ? 'EXCELENTE' : 'REGULAR'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>SmartS HR Analytics - Prova de Assiduidade para efeitos de Processamento Salarial</p>
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
  currencySymbol: string = 'MT',
  companyName: string = 'SmartS Business'
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; align-items: center; }
          .company-info h1 { margin: 0; color: #4f46e5; font-size: 26px; font-weight: 900; }
          .section-title { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 10px; }
          .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .stat-card { background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
          .stat-card.primary { background: #4f46e5; border: none; color: white; }
          .stat-card.primary .section-title { color: white; opacity: 0.7; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th { text-align: left; padding: 12px; background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-transform: uppercase; color: #64748b; }
          .table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .footer { margin-top: 60px; text-align: center; color: #94a3b8; font-size: 11px; }
          .amount { font-family: monospace; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>${companyName}</h1>
            <p style="margin: 5px 0 0 0; color: #64748b; font-weight: bold;">Declaração Mensal de Contribuições (INSS)</p>
          </div>
          <div style="text-align: right">
            <h3 style="margin: 0; color: #4f46e5;">Período: ${month.toString().padStart(2, '0')}/${year}</h3>
          </div>
        </div>

        <div class="stat-grid">
          <div class="stat-card primary" style="grid-column: span 2;">
            <p class="section-title">Total de Contribuições (8%)</p>
            <h2 style="margin: 0; font-size: 28px;">${inssData.total_inss.toFixed(2)} ${currencySymbol}</h2>
          </div>
          <div class="stat-card">
            <p class="section-title">Quota do Trabalhador (4%)</p>
            <p style="margin: 0; font-size: 18px; font-weight: bold;">${inssData.total_inss_employee.toFixed(2)} ${currencySymbol}</p>
          </div>
          <div class="stat-card">
            <p class="section-title">Quota da Empresa (4%)</p>
            <p style="margin: 0; font-size: 18px; font-weight: bold;">${inssData.inss_employer.toFixed(2)} ${currencySymbol}</p>
          </div>
        </div>

        <div class="section-title">Resumo da Massa Salarial</div>
        <table class="table">
          <tbody>
            <tr>
              <td>Número de Beneficiários</td>
              <td style="text-align: right; font-weight: bold;">${inssData.employee_count}</td>
            </tr>
            <tr>
              <td>Rendimento Total Bruto</td>
              <td style="text-align: right; font-weight: bold;" class="amount">${inssData.total_base.toFixed(2)} ${currencySymbol}</td>
            </tr>
            <tr>
              <td>Imposto (IRPS Retido)</td>
              <td style="text-align: right; font-weight: bold;" class="amount">${inssData.total_irps.toFixed(2)} ${currencySymbol}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 40px; padding: 20px; border: 1px dashed #e2e8f0; border-radius: 12px; background: #f8fafc;">
          <p style="font-size: 11px; color: #64748b; margin: 0;"><strong>Nota:</strong> Esta guia é um resumo interno para efeitos de acompanhamento contabilístico e deve ser validada contra o portal SISSMO para submissão oficial das folhas de remuneração.</p>
        </div>

        <div class="footer">
          <p>Gerado pelo SmartS HR Compliance 2024</p>
        </div>
      </body>
    </html>
  `

  const { uri } = await Print.printToFileAsync({ html })
  await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' })
}
