import * as Print from 'expo-print'
import { shareAsync } from 'expo-sharing'
import { Payroll, Employee } from '@/features/hr/types'
import { useFormatter } from '@/hooks/useFormatter'

export async function generatePayslipPDF(payroll: Payroll, employee: Employee) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
          .header { display: flex; justify-between; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
          .company-info { flex: 1; }
          .payslip-title { text-align: right; }
          .details { margin-bottom: 30px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th { text-align: left; padding: 12px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; }
          .table td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
          .total { margin-top: 30px; padding: 20px; background-color: #4f46e5; color: white; border-radius: 8px; text-align: right; }
          .footer { margin-top: 50px; text-align: center; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h2>SmartS</h2>
            <p>Recibo de Vencimento</p>
          </div>
          <div class="payslip-title">
            <h3>Período: ${payroll.period_month}/${payroll.period_year}</h3>
            <p>Funcionário: ${employee.name}</p>
          </div>
        </div>

        <div class="details">
          <p><strong>Cargo:</strong> ${employee.position || 'N/A'}</p>
          <p><strong>NUIT:</strong> ${employee.nit || 'N/A'}</p>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th style="text-align: right;">Créditos</th>
              <th style="text-align: right;">Débitos</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Salário Base</td>
              <td style="text-align: right;">${payroll.base_salary.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</td>
              <td></td>
            </tr>
            <tr>
              <td>Subsídio de Alimentação</td>
              <td style="text-align: right;">${payroll.subsidy_meal.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</td>
              <td></td>
            </tr>
            <tr>
              <td>Subsídio de Transporte</td>
              <td style="text-align: right;">${payroll.subsidy_transport.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</td>
              <td></td>
            </tr>
            <tr>
              <td>INSS (4%)</td>
              <td></td>
              <td style="text-align: right; color: #ef4444;">${payroll.deduction_inss.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>IRPS (Tabela A)</td>
              <td></td>
              <td style="text-align: right; color: #ef4444;">${payroll.deduction_irps.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <div class="total">
          <p style="font-size: 14px; margin-bottom: 5px;">Líquido a Receber</p>
          <h2 style="margin: 0;">MZN ${payroll.net_salary.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</h2>
        </div>

        <div class="footer">
          <p>Gerado automaticamente pelo SmartS Mobile</p>
          <p>&copy; 2024 - Todos os direitos reservados</p>
        </div>
      </body>
    </html>
  `

  const { uri } = await Print.printToFileAsync({ html })
  await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' })
}
