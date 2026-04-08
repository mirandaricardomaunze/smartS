import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { reportRepository } from '@/repositories/reportRepository'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { getCurrencySymbol } from '@/utils/formatters'
import { useCompanyStore } from '@/store/companyStore'
import { db } from '@/database/sqlite'
import { customerRepository } from '@/repositories/customerRepository'

export const reportService = {
  async generateInventoryReport(): Promise<void> {
    const { activeCompanyId, companies } = useCompanyStore.getState()
    if (!activeCompanyId) return
    const data = reportRepository.getInventoryData(activeCompanyId)
    const { settings } = useSettingsStore.getState()
    const activeCompany = companies.find(c => c.id === activeCompanyId)
    const currencySymbol = getCurrencySymbol(settings.currency)

    const headerHtml = this.generateCompanyHeader(activeCompany, 'Relatório de Stock Atual')

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-section h1 { margin: 0; color: #4f46e5; font-size: 24px; font-weight: 800; letter-spacing: -1px; }
            .logo-section p { margin: 5px 0 0; color: #64748b; font-size: 14px; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .stat-card h3 { margin: 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
            .stat-card p { margin: 10px 0 0; font-size: 20px; font-weight: 700; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; padding: 12px; background: #f1f5f9; color: #475569; font-size: 12px; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .low-stock { color: #ef4444; font-weight: 600; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          ${headerHtml}

          <div class="stats-grid">
            <div class="stat-card">
              <h3>Total Produtos</h3>
              <p>${data.total_products}</p>
            </div>
            <div class="stat-card">
              <h3>Total em Stock</h3>
              <p>${data.total_stock}</p>
            </div>
            <div class="stat-card">
              <h3>Alertas de Stock</h3>
              <p>${data.low_stock_count}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Referência</th>
                <th>SKU</th>
                <th>Categoria</th>
                <th>Stock</th>
                <th>Mínimo</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td style="color: #64748b; font-family: monospace;">${item.reference || '-'}</td>
                  <td>${item.sku}</td>
                  <td>${item.category}</td>
                  <td class="${item.current_stock <= item.minimum_stock ? 'low-stock' : ''}">${item.current_stock}</td>
                  <td>${item.minimum_stock}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            SmartS - Gestão Inteligente de Armazém &copy; ${new Date().getFullYear()}
          </div>
        </body>
      </html>
    `
    await this.printAndShare(html, 'Report_Stock_Atual')
  },

  async generateMovementsReport(): Promise<void> {
    const { activeCompanyId, companies } = useCompanyStore.getState()
    if (!activeCompanyId) return
    const data = reportRepository.getMovementsData(activeCompanyId)
    const activeCompany = companies.find(c => c.id === activeCompanyId)
    const headerHtml = this.generateCompanyHeader(activeCompany, 'Resumo de Movimentação (Últimos 30 dias)')
    
    const html = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
            .logo-section h1 { margin: 0; color: #4f46e5; font-size: 24px; font-weight: 800; letter-spacing: -1px; }
            .logo-section p { margin: 5px 0 0; color: #64748b; font-size: 14px; }
            .summary { background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
            .stat { display: inline-block; margin-right: 40px; }
            .stat h4 { margin: 0; color: #64748b; font-size: 12px; }
            .stat p { margin: 10px 0 0; font-size: 24px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; padding: 12px; border-bottom: 2px solid #f1f5f9; color: #64748b; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
          </style>
        </head>
        <body>
          ${headerHtml}

          <div class="summary">
            <div class="stat">
              <h4>Entradas</h4>
              <p style="color: #10b981;">+ ${data.total_entries}</p>
            </div>
            <div class="stat">
              <h4>Saídas</h4>
              <p style="color: #ef4444;">- ${data.total_exits}</p>
            </div>
            <div class="stat">
              <h4>Saldo Líquido</h4>
              <p>${data.net_movement}</p>
            </div>
          </div>

          <h3>Top 5 Produtos Movimentados</h3>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.top_moved_products.map(p => `
                <tr>
                  <td>${p.name}</td>
                  <td>${p.total_qty}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    await this.printAndShare(html, 'Report_Movimentacao')
  },

  async generateExpiryReport(): Promise<void> {
    const { activeCompanyId, companies } = useCompanyStore.getState()
    if (!activeCompanyId) return
    const items = reportRepository.getExpiryData(activeCompanyId)

    const activeCompany = companies.find(c => c.id === activeCompanyId)
    const headerHtml = this.generateCompanyHeader(activeCompany, 'Controle de Validades (Próximos 90 dias)')

    const html = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #fef3c7; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
            .logo-section h1 { margin: 0; color: #f59e0b; font-size: 24px; font-weight: 800; }
            .logo-section p { margin: 5px 0 0; color: #64748b; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; padding: 12px; background: #fffbeb; }
            td { padding: 12px; border-bottom: 1px solid #fef3c7; }
            .alert { color: #b45309; font-weight: bold; }
          </style>
        </head>
        <body>
          ${headerHtml}

          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Referência</th>
                <th>Lote</th>
                <th>Validade</th>
                <th>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td style="color: #64748b; font-family: monospace;">${item.reference || '-'}</td>
                  <td>${item.lot_number}</td>
                  <td class="alert">${new Date(item.expiry_date).toLocaleDateString('pt-PT')}</td>
                  <td>${item.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    await this.printAndShare(html, 'Report_Validades')
  },

  async generateSalesReport(): Promise<void> {
    const { activeCompanyId, companies } = useCompanyStore.getState()
    if (!activeCompanyId) return
    const items = reportRepository.getSalesData(activeCompanyId)
    const activeCompany = companies.find(c => c.id === activeCompanyId)
    const headerHtml = this.generateCompanyHeader(activeCompany, 'Relatório de Vendas (Últimos 30 dias)')

    const html = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
            .logo-section h1 { margin: 0; color: #4f46e5; font-size: 24px; font-weight: 800; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; padding: 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 12px; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .status { font-weight: bold; text-transform: uppercase; font-size: 10px; }
            .amount { font-weight: bold; text-align: right; }
          </style>
        </head>
        <body>
          ${headerHtml}
          <table>
            <thead>
              <tr>
                <th>Nº Pedido</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Estado</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(o => `
                <tr>
                  <td>#${o.number}</td>
                  <td>${o.customer_name || 'Consumidor Final'}</td>
                  <td>${new Date(o.created_at).toLocaleDateString('pt-PT')}</td>
                  <td class="status">${o.status}</td>
                  <td class="amount">${o.total_amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    await this.printAndShare(html, 'Report_Vendas')
  },

  async generateFinancialReport(): Promise<void> {
    const { activeCompanyId, companies } = useCompanyStore.getState()
    if (!activeCompanyId) return
    const data = reportRepository.getPnLData(activeCompanyId)
    const activeCompany = companies.find(c => c.id === activeCompanyId)
    const headerHtml = this.generateCompanyHeader(activeCompany, 'Resumo Financeiro (Performance 30 dias)')

    const html = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
            .logo-section h1 { margin: 0; color: #4f46e5; font-size: 24px; font-weight: 800; }
            .card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; }
            .card { padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; }
            .card h3 { margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; }
            .card p { margin: 10px 0 0; font-size: 24px; font-weight: bold; }
            .profit { color: #10b981; }
            .loss { color: #ef4444; }
          </style>
        </head>
        <body>
          ${headerHtml}
          <div class="card-grid">
            <div class="card">
              <h3>Receita Bruta</h3>
              <p>${data.revenue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
            </div>
            <div class="card">
              <h3>Custo de Mercadoria</h3>
              <p>- ${data.cost.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
            </div>
            <div class="card">
              <h3>Despesas Operacionais</h3>
              <p>- ${data.expenses.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
            </div>
            <div class="card">
              <h3>Lucro Líquido</h3>
              <p class="${data.profit >= 0 ? 'profit' : 'loss'}">
                ${data.profit.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div style="background: #eef2ff; padding: 20px; border-radius: 12px; border: 1px solid #c7d2fe;">
             <p style="margin:0; font-size: 14px; color: #4338ca;">
               <strong>Nota:</strong> O lucro líquido é calculado subtraindo o preço de custo dos produtos vendidos e as despesas registadas da receita total.
             </p>
          </div>
        </body>
      </html>
    `
    await this.printAndShare(html, 'Report_Financeiro')
  },

  async generateCustomerStatement(customerId: string): Promise<void> {
    const { activeCompanyId, companies } = useCompanyStore.getState()
    if (!activeCompanyId) return

    const customer = customerRepository.getById(activeCompanyId, customerId)
    if (!customer) throw new Error('Cliente não encontrado')

    const orders = db.getAllSync<any>(
      `SELECT * FROM orders 
       WHERE customer_id = ? AND company_id = ?
       ORDER BY created_at DESC`,
      [customerId, activeCompanyId]
    )

    const activeCompany = companies.find(c => c.id === activeCompanyId)
    const headerHtml = this.generateCompanyHeader(activeCompany, 'Extrato de Pagamentos de Cliente')

    const html = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
            .logo-section h1 { margin: 0; color: #4f46e5; font-size: 24px; font-weight: 800; }
            .customer-info { margin-bottom: 30px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
            .customer-info strong { display: block; font-size: 16px; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; padding: 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 12px; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .status-paid { color: #10b981; font-weight: bold; font-size: 10px; text-transform: uppercase; }
            .status-pending { color: #f59e0b; font-weight: bold; font-size: 10px; text-transform: uppercase; }
            .amount { font-weight: bold; text-align: right; }
            .debt-box { margin-top: 20px; padding: 20px; text-align: right; border-top: 2px solid #e2e8f0; }
            .debt-amount { font-size: 24px; font-weight: bold; color: #ef4444; }
          </style>
        </head>
        <body>
          ${headerHtml}
          
          <div class="customer-info">
            <strong>Cliente: ${customer.name}</strong>
            ${customer.nif ? `NIF: ${customer.nif} <br/>` : ''}
            ${customer.phone ? `Telefone: ${customer.phone} <br/>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Nº Pedido</th>
                <th>Estado</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${orders.length > 0 ? orders.map(o => {
                const isPaid = o.status === 'completed' || o.status === 'paid'
                return `
                  <tr>
                    <td>${new Date(o.created_at).toLocaleDateString('pt-PT')}</td>
                    <td>#${o.number}</td>
                    <td class="${isPaid ? 'status-paid' : 'status-pending'}">${isPaid ? 'Pago' : 'Pendente'}</td>
                    <td class="amount">${o.total_amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `
              }).join('') : '<tr><td colspan="4" style="text-align:center;">Nenhum pedido registado.</td></tr>'}
            </tbody>
          </table>

          <div class="debt-box">
            <span style="font-size: 12px; color: #64748b; text-transform: uppercase;">Dívida Pendente</span><br/>
            <span class="debt-amount">${customer?.total_debt ? customer.total_debt.toLocaleString('pt-PT', { minimumFractionDigits: 2 }) : '0,00'}</span>
          </div>
        </body>
      </html>
    `
    await this.printAndShare(html, `Extrato_${customer?.name?.replace(/\s+/g, '_')}`)
  },

  generateCompanyHeader(activeCompany: any, reportTitle: string): string {
    const companyLogo = activeCompany?.logo_url ? `<img src="${activeCompany.logo_url}" style="height: 60px; margin-bottom: 10px;" />` : ''
    const companyInfo = activeCompany ? `
      <div style="font-size: 10px; color: #64748b; line-height: 1.4;">
        <strong>${activeCompany.name}</strong><br/>
        ${activeCompany.nif ? `NIF / NUIT: ${activeCompany.nif}<br/>` : ''}
        ${activeCompany.address || ''}<br/>
        ${activeCompany.phone ? `Tel: ${activeCompany.phone} | ` : ''}${activeCompany.email || ''}
      </div>
    ` : ''

    return `
      <div class="header">
        <div class="logo-section">
          ${companyLogo}
          <h1>${activeCompany?.name || 'SmartS Management'}</h1>
          <p>${reportTitle}</p>
        </div>
        <div style="text-align: right;">
          ${companyInfo}
          <p style="font-weight: bold; margin-top: 10px;">Data: ${new Date().toLocaleDateString('pt-PT')}</p>
        </div>
      </div>
    `
  },

  async printAndShare(html: string, fileName: string): Promise<void> {
    try {
      const { uri } = await Print.printToFileAsync({ html })
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Relatório SmartS',
      })
    } catch (error) {
      console.error('Error generating/sharing PDF:', error)
      throw error
    }
  }
}
