export type UserRole = 'admin' | 'manager' | 'operator' | 'viewer' | 'vendedor' | 'contador'
export type MovementType = 'entry' | 'exit' | 'transfer' | 'adjustment'
export type NoteType = 'entry' | 'exit' | 'transfer'
export type OrderStatus = 'pending' | 'picking' | 'completed' | 'cancelled' | 'shipped' | 'delivered' | 'paid'
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled'
export type SyncStatus = 0 | 1

export interface Company {
  readonly id: string
  name: string
  nif: string | null
  address: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  readonly created_at: string
  synced: SyncStatus
}

export interface User {
  readonly id: string
  name: string
  email: string
  role: UserRole
  company_id: string | null // Current active company
  logo_url: string | null
  is_active: 0 | 1
  readonly created_at: string
  updated_at: string
  synced: SyncStatus
}

export interface Category {
  readonly id: string
  company_id: string
  name: string
  description: string | null
  readonly created_at: string
  synced: SyncStatus
}

export interface Supplier {
  readonly id: string
  company_id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  nif: string | null
  readonly created_at: string
  synced: SyncStatus
}

export interface Customer {
  readonly id: string
  company_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  nif: string | null
  readonly created_at: string
  synced: SyncStatus
}

export interface Product {
  readonly id: string
  company_id: string
  name: string
  barcode: string | null
  sku: string
  category_id: string | null
  category?: string // Joined field for UI
  brand: string | null
  unit: string
  units_per_box: number | null
  boxes_per_pallet: number | null
  minimum_stock: number
  current_stock: number
  purchase_price: number | null
  sale_price: number | null
  tax_rate: number | null
  supplier_id: string | null
  supplier?: string // Joined field for UI
  description: string | null
  image_url: string | null
  expiry_date?: string | null
  is_active: 0 | 1
  readonly created_at: string
  updated_at: string
  synced: SyncStatus
}

export interface Order {
  readonly id: string
  company_id: string
  customer_id: string | null
  customer_name: string
  user_id: string
  number: string
  status: OrderStatus
  total_amount: number
  discount: number
  tax_amount: number
  notes: string | null
  readonly created_at: string
  updated_at: string
  synced: SyncStatus
}

export interface OrderItem {
  readonly id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  tax_rate: number
  total: number
}

export interface Invoice {
  readonly id: string
  company_id: string
  order_id: string | null
  customer_id: string
  number: string
  type: 'invoice' | 'credit_note'
  status: InvoiceStatus
  total_amount: number
  due_date: string | null
  readonly created_at: string
  synced: SyncStatus
}

export interface StockMovement {
  readonly id: string
  company_id: string
  product_id: string
  type: MovementType
  quantity: number
  user_id: string
  reason: string | null
  readonly created_at: string
  synced: SyncStatus
}

export interface ExpiryLot {
  readonly id: string
  company_id: string
  product_id: string
  lot_number: string
  expiry_date: string
  quantity: number
  readonly created_at: string
  updated_at: string
  synced: SyncStatus
}

export interface Note {
  readonly id: string
  company_id: string
  number: string
  type: NoteType
  user_id: string
  items: string // JSON string of NoteItem[] in SQLite
  readonly created_at: string
  synced: SyncStatus
}

export interface NoteItem {
  product_id: string
  quantity: number
}

export interface FinancialTransaction {
  readonly id: string
  company_id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string | null
  date: string
  status: 'pending' | 'paid'
  related_type: 'order' | 'invoice' | 'other'
  related_id: string | null
  readonly created_at: string
  synced: SyncStatus
}

export interface HistoryEntry {
  readonly id: string
  company_id: string
  action: string
  table_name: string
  record_id: string
  user_id: string
  data: string
  readonly created_at: string
}

export interface Settings {
  dark_mode: 0 | 1
  currency: string
  language: string
  unit_of_measure: string
  include_tax: 0 | 1
}
