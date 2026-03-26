import { db } from '@/database/sqlite'
import { Product } from '@/types'

export interface RestockItem {
  id: string
  name: string
  current_stock: number
  minimum_stock: number
  suggested_quantity: number
  purchase_price: number
}

export const procurementService = {
  /**
   * Get list of products that need restock for a specific supplier
   */
  getRestockNeeds(supplierId: string): RestockItem[] {
    const query = `
      SELECT id, name, current_stock, minimum_stock, purchase_price
      FROM products
      WHERE supplier_id = ? AND is_active = 1 AND current_stock <= minimum_stock
    `
    const rawData = db.getAllSync<any>(query, [supplierId])

    return rawData.map(p => ({
      id: p.id,
      name: p.name,
      current_stock: p.current_stock,
      minimum_stock: p.minimum_stock,
      suggested_quantity: Math.max(p.minimum_stock * 2 - p.current_stock, p.minimum_stock),
      purchase_price: p.purchase_price || 0
    }))
  },

  /**
   * Generates a professional restock request text
   */
  generateRestockMessage(supplierName: string, items: RestockItem[]): string {
    const date = new Date().toLocaleDateString('pt-PT')
    let message = `*Pedido de Reposição - SmartS*\n`
    message += `Fornecedor: ${supplierName}\n`
    message += `Data: ${date}\n\n`
    message += `Olá, gostaria de solicitar a reposição dos seguintes itens:\n\n`

    items.forEach(item => {
      message += `• ${item.name}: ${item.suggested_quantity} unidades\n`
    })

    message += `\nPor favor, confirmem a disponibilidade e o prazo de entrega.\n`
    message += `Atenciosamente,\n[Nome da Empresa]`

    return message
  }
}
