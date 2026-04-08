import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import { Company, Product, StockMovement, Order, ExpiryLot, Supplier, HistoryEntry } from '@/types';

export interface FinancialStats {
  totalIncomes: number
  totalExpenses: number
}

const ORDER_STATUS_PT: Record<string, string> = {
  pending: 'Pendente',
  picking: 'Em Separação',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  shipped: 'Enviado',
  delivered: 'Entregue',
  paid: 'Pago',
}

function companyHeader(company: Company, reportTitle: string, accentColor: string): string {
  const logo = company?.logo_url
    ? `<img src="${company.logo_url}" style="max-height: 60px; max-width: 120px; object-fit: contain;" />`
    : `<div style="width:60px;height:60px;border-radius:12px;background:${accentColor};display:flex;align-items:center;justify-content:center;color:white;font-size:22px;font-weight:900;">${(company?.name || 'S').charAt(0).toUpperCase()}</div>`
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ${accentColor};padding-bottom:20px;margin-bottom:30px;">
      <div style="display:flex;align-items:center;gap:16px;">
        ${logo}
        <div>
          <h1 style="margin:0;color:${accentColor};font-size:22px;font-weight:900;">${company?.name || 'SmartS'}</h1>
          ${company?.nif ? `<p style="margin:3px 0 0 0;font-size:12px;color:#64748b;">NIF: ${company.nif}</p>` : ''}
          ${company?.address ? `<p style="margin:2px 0 0 0;font-size:12px;color:#64748b;">${company.address}</p>` : ''}
          ${company?.phone ? `<p style="margin:2px 0 0 0;font-size:12px;color:#64748b;">Tel: ${company.phone}</p>` : ''}
        </div>
      </div>
      <div style="text-align:right;">
        <p style="font-weight:bold;color:${accentColor};font-size:14px;margin:0;">${reportTitle}</p>
        <p style="font-size:12px;color:#64748b;margin:5px 0 0 0;">Data: ${new Date().toLocaleDateString('pt-PT')}</p>
      </div>
    </div>`
}

export const pdfService = {
  getStockReportHtml(company: Company, products: Product[]) {
    const totalValue = products.reduce((acc, p) => acc + (p.sale_price || 0) * (p.current_stock || 0), 0)
    const lowStock = products.filter(p => p.current_stock <= p.minimum_stock).length
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #334155; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #4f46e5; color: white; text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
            td { padding: 11px 12px; font-size: 13px; }
            tr:nth-child(even) td { background-color: #f8fafc; }
            tr:nth-child(odd) td { background-color: #ffffff; }
            .stock-low { color: #ef4444; font-weight: bold; }
            .summary-bar { display: flex; gap: 24px; background: #eef2ff; border-radius: 10px; padding: 14px 20px; margin-bottom: 24px; }
            .summary-bar div span { display: block; font-size: 10px; text-transform: uppercase; color: #64748b; }
            .summary-bar div strong { font-size: 18px; color: #4f46e5; }
            .total-row td { background: #1e293b !important; color: white; font-weight: bold; font-size: 14px; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          ${companyHeader(company, 'Relatório de Inventário', '#4f46e5')}
          <div class="summary-bar">
            <div><span>Total Produtos</span><strong>${products.length}</strong></div>
            <div><span>Stock Baixo</span><strong style="color:#ef4444;">${lowStock}</strong></div>
            <div><span>Valor em Stock</span><strong>${totalValue.toFixed(2)} MT</strong></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Referência</th>
                <th>Cód. Barras</th>
                <th>Categoria</th>
                <th style="text-align: right">Preço Venda</th>
                <th style="text-align: center">Stock</th>
                <th style="text-align: right">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td style="font-weight: bold">${p.name}</td>
                  <td style="color: #64748b; font-family: monospace;">${p.reference || '—'}</td>
                  <td style="font-family: monospace; font-size: 11px;">${p.barcode || '—'}</td>
                  <td>${p.category || '—'}</td>
                  <td style="text-align: right">${p.sale_price?.toFixed(2) || '0.00'} MT</td>
                  <td style="text-align: center" class="${p.current_stock <= p.minimum_stock ? 'stock-low' : ''}">
                    ${p.current_stock} ${p.unit || 'un'}
                  </td>
                  <td style="text-align: right; font-weight: bold;">${((p.sale_price || 0) * (p.current_stock || 0)).toFixed(2)} MT</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="6" style="text-align: right; padding: 14px 12px;">Valor Total em Stock:</td>
                <td style="text-align: right; padding: 14px 12px;">${totalValue.toFixed(2)} MT</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>Gerado automaticamente pela SmartS Ecosystem — A sua gestão na palma da mão.</p>
          </div>
        </body>
      </html>
    `;
  },

  getFinancialReportHtml(company: Company, stats: FinancialStats) {
    const balance = stats.totalIncomes - stats.totalExpenses
    const balanceColor = balance >= 0 ? '#10b981' : '#ef4444'
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #334155; }
            .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .card { border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; }
            .card h3 { margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
            .card p { margin: 0; font-size: 22px; font-weight: bold; }
            .card .sub { font-size: 11px; color: #94a3b8; margin-top: 4px; }
            .balance-card { grid-column: span 2; background: #1e293b; border: none; }
            .balance-card h3 { color: rgba(255,255,255,0.6); }
            .balance-card p { color: white; font-size: 32px; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          ${companyHeader(company, 'Relatório de Fluxo de Caixa', '#8b5cf6')}
          <p style="font-size: 12px; color: #64748b; margin: -10px 0 20px 0;">Período: Últimos 30 dias</p>
          <div class="summary-grid">
            <div class="card" style="border-left: 4px solid #10b981;">
              <h3>Total Entradas</h3>
              <p style="color: #10b981">${stats.totalIncomes.toFixed(2)} MT</p>
              <p class="sub">Receitas do período</p>
            </div>
            <div class="card" style="border-left: 4px solid #ef4444;">
              <h3>Total Saídas</h3>
              <p style="color: #ef4444">${stats.totalExpenses.toFixed(2)} MT</p>
              <p class="sub">Despesas do período</p>
            </div>
            <div class="card balance-card">
              <h3>Saldo do Período</h3>
              <p style="color: ${balanceColor}">${balance.toFixed(2)} MT</p>
              <p style="color: rgba(255,255,255,0.5); font-size: 11px; margin-top: 4px;">${balance >= 0 ? 'Resultado positivo' : 'Resultado negativo'}</p>
            </div>
          </div>
          <div class="footer">
            <p>Este documento é para uso interno e informativo. Gerado pela SmartS Ecosystem.</p>
          </div>
        </body>
      </html>
    `;
  },

  getMovementsReportHtml(company: Company, movements: (StockMovement & { product_name?: string })[]) {
    const totalEntries = movements.filter(m => m.type === 'entry').reduce((acc, m) => acc + m.quantity, 0)
    const totalExits = movements.filter(m => m.type !== 'entry').reduce((acc, m) => acc + m.quantity, 0)
    const TYPE_LABEL: Record<string, string> = { entry: 'Entrada', exit: 'Saída', transfer: 'Transferência', adjustment: 'Ajuste' }
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #334155; }
            table { width: 100%; border-collapse: collapse; }
            th { background-color: #059669; color: white; text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; }
            td { padding: 11px 12px; font-size: 13px; }
            tr:nth-child(even) td { background-color: #f0fdf4; }
            tr:nth-child(odd) td { background-color: #ffffff; }
            .type-entry { color: #10b981; font-weight: bold; }
            .type-exit { color: #ef4444; font-weight: bold; }
            .type-transfer { color: #6366f1; font-weight: bold; }
            .type-adjustment { color: #d97706; font-weight: bold; }
            .summary-bar { display: flex; gap: 24px; background: #f0fdf4; border-radius: 10px; padding: 14px 20px; margin-bottom: 24px; border: 1px solid #bbf7d0; }
            .summary-bar div span { display: block; font-size: 10px; text-transform: uppercase; color: #64748b; }
            .summary-bar div strong { font-size: 18px; }
            .total-row td { background: #1e293b !important; color: white; font-weight: bold; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; }
          </style>
        </head>
        <body>
          ${companyHeader(company, 'Relatório de Movimentação de Stock', '#059669')}
          <div class="summary-bar">
            <div><span>Total Movimentos</span><strong style="color:#059669;">${movements.length}</strong></div>
            <div><span>Entradas (un)</span><strong style="color:#10b981;">${totalEntries}</strong></div>
            <div><span>Saídas (un)</span><strong style="color:#ef4444;">${totalExits}</strong></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Produto</th>
                <th>Tipo</th>
                <th style="text-align: right">Qtd</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              ${movements.map(m => `
                <tr>
                  <td style="white-space:nowrap;">${new Date(m.created_at).toLocaleDateString('pt-PT')}</td>
                  <td style="font-weight: bold">${m.product_name || 'Desconhecido'}</td>
                  <td class="type-${m.type}">${TYPE_LABEL[m.type] || m.type}</td>
                  <td style="text-align: right; font-weight: bold;">${m.quantity}</td>
                  <td style="color: #64748b">${m.reason || '—'}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3" style="padding: 12px;">Total do Período</td>
                <td style="text-align: right; padding: 12px;">E: +${totalEntries} / S: -${totalExits}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;
  },

  getExpiryReportHtml(company: Company, lots: (ExpiryLot & { name: string, reference?: string })[]) {
    const today = new Date()
    const totalQty = lots.reduce((acc, l) => acc + (l.quantity || 0), 0)
    const critical = lots.filter(l => {
      const diff = (new Date(l.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      return diff <= 30
    }).length
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #334155; }
            table { width: 100%; border-collapse: collapse; }
            th { background-color: #d97706; color: white; text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; }
            td { padding: 11px 12px; font-size: 13px; }
            tr:nth-child(even) td { background-color: #fffbeb; }
            tr:nth-child(odd) td { background-color: #ffffff; }
            .summary-bar { display: flex; gap: 24px; background: #fffbeb; border-radius: 10px; padding: 14px 20px; margin-bottom: 24px; border: 1px solid #fde68a; }
            .summary-bar div span { display: block; font-size: 10px; text-transform: uppercase; color: #64748b; }
            .summary-bar div strong { font-size: 18px; }
            .total-row td { background: #1e293b !important; color: white; font-weight: bold; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; }
          </style>
        </head>
        <body>
          ${companyHeader(company, 'Relatório de Validades Próximas (90 dias)', '#d97706')}
          <div class="summary-bar">
            <div><span>Lotes a Vencer</span><strong style="color:#d97706;">${lots.length}</strong></div>
            <div><span>Críticos (≤30 dias)</span><strong style="color:#ef4444;">${critical}</strong></div>
            <div><span>Quantidade Total</span><strong style="color:#1e293b;">${totalQty}</strong></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Referência</th>
                <th>Lote</th>
                <th>Vencimento</th>
                <th style="text-align: right">Qtd</th>
              </tr>
            </thead>
            <tbody>
              ${lots.map(l => {
                const daysLeft = Math.ceil((new Date(l.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                const isCritical = daysLeft <= 30
                return `
                <tr>
                  <td style="font-weight: bold">${l.name}</td>
                  <td style="font-family: monospace; font-size: 12px;">${l.reference || '—'}</td>
                  <td>${l.lot_number || '—'}</td>
                  <td style="color: ${isCritical ? '#ef4444' : '#d97706'}; font-weight: bold;">
                    ${new Date(l.expiry_date).toLocaleDateString('pt-PT')}
                    <span style="font-size: 10px; font-weight: normal;"> (${daysLeft}d)</span>
                  </td>
                  <td style="text-align: right; font-weight: bold;">${l.quantity}</td>
                </tr>`
              }).join('')}
              <tr class="total-row">
                <td colspan="4" style="padding: 12px; text-align: right;">Quantidade Total em Risco:</td>
                <td style="text-align: right; padding: 12px;">${totalQty}</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;
  },

  getSalesReportHtml(company: Company, sales: (Order & { customer_name?: string })[]) {
    const total = sales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
    const completed = sales.filter(s => s.status === 'completed' || s.status === 'paid').length
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #334155; }
            table { width: 100%; border-collapse: collapse; }
            th { background-color: #4338ca; color: white; text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; }
            td { padding: 11px 12px; font-size: 13px; }
            tr:nth-child(even) td { background-color: #eef2ff; }
            tr:nth-child(odd) td { background-color: #ffffff; }
            .summary-bar { display: flex; gap: 24px; background: #eef2ff; border-radius: 10px; padding: 14px 20px; margin-bottom: 24px; border: 1px solid #e0e7ff; }
            .summary-bar div span { display: block; font-size: 10px; text-transform: uppercase; color: #64748b; }
            .summary-bar div strong { font-size: 18px; color: #4338ca; }
            .total-row td { background: #1e293b !important; color: white; font-weight: bold; font-size: 15px; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; }
            .status-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          ${companyHeader(company, 'Histórico de Vendas (30 dias)', '#4338ca')}
          <div class="summary-bar">
            <div><span>Total Pedidos</span><strong>${sales.length}</strong></div>
            <div><span>Concluídos</span><strong style="color:#10b981;">${completed}</strong></div>
            <div><span>Faturação</span><strong>${total.toFixed(2)} MT</strong></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Pedido #</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th style="text-align: right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${sales.map(s => {
                const statusColors: Record<string, string> = {
                  completed: 'background:#dcfce7;color:#166534;',
                  paid: 'background:#dcfce7;color:#166534;',
                  pending: 'background:#fef3c7;color:#92400e;',
                  cancelled: 'background:#fee2e2;color:#991b1b;',
                  shipped: 'background:#dbeafe;color:#1e40af;',
                  delivered: 'background:#d1fae5;color:#065f46;',
                  picking: 'background:#ede9fe;color:#5b21b6;',
                }
                const badgeStyle = statusColors[s.status] || 'background:#f1f5f9;color:#475569;'
                return `
                <tr>
                  <td style="white-space:nowrap;">${new Date(s.created_at).toLocaleDateString('pt-PT')}</td>
                  <td style="font-weight: bold; font-family: monospace;">${s.number}</td>
                  <td>${s.customer_name || 'Cliente Geral'}</td>
                  <td><span class="status-badge" style="${badgeStyle}">${ORDER_STATUS_PT[s.status] || s.status}</span></td>
                  <td style="text-align: right; font-weight: bold">${s.total_amount.toFixed(2)} MT</td>
                </tr>`
              }).join('')}
              <tr class="total-row">
                <td colspan="4" style="text-align: right; padding: 14px 12px;">Faturação Total do Período:</td>
                <td style="text-align: right; padding: 14px 12px;">${total.toFixed(2)} MT</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>Gerado pela SmartS Ecosystem — Histórico de vendas dos últimos 30 dias.</p>
          </div>
        </body>
      </html>
    `;
  },

  getPurchaseOrderHtml(company: Company, supplier: any, items: (Product & { suggested_quantity: number })[]) {
    const totalEstimated = items.reduce((acc, item) => acc + (item.purchase_price || 0) * item.suggested_quantity, 0)
    const poNumber = `PO-${new Date().getTime().toString().slice(-6)}`
    const logo = company?.logo_url
      ? `<img src="${company.logo_url}" style="max-height: 60px; max-width: 120px; object-fit: contain;" />`
      : `<div style="width:56px;height:56px;border-radius:10px;background:#4f46e5;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;font-weight:900;">${(company?.name || 'S').charAt(0).toUpperCase()}</div>`
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #334155; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; align-items: center; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .details-box { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .details-box h3 { margin: 0 0 8px 0; font-size: 10px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
            .details-box p { margin: 2px 0; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #4f46e5; color: white; text-align: left; padding: 12px; font-size: 10px; text-transform: uppercase; }
            td { padding: 12px; font-size: 13px; }
            tr:nth-child(even) td { background-color: #f8fafc; }
            tr:nth-child(odd) td { background-color: #ffffff; }
            .total-row td { background: #1e293b !important; color: white; font-weight: bold; font-size: 16px; }
            .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="display:flex;align-items:center;gap:16px;">
              ${logo}
              <div>
                <h1 style="margin:0;color:#4f46e5;font-size:22px;font-weight:900;">${company?.name || 'SmartS Business'}</h1>
                ${company?.nif ? `<p style="margin:2px 0;font-size:12px;color:#64748b;">NIF: ${company.nif}</p>` : ''}
                ${company?.address ? `<p style="margin:2px 0;font-size:12px;color:#64748b;">${company.address}</p>` : ''}
                ${company?.phone ? `<p style="margin:2px 0;font-size:12px;color:#64748b;">Tel: ${company.phone}</p>` : ''}
              </div>
            </div>
            <div style="text-align: right">
              <div style="background:#4f46e5;color:white;padding:6px 14px;border-radius:6px;font-size:11px;font-weight:bold;display:inline-block;margin-bottom:12px;">ORDEM DE COMPRA</div>
              <p style="font-size: 13px; color: #1e293b; font-weight: bold; margin: 0;">Nº ${poNumber}</p>
              <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">Data: ${new Date().toLocaleDateString('pt-PT')}</p>
            </div>
          </div>

          <div class="details-grid">
            <div class="details-box">
              <h3>Fornecedor</h3>
              <p style="font-weight: bold; font-size: 14px;">${supplier?.name || '—'}</p>
              ${supplier?.contact_name ? `<p style="color: #64748b; font-size: 12px;">${supplier.contact_name}</p>` : ''}
              ${supplier?.phone ? `<p style="color: #64748b; font-size: 12px;">Tel: ${supplier.phone}</p>` : ''}
              ${supplier?.email ? `<p style="color: #4f46e5; font-size: 12px;">${supplier.email}</p>` : ''}
              ${supplier?.nif ? `<p style="color: #64748b; font-size: 12px;">NIF: ${supplier.nif}</p>` : ''}
            </div>
            <div class="details-box">
              <h3>Entregar em</h3>
              <p style="font-weight: bold; font-size: 14px;">${company?.name || '—'}</p>
              ${company?.address ? `<p style="color: #64748b; font-size: 12px;">${company.address}</p>` : ''}
              ${company?.phone ? `<p style="color: #64748b; font-size: 12px;">Tel: ${company.phone}</p>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 55%">Descrição do Artigo</th>
                <th style="text-align: center">Quantidade</th>
                <th style="text-align: right">Preço Un. (Est.)</th>
                <th style="text-align: right">Total (Est.)</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>
                    <div style="font-weight: bold; font-size: 13px;">${item.name}</div>
                    <div style="font-size: 10px; color: #64748b; margin-top: 3px; font-family: monospace;">REF: ${item.reference || '—'}</div>
                  </td>
                  <td style="text-align: center; font-weight: bold;">${item.suggested_quantity} ${item.unit || 'un'}</td>
                  <td style="text-align: right">${(item.purchase_price || 0).toFixed(2)} MT</td>
                  <td style="text-align: right; font-weight: bold;">${((item.purchase_price || 0) * item.suggested_quantity).toFixed(2)} MT</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3" style="text-align: right; padding: 16px 12px;">Valor Total Estimado:</td>
                <td style="text-align: right; padding: 16px 12px; color: #a5b4fc;">${totalEstimated.toFixed(2)} MT</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 40px; padding: 16px 20px; border: 1px dashed #e2e8f0; border-radius: 8px; background: #f8fafc;">
            <p style="font-size: 11px; color: #64748b; margin: 0;"><strong>Nota:</strong> Os preços indicados são estimativas baseadas nos registos internos. Por favor, confirmem os preços actuais antes da emissão da factura final. Este documento não substitui uma factura oficial.</p>
          </div>

          <div class="footer">
            <p>Gerado via SmartS — Gestão Profissional de Inventário</p>
          </div>
        </body>
      </html>
    `;
  },

  async generateStockReport(company: Company, products: Product[]) {
    const html = this.getStockReportHtml(company, products);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  },

  async generateFinancialReport(company: Company, stats: FinancialStats) {
    const html = this.getFinancialReportHtml(company, stats);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  },

  async generatePurchaseOrder(company: Company, supplier: any, items: (Product & { suggested_quantity: number })[]) {
    const html = this.getPurchaseOrderHtml(company, supplier, items);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  },

  async generateMovementsReport(company: Company, movements: (StockMovement & { product_name?: string })[]) {
    const html = this.getMovementsReportHtml(company, movements);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  },

  async generateExpiryReport(company: Company, lots: (ExpiryLot & { name: string, reference?: string })[]) {
    const html = this.getExpiryReportHtml(company, lots);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  },

  async generateSalesReport(company: Company, sales: (Order & { customer_name?: string })[]) {
    const html = this.getSalesReportHtml(company, sales);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  },

  getSuppliersReportHtml(company: Company, suppliers: Supplier[]) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #334155; }
            .summary { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px 20px; margin-bottom: 25px; display: flex; gap: 40px; }
            .summary span { font-size: 10px; text-transform: uppercase; color: #64748b; display: block; }
            .summary strong { font-size: 20px; color: #065f46; }
            table { width: 100%; border-collapse: collapse; }
            th { background-color: #059669; color: white; text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
            td { padding: 11px 12px; font-size: 13px; vertical-align: top; }
            tr:nth-child(even) td { background-color: #f0fdf4; }
            tr:nth-child(odd) td { background-color: #ffffff; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          ${companyHeader(company, 'Lista de Fornecedores', '#059669')}
          <div class="summary">
            <div><span>Total Fornecedores</span><strong>${suppliers.length}</strong></div>
            <div><span>Com E-mail</span><strong>${suppliers.filter(s => s.email).length}</strong></div>
            <div><span>Com Telefone</span><strong>${suppliers.filter(s => s.phone).length}</strong></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nome / Empresa</th>
                <th>Contacto</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>NIF</th>
                <th>Endereço</th>
              </tr>
            </thead>
            <tbody>
              ${suppliers.map(s => `
                <tr>
                  <td style="font-weight: bold; color: #0f172a;">${s.name}</td>
                  <td style="color: #64748b;">${s.contact_name || '—'}</td>
                  <td>${s.phone || '—'}</td>
                  <td style="color: #4f46e5;">${s.email || '—'}</td>
                  <td style="font-family: monospace; font-size: 12px;">${s.nif || '—'}</td>
                  <td style="color: #64748b; font-size: 12px;">${s.address || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Gerado automaticamente pela SmartS Ecosystem — Confidencial para uso interno.</p>
          </div>
        </body>
      </html>
    `;
  },

  getAuditReportHtml(company: Company, entries: HistoryEntry[]) {
    const actionLabel: Record<string, string> = {
      create: 'Criação',
      update: 'Edição',
      delete: 'Eliminação',
      login: 'Login',
      logout: 'Logout',
    };
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #334155; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
            .badge-create { background: #dcfce7; color: #166534; }
            .badge-update { background: #dbeafe; color: #1e40af; }
            .badge-delete { background: #fee2e2; color: #991b1b; }
            .badge-default { background: #f1f5f9; color: #475569; }
            table { width: 100%; border-collapse: collapse; }
            th { background-color: #4f46e5; color: white; text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
            td { padding: 11px 12px; font-size: 12px; vertical-align: middle; }
            tr:nth-child(even) td { background-color: #eef2ff; }
            tr:nth-child(odd) td { background-color: #ffffff; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          ${companyHeader(company, 'Auditoria de Atividade', '#4f46e5')}
          <p style="font-size: 12px; color: #64748b; margin: -10px 0 20px 0;">Últimos ${entries.length} registos</p>
          <table>
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Ação</th>
                <th>Módulo</th>
                <th>ID do Registo</th>
                <th>Utilizador</th>
              </tr>
            </thead>
            <tbody>
              ${entries.map(e => {
                const badgeClass = e.action === 'create' ? 'badge-create' : e.action === 'update' ? 'badge-update' : e.action === 'delete' ? 'badge-delete' : 'badge-default';
                const label = actionLabel[e.action] ?? e.action;
                const dt = new Date(e.created_at);
                return `
                  <tr>
                    <td style="white-space: nowrap;">${dt.toLocaleDateString('pt-PT')} ${dt.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td><span class="badge ${badgeClass}">${label}</span></td>
                    <td style="font-weight: bold; text-transform: capitalize;">${e.table_name.replace(/_/g, ' ')}</td>
                    <td style="font-family: monospace; font-size: 11px; color: #64748b;">${e.record_id.slice(0, 8)}…</td>
                    <td style="font-family: monospace; font-size: 11px; color: #64748b;">${e.user_id.slice(0, 8)}…</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Documento gerado pela SmartS Ecosystem — Uso restrito e confidencial.</p>
          </div>
        </body>
      </html>
    `;
  },

  async generateSuppliersReport(company: Company, suppliers: Supplier[]) {
    const html = this.getSuppliersReportHtml(company, suppliers);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  },

  async generateAuditReport(company: Company, entries: HistoryEntry[]) {
    const html = this.getAuditReportHtml(company, entries);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  },

  async shareByEmail(html: string, subject: string, body: string) {
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      // Fallback to general sharing if Email app isn't configured
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      return;
    }

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await MailComposer.composeAsync({
        subject,
        body,
        attachments: [uri],
      });
    } catch (error) {
      console.error('Error sharing via Email:', error);
      throw error;
    }
  }
};
