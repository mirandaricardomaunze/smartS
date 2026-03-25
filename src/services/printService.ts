import { Order, OrderItem, Company } from '@/types'
import { formatDate } from '@/utils/formatters'

export const printService = {
  /**
   * Formats an order into a text receipt for thermal printers (58mm/80mm)
   */
  formatThermalReceipt: (order: Order, items: OrderItem[], company: Company) => {
    const divider = '--------------------------------'
    const thickDivider = '================================'
    
    let text = `${company.name.toUpperCase()}\n`
    if (company.nif) text += `NIF: ${company.nif}\n`
    if (company.phone) text += `TEL: ${company.phone}\n`
    if (company.address) text += `${company.address}\n`
    
    text += `${thickDivider}\n`
    text += `PEDIDO #${order.number}\n`
    text += `CLIENTE: ${order.customer_name}\n`
    text += `DATA: ${formatDate(order.created_at)}\n`
    text += `${divider}\n`
    
    text += 'PROD        QTD      TOTAL\n'
    text += `${divider}\n`
    
    items.forEach(item => {
      const name = (item as any).name || 'Produto'
      const line = `${name.substring(0, 10).padEnd(12)} ${item.quantity.toString().padEnd(8)} ${item.total.toFixed(2)}\n`
      text += line
    })
    
    text += `${divider}\n`
    if (order.discount > 0) {
      text += `DESCONTO:            -${order.discount.toFixed(2)}\n`
    }
    text += `TOTAL:               ${order.total_amount.toFixed(2)}\n`

    const { useSettingsStore } = require('@/features/settings/store/settingsStore')
    const settings = useSettingsStore.getState().settings
    if (settings.include_tax === 1) {
      text += `IVA INC.:            ${order.tax_amount.toFixed(2)}\n`
    }

    text += `${thickDivider}\n`
    text += 'OBRIGADO PELA PREFERENCIA\n'
    text += 'Volte Sempre!\n\n\n'
    
    return text
  },
  
  /**
   * Simulates printing by logging to console
   */
  print: async (text: string) => {
    console.log('--- THERMAL PRINT OUTPUT ---')
    console.log(text)
    console.log('----------------------------')
    return true
  }
}
