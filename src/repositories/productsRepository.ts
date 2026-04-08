import { db } from '@/database/sqlite'
import { addToSyncQueue } from '@/utils/syncData'
import { Product } from '@/types'
import { generateUUID } from '@/utils/uuid'
import { logger } from '@/utils/logger'

const MAX_QUERY_LIMIT = 500

export const productsRepository = {
  getAll(companyId: string, limit: number = 20, offset: number = 0, search?: string): Product[] {
    let query = `
      SELECT p.*, c.name as category, s.name as supplier
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.company_id = ? AND p.is_active = 1
    `
    const params: (string | number)[] = [companyId]

    if (search) {
      query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ? OR p.reference LIKE ?)`
      const pattern = `%${search}%`
      params.push(pattern, pattern, pattern, pattern)
    }

    query += ` ORDER BY p.name ASC LIMIT ? OFFSET ?`
    params.push(Math.min(limit, MAX_QUERY_LIMIT), offset)

    return db.getAllSync<Product>(query, params)
  },

  getById(companyId: string, id: string): Product | null {
    return db.getFirstSync<Product>(
      `SELECT p.*, c.name as category, s.name as supplier
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.id = ? AND p.company_id = ?`,
      [id, companyId]
    ) ?? null
  },

  getByIds(companyId: string, ids: string[]): Product[] {
    if (ids.length === 0) return []
    const placeholders = ids.map(() => '?').join(', ')
    return db.getAllSync<Product>(
      `SELECT p.*, c.name as category, s.name as supplier
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.company_id = ? AND p.id IN (${placeholders})`,
      [companyId, ...ids]
    )
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
      `INSERT INTO products
         (id, company_id, name, barcode, reference, sku, category_id, brand, unit,
          units_per_box, boxes_per_pallet, minimum_stock, current_stock,
          purchase_price, sale_price, tax_rate, supplier_id, description,
          image_url, expiry_date, is_active, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.id, product.company_id, product.name,
        product.barcode ?? null, product.reference ?? null, product.sku,
        product.category_id ?? null, product.brand ?? null, product.unit,
        product.units_per_box ?? null, product.boxes_per_pallet ?? null,
        product.minimum_stock, product.current_stock,
        product.purchase_price ?? null, product.sale_price ?? null,
        product.tax_rate ?? null, product.supplier_id ?? null,
        product.description ?? null, product.image_url ?? null,
        product.expiry_date ?? null, product.is_active,
        product.created_at, product.updated_at, product.synced,
      ]
    )

    const validColumns = new Set([
      'id', 'company_id', 'name', 'barcode', 'reference', 'sku', 'category_id', 'brand',
      'unit', 'units_per_box', 'boxes_per_pallet', 'minimum_stock', 'current_stock',
      'purchase_price', 'sale_price', 'tax_rate', 'supplier_id', 'description',
      'image_url', 'expiry_date', 'is_active', 'created_at', 'updated_at', 'synced',
    ])

    const syncProduct = Object.fromEntries(
      Object.entries(product).filter(([key]) => validColumns.has(key))
    )

    addToSyncQueue('products', 'INSERT', syncProduct)
    return product
  },

  update(id: string, companyId: string, data: Partial<Product>): void {
    const updated = { ...data, updated_at: new Date().toISOString(), synced: 0 }

    const validColumns = new Set([
      'company_id', 'name', 'barcode', 'reference', 'sku', 'category_id', 'brand',
      'unit', 'units_per_box', 'boxes_per_pallet', 'minimum_stock', 'current_stock',
      'purchase_price', 'sale_price', 'tax_rate', 'supplier_id', 'description',
      'image_url', 'expiry_date', 'is_active', 'updated_at', 'synced',
    ])

    const fieldsToUpdate = Object.keys(updated).filter(key => validColumns.has(key))
    const setClause = fieldsToUpdate.map(key => `${key} = ?`).join(', ')
    const values: (string | number | null)[] = fieldsToUpdate.map(key => (updated as Record<string, string | number | null>)[key])

    db.runSync(
      `UPDATE products SET ${setClause} WHERE id = ? AND company_id = ?`,
      [...values, id, companyId]
    )

    const current = this.getById(companyId, id)
    if (current) {
      addToSyncQueue('products', 'UPDATE', current)
    } else {
      logger.warn(`[products] update: produto id="${id}" não encontrado após UPDATE — sync ignorado`)
    }
  },

  delete(companyId: string, id: string): void {
    const updated_at = new Date().toISOString()
    db.runSync(
      'UPDATE products SET is_active=0, synced=0, updated_at=? WHERE id=? AND company_id=?',
      [updated_at, id, companyId]
    )
    addToSyncQueue('products', 'UPDATE', { id, company_id: companyId, is_active: 0, updated_at })
  },

  count(companyId: string): number {
    const result = db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM products WHERE company_id = ? AND is_active = 1',
      [companyId]
    )
    return result?.count ?? 0
  },
}
