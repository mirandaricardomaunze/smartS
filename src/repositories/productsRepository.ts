import { db } from '@/database/sqlite'
import { addToSyncQueue } from '@/utils/syncData'
import { Product } from '@/types'
import { generateUUID } from '@/utils/uuid'

export const productsRepository = {
  getAll(companyId: string): Product[] {
    return db.getAllSync<Product>(
      `SELECT p.*, c.name as category, s.name as supplier 
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.company_id = ? AND p.is_active = 1 
       ORDER BY p.name ASC`,
      [companyId]
    )
  },
  getById(id: string): Product | null {
    return db.getFirstSync<Product>(
      `SELECT p.*, c.name as category, s.name as supplier 
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.id = ?`, [id]
    ) ?? null
  },
  getByBarcode(companyId: string, barcode: string): Product | null {
    return db.getFirstSync<Product>(
      'SELECT * FROM products WHERE company_id = ? AND barcode = ? AND is_active = 1', 
      [companyId, barcode]
    ) ?? null
  },
  create(data: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'synced'>): Product {
    const product: Product = {
      ...data,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: 0,
    }
    db.runSync(
      `INSERT INTO products (id, company_id, name, barcode, sku, category_id, brand, unit, units_per_box, boxes_per_pallet, minimum_stock, current_stock, purchase_price, sale_price, tax_rate, supplier_id, description, image_url, expiry_date, is_active, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.id, 
        product.company_id, 
        product.name, 
        product.barcode ?? null, 
        product.sku, 
        product.category_id ?? null, 
        product.brand ?? null, 
        product.unit, 
        product.units_per_box ?? null, 
        product.boxes_per_pallet ?? null, 
        product.minimum_stock, 
        product.current_stock, 
        product.purchase_price ?? null, 
        product.sale_price ?? null, 
        product.tax_rate ?? null, 
        product.supplier_id ?? null, 
        product.description ?? null, 
        product.image_url ?? null, 
        product.expiry_date ?? null, 
        product.is_active, 
        product.created_at, 
        product.updated_at, 
        product.synced
      ]
    )
    addToSyncQueue('products', 'INSERT', product)
    return product
  },
  update(id: string, data: Partial<Product>): void {
    const updated = { ...data, updated_at: new Date().toISOString(), synced: 0 }
    
    const setClause = Object.keys(updated)
      .map(key => `${key} = ?`)
      .join(', ')
    const values = Object.values(updated)
    
    db.runSync(
      `UPDATE products SET ${setClause} WHERE id = ?`,
      [...values, id]
    )

    const current = this.getById(id)
    if (current) {
      addToSyncQueue('products', 'UPDATE', current)
    }
  },
  delete(id: string): void {
    const updated_at = new Date().toISOString()
    db.runSync('UPDATE products SET is_active=0, synced=0, updated_at=? WHERE id=?', [updated_at, id])
    addToSyncQueue('products', 'UPDATE', { id, is_active: 0, updated_at })
  },
}
