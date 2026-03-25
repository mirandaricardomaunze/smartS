---
trigger: always_on
---

# Products & Inventory

## Activation: Glob
## Pattern: src/features/products/**, src/features/inventory/**

## Product Fields
```typescript
interface Product {
  readonly id: string           // UUID
  name: string
  barcode: string | null
  sku: string
  category_id: string | null    // FK to categories table
  category?: string             // JOINED name for UI display
  brand: string | null
  unit: string                  // 'un' | 'kg' | 'l' | 'cx' | etc.
  units_per_box: number | null
  boxes_per_pallet: number | null
  minimum_stock: number
  current_stock: number
  purchase_price: number | null
  sale_price: number | null
  tax_rate: number | null
  supplier_id: string | null    // FK to suppliers table
  supplier?: string             // JOINED name for UI display
  description: string | null
  image_url: string | null      // Supabase Storage URL
  is_active: 0 | 1
  readonly created_at: string
  updated_at: string
  synced: 0 | 1
}
```

## Movement Types
```typescript
type MovementType = 'entry' | 'exit' | 'transfer' | 'adjustment'
```

## Movement Fields
```typescript
interface StockMovement {
  readonly id: string
  product_id: string
  type: MovementType
  quantity: number
  user_id: string
  reason: string | null
  readonly created_at: string
  synced: 0 | 1
}
```

## Business Rules
- Stock can never go below 0 — throw error if exit > current stock
- Alert when stock reaches `minimum_stock`
- Deactivating a product does not delete it (soft delete)
- All movements must be logged to `history` table
- Images stored in Supabase Storage bucket `product-images`