import { db } from '@/database/sqlite'
import { addToSyncQueue } from '@/utils/syncData'
import { StockMovement } from '@/types'
import { generateUUID } from '@/utils/uuid'
import { productsRepository } from './productsRepository'
import { logger } from '@/utils/logger'

export const movementsRepository = {
  getById(companyId: string, id: string): (StockMovement & { product_name: string }) | null {
    return db.getFirstSync<StockMovement & { product_name: string }>(
      `SELECT m.*, p.name as product_name
       FROM stock_movements m
       JOIN products p ON m.product_id = p.id
       WHERE m.company_id = ? AND m.id = ?`,
      [companyId, id]
    ) ?? null
  },

  getAll(companyId: string, limit: number = 50, offset: number = 0): StockMovement[] {
    return db.getAllSync<StockMovement>(
      'SELECT * FROM stock_movements WHERE company_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [companyId, Math.min(limit, 500), offset]
    )
  },

  getByProductId(companyId: string, productId: string, limit: number = 50, offset: number = 0): StockMovement[] {
    return db.getAllSync<StockMovement>(
      'SELECT * FROM stock_movements WHERE company_id = ? AND product_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [companyId, productId, Math.min(limit, 500), offset]
    )
  },

  create(data: Omit<StockMovement, 'id' | 'created_at' | 'synced'>): StockMovement {
    const movement: StockMovement = {
      ...data,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      synced: 0,
    }

    db.runSync(
      `INSERT INTO stock_movements (id, company_id, product_id, type, quantity, user_id, reason, created_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movement.id, movement.company_id, movement.product_id,
        movement.type, movement.quantity, movement.user_id,
        movement.reason, movement.created_at, movement.synced,
      ]
    )

    // Update product stock — product MUST exist for stock integrity
    const product = productsRepository.getById(movement.company_id, movement.product_id)

    if (!product) {
      throw new Error(`Produto não encontrado (id: ${movement.product_id}). Não é possível registar o movimento.`)
    }

    let newStock = product.current_stock

    if (movement.type === 'entry') {
      newStock += movement.quantity
    } else if (movement.type === 'exit') {
      if (product.current_stock < movement.quantity) {
        throw new Error(
          `Stock insuficiente para "${product.name}". Disponível: ${product.current_stock}, Solicitado: ${movement.quantity}`
        )
      }
      newStock -= movement.quantity
    } else if (movement.type === 'adjustment') {
      newStock += movement.quantity
      if (newStock < 0) {
        throw new Error(
          `O ajuste resultaria em stock negativo para "${product.name}". Corrente: ${product.current_stock}, Ajuste: ${movement.quantity}`
        )
      }
    }

    productsRepository.update(product.id, movement.company_id, { current_stock: newStock })
    logger.debug(`[movements] Stock de "${product.name}" actualizado: ${product.current_stock} → ${newStock}`)

    addToSyncQueue('stock_movements', 'INSERT', movement)
    return movement
  },
}
