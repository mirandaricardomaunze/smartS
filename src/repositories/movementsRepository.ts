import { db } from '@/database/sqlite'
import { addToSyncQueue } from '@/utils/syncData'
import { StockMovement } from '@/types'
import { generateUUID } from '@/utils/uuid'
import { productsRepository } from './productsRepository'

export const movementsRepository = {
  getAll(companyId: string): StockMovement[] {
    return db.getAllSync<StockMovement>(
      'SELECT * FROM movements WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    )
  },
  getByProductId(companyId: string, productId: string): StockMovement[] {
    return db.getAllSync<StockMovement>(
      'SELECT * FROM movements WHERE company_id = ? AND product_id = ? ORDER BY created_at DESC', 
      [companyId, productId]
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
      `INSERT INTO movements (id, company_id, product_id, type, quantity, user_id, reason, created_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [movement.id, movement.company_id, movement.product_id, movement.type, movement.quantity, movement.user_id, movement.reason, movement.created_at, movement.synced]
    )

    // Update product stock immediately
    const product = productsRepository.getById(movement.product_id)
    if (product) {
       let newStock = product.current_stock
       if (movement.type === 'entry' || movement.type === 'adjustment') {
          newStock += movement.quantity
       } else if (movement.type === 'exit') {
          newStock -= movement.quantity
       }
       productsRepository.update(product.id, { current_stock: newStock })
    }

    addToSyncQueue('movements', 'INSERT', movement)
    return movement
  },
}
