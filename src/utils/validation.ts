/**
 * Validation utility — centralised input validation for all layers.
 * Throw ValidationError at the service/repository boundary so callers
 * get a consistent, user-friendly error type.
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export const validate = {
  required(value: unknown, field: string): void {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(`${field} é obrigatório`)
    }
  },

  nonEmptyString(value: unknown, field: string): void {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new ValidationError(`${field} não pode estar vazio`)
    }
  },

  nonEmptyArray(value: unknown[], field: string): void {
    if (!Array.isArray(value) || value.length === 0) {
      throw new ValidationError(`${field} não pode estar vazio`)
    }
  },

  positiveNumber(value: unknown, field: string): void {
    if (typeof value !== 'number' || value < 0) {
      throw new ValidationError(`${field} deve ser um número positivo`)
    }
  },

  percentage(value: unknown, field: string): void {
    if (typeof value !== 'number' || value < 0 || value > 100) {
      throw new ValidationError(`${field} deve estar entre 0 e 100`)
    }
  },

  // ── Domain validators ────────────────────────────────────────────────────

  product(data: {
    name?: unknown
    sale_price?: unknown
    purchase_price?: unknown
    current_stock?: unknown
    minimum_stock?: unknown
    tax_rate?: unknown
  }): void {
    validate.nonEmptyString(data.name, 'Nome do produto')
    if (data.sale_price != null)     validate.positiveNumber(data.sale_price, 'Preço de venda')
    if (data.purchase_price != null) validate.positiveNumber(data.purchase_price, 'Preço de compra')
    if (data.current_stock != null)  validate.positiveNumber(data.current_stock, 'Stock actual')
    if (data.minimum_stock != null)  validate.positiveNumber(data.minimum_stock, 'Stock mínimo')
    if (data.tax_rate != null)       validate.percentage(data.tax_rate, 'Taxa de IVA')
  },

  order(data: { total_amount?: unknown; items?: unknown[] }): void {
    validate.positiveNumber(data.total_amount, 'Total do pedido')
    validate.nonEmptyArray(data.items ?? [], 'Itens do pedido')
  },

  movement(data: { quantity?: unknown; product_id?: unknown }): void {
    validate.required(data.product_id, 'Produto')
    validate.positiveNumber(data.quantity, 'Quantidade')
    if (typeof data.quantity === 'number' && data.quantity === 0) {
      throw new ValidationError('Quantidade deve ser maior que zero')
    }
  },
}
