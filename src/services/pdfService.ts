import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import { Company } from '@/types';

export const pdfService = {
  getStockReportHtml(company: any, products: any[]) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #334155; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { margin: 0; color: #4f46e5; font-size: 24px; }
            .company-info p { margin: 5px 0 0 0; font-size: 14px; color: #64748b; }
            .report-title { text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f8fafc; text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .stock-low { color: #ef4444; font-weight: bold; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>${company?.name || 'SmartS Inventory'}</h1>
              <p>${company?.nif ? `NIF: ${company.nif}` : ''}</p>
              <p>${company?.address || ''}</p>
            </div>
            <div style="text-align: right">
              <p style="font-weight: bold; color: #4f46e5;">Relatório de Inventário</p>
              <p style="font-size: 12px;">Data: ${new Date().toLocaleDateString('pt-PT')}</p>
            </div>
          </div>

          <div class="report-title">
            <h2>Estado Geral de Produtos</h2>
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
              </tr>
            </thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td style="font-weight: bold">${p.name}</td>
                  <td style="color: #64748b; font-family: monospace;">${p.reference || '-'}</td>
                  <td>${p.barcode || '-'}</td>
                  <td>${p.category || '-'}</td>
                  <td style="text-align: right">${p.sale_price?.toFixed(2) || '0.00'} MT</td>
                  <td style="text-align: center" class="${p.current_stock <= p.minimum_stock ? 'stock-low' : ''}">
                    ${p.current_stock} ${p.unit || 'un'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Gerado automaticamente pela SmartS Ecosystem - A sua gestão na palma da mão.</p>
          </div>
        </body>
      </html>
    `;
  },

  getFinancialReportHtml(company: any, stats: any) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #334155; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { margin: 0; color: #8b5cf6; font-size: 24px; }
            .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .card { border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; }
            .card h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #64748b; }
            .card p { margin: 0; font-size: 20px; font-weight: bold; color: #1e293b; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>${company?.name || 'SmartS Inventory'}</h1>
              <p>Relatório de Fluxo de Caixa</p>
            </div>
            <div style="text-align: right">
              <p style="font-size: 12px;">Périodo: Últimos 30 dias</p>
              <p style="font-size: 12px;">Data: ${new Date().toLocaleDateString('pt-PT')}</p>
            </div>
          </div>

          <div class="summary-grid">
            <div class="card">
              <h3>Total Entradas</h3>
              <p style="color: #10b981">${stats.totalIncomes.toFixed(2)} MT</p>
            </div>
            <div class="card">
              <h3>Total Saídas</h3>
              <p style="color: #ef4444">${stats.totalExpenses.toFixed(2)} MT</p>
            </div>
            <div class="card" style="grid-column: span 2; background-color: #f8fafc">
              <h3>Saldo do Período</h3>
              <p style="font-size: 28px">${(stats.totalIncomes - stats.totalExpenses).toFixed(2)} MT</p>
            </div>
          </div>

          <div class="footer">
            <p>Este documento é para uso interno e informativo.</p>
          </div>
        </body>
      </html>
    `;
  },

  getMovementsReportHtml(company: any, movements: any[]) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #334155; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { margin: 0; color: #059669; font-size: 24px; }
            table { width: 100%; border-collapse: collapse; }
            th { background-color: #f0fdf4; text-align: left; padding: 12px; border-bottom: 2px solid #bbf7d0; font-size: 11px; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .type-entry { color: #10b981; font-weight: bold; }
            .type-exit { color: #ef4444; font-weight: bold; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>${company?.name}</h1>
              <p>Relatório de Movimentação de Stock</p>
            </div>
            <div style="text-align: right">
              <p style="font-size: 12px;">Data: ${new Date().toLocaleDateString('pt-PT')}</p>
            </div>
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
                  <td>${new Date(m.created_at).toLocaleDateString('pt-PT')}</td>
                  <td style="font-weight: bold">${m.product_name || 'Desconhecido'}</td>
                  <td class="type-${m.type}">${m.type === 'entry' ? 'Entrada' : 'Saída'}</td>
                  <td style="text-align: right">${m.quantity}</td>
                  <td style="color: #64748b">${m.reason || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
  },

  getExpiryReportHtml(company: any, lots: any[]) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #334155; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f59e0b; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { margin: 0; color: #d97706; font-size: 24px; }
            table { width: 100%; border-collapse: collapse; }
            th { background-color: #fffbeb; text-align: left; padding: 12px; border-bottom: 2px solid #fef3c7; font-size: 11px; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>${company?.name}</h1>
              <p>Relatório de Validades Próximas (90 dias)</p>
            </div>
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
              ${lots.map(l => `
                <tr>
                  <td style="font-weight: bold">${l.name}</td>
                  <td>${l.reference || '-'}</td>
                  <td>${l.lot_number || '-'}</td>
                  <td style="color: #ef4444; font-weight: bold">${new Date(l.expiry_date).toLocaleDateString('pt-PT')}</td>
                  <td style="text-align: right">${l.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
  },

  getSalesReportHtml(company: any, sales: any[]) {
    const total = sales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #334155; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { margin: 0; color: #4338ca; font-size: 24px; }
            table { width: 100%; border-collapse: collapse; }
            th { background-color: #eef2ff; text-align: left; padding: 12px; border-bottom: 2px solid #e0e7ff; font-size: 11px; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; }
            .total-box { margin-top: 20px; padding: 15px; background: #f8fafc; text-align: right; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>${company?.name}</h1>
              <p>Histórico de Vendas (30 dias)</p>
            </div>
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
              ${sales.map(s => `
                <tr>
                  <td>${new Date(s.created_at).toLocaleDateString('pt-PT')}</td>
                  <td style="font-weight: bold">${s.number}</td>
                  <td>${s.customer_name || 'Geral'}</td>
                  <td style="text-transform: capitalize">${s.status}</td>
                  <td style="text-align: right; font-weight: bold">${s.total_amount.toFixed(2)} MT</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total-box">
             <p>Faturação Total do Período: <strong style="font-size: 18px; color: #4338ca;">${total.toFixed(2)} MT</strong></p>
          </div>
        </body>
      </html>
    `;
  },

  getPurchaseOrderHtml(company: any, supplier: any, items: any[]) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #334155; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { margin: 0; color: #4f46e5; font-size: 26px; font-weight: 900; }
            .company-info p { margin: 2px 0; font-size: 12px; color: #64748b; }
            .order-title { text-align: center; margin-bottom: 30px; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
            .details-box { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .details-box h3 { margin: 0 0 10px 0; font-size: 10px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
            .details-box p { margin: 2px 0; font-size: 13px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #4f46e5; color: white; text-align: left; padding: 12px; font-size: 10px; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            .total-row { background: #f8fafc; font-weight: bold; font-size: 16px; }
            .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #94a3b8; }
            .badge { background: #4f46e5; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; float: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>${company?.name || 'SmartS Business'}</h1>
              <p>NIF: ${company?.nif || '---'}</p>
              <p>${company?.address || 'Moçambique'}</p>
              <p>Tel: ${company?.phone || '---'}</p>
            </div>
            <div style="text-align: right">
              <span class="badge">ORDEM DE COMPRA</span>
              <p style="margin-top: 30px; font-size: 12px; color: #64748b;">Nº Pedido: <strong>PO-${new Date().getTime().toString().slice(-6)}</strong></p>
              <p style="font-size: 12px; color: #64748b;">Data: ${new Date().toLocaleDateString('pt-PT')}</p>
            </div>
          </div>

          <div class="details-grid">
            <div class="details-box">
              <h3>Fornecedor</h3>
              <p>${supplier?.name}</p>
              <p style="font-weight: normal; font-size: 12px; color: #64748b;">${supplier?.contact_name || ''}</p>
              <p style="font-weight: normal; font-size: 12px; color: #64748b;">${supplier?.phone || ''}</p>
            </div>
            <div class="details-box">
              <h3>Instruções de Entrega</h3>
              <p>Entregar no endereço da empresa</p>
              <p style="font-weight: normal; font-size: 12px; color: #64748b;">Horário: 08:00 - 17:00</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 60%">Descrição do Artigo</th>
                <th style="text-align: center">Quantidade</th>
                <th style="text-align: right">Preço Un. (Est.)</th>
                <th style="text-align: right">Total (Est.)</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td style="font-weight: bold">
                    <div style="font-size: 13px;">${item.name}</div>
                    <div style="font-size: 10px; color: #64748b; margin-top: 4px;">REF: ${item.reference || '---'}</div>
                  </td>
                  <td style="text-align: center">${item.suggested_quantity}</td>
                  <td style="text-align: right">${(item.purchase_price || 0).toFixed(2)} MT</td>
                  <td style="text-align: right">${((item.purchase_price || 0) * item.suggested_quantity).toFixed(2)} MT</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3" style="text-align: right; padding: 20px;">Valor Total Estimado:</td>
                <td style="text-align: right; padding: 20px; color: #4f46e5;">
                  ${items.reduce((acc, item) => acc + (item.purchase_price || 0) * item.suggested_quantity, 0).toFixed(2)} MT
                </td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 40px; padding: 20px; border: 1px dashed #e2e8f0; border-radius: 8px;">
            <p style="font-size: 11px; color: #64748b;"><strong>Observações:</strong> Os preços indicados são baseados nos nossos registos internos. Por favor, confirmem os preços atuais antes do envio da fatura final. Este documento não substitui uma fatura oficial.</p>
          </div>

          <div class="footer">
            <p>Gerado via SmartS Logistics - Gestão Profissional de Inventário</p>
          </div>
        </body>
      </html>
    `;
  },

  async generateStockReport(company: any, products: any[]) {
    const html = this.getStockReportHtml(company, products);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  },

  async generateFinancialReport(company: any, stats: any) {
    const html = this.getFinancialReportHtml(company, stats);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  },

  async generatePurchaseOrder(company: any, supplier: any, items: any[]) {
    const html = this.getPurchaseOrderHtml(company, supplier, items);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  },

  async generateMovementsReport(company: any, movements: any[]) {
    const html = this.getMovementsReportHtml(company, movements);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  },

  async generateExpiryReport(company: any, lots: any[]) {
    const html = this.getExpiryReportHtml(company, lots);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  },

  async generateSalesReport(company: any, sales: any[]) {
    const html = this.getSalesReportHtml(company, sales);
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
