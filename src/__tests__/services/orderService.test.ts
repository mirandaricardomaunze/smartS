import { orderService } from '../../services/orderService'

// ── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('@/repositories/orderRepository', () => ({
  orderRepository: {
    getAll: jest.fn(),
    getById: jest.fn(),
    getOrderItems: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
  },
}))

jest.mock('@/repositories/movementsRepository', () => ({
  movementsRepository: {
    create: jest.fn(),
    getById: jest.fn(),
  },
}))

jest.mock('@/repositories/invoiceRepository', () => ({
  invoiceRepository: {
    create: jest.fn(),
    getAll: jest.fn(() => []),
    getByOrderId: jest.fn(),
    updateStatus: jest.fn(),
  },
}))

jest.mock('@/features/notifications/services/notificationService', () => ({
  notificationService: {
    checkNewOrders: jest.fn(),
  },
}))

jest.mock('@/store/companyStore', () => ({
  useCompanyStore: {
    getState: jest.fn(() => ({ activeCompanyId: 'company-1' })),
  },
}))

jest.mock('@/utils/validation', () => ({
  validate: {
    order: jest.fn(),
  },
}))

// ── Imports after mocks ─────────────────────────────────────────────────────

import { orderRepository } from '../../repositories/orderRepository'
import { movementsRepository } from '../../repositories/movementsRepository'
import { invoiceRepository } from '../../repositories/invoiceRepository'
import { notificationService } from '../../features/notifications/services/notificationService'
import { useCompanyStore } from '../../store/companyStore'

const mockOrderRepo = orderRepository as any
const mockMovRepo = movementsRepository as any
const mockInvoiceRepo = invoiceRepository as any
const mockNotif = notificationService as any

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeOrder(overrides: any = {}): any {
  return {
    id: 'order-1',
    company_id: 'company-1',
    customer_id: 'cust-1',
    user_id: 'user-1',
    number: 'P-001',
    status: 'pending',
    total_amount: 500,
    discount: 0,
    tax_amount: 0,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    synced: 0 as 0 | 1,
    customer_name: 'Cliente Teste',
    ...overrides,
  }
}

function makeItem(overrides: any = {}): any {
  return {
    id: 'item-1',
    order_id: 'order-1',
    product_id: 'prod-1',
    quantity: 2,
    unit_price: 250,
    tax_rate: 0,
    total: 500,
    name: 'Produto Teste',
    reference: null,
    ...overrides,
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
})

// ── getAll / getById ────────────────────────────────────────────────────────

describe('orderService.getAll', () => {
  it('should call orderRepository.getAll with activeCompanyId', () => {
    mockOrderRepo.getAll.mockReturnValue([])
    const result = orderService.getAll()
    expect(mockOrderRepo.getAll).toHaveBeenCalledWith('company-1', 20, 0, undefined)
    expect(result).toEqual([])
  })

  it('should return empty array when no active company', () => {
    ;(useCompanyStore.getState as jest.Mock).mockReturnValueOnce({ activeCompanyId: null })
    const result = orderService.getAll()
    expect(result).toEqual([])
    expect(mockOrderRepo.getAll).not.toHaveBeenCalled()
  })

  it('should forward limit, offset and status', () => {
    mockOrderRepo.getAll.mockReturnValue([])
    orderService.getAll(10, 5, 'pending')
    expect(mockOrderRepo.getAll).toHaveBeenCalledWith('company-1', 10, 5, 'pending')
  })
})

describe('orderService.getById', () => {
  it('should return order by id', () => {
    const order = makeOrder()
    mockOrderRepo.getById.mockReturnValue(order)
    const result = orderService.getById('order-1')
    expect(mockOrderRepo.getById).toHaveBeenCalledWith('company-1', 'order-1')
    expect(result).toEqual(order)
  })

  it('should return null when no active company', () => {
    ;(useCompanyStore.getState as jest.Mock).mockReturnValueOnce({ activeCompanyId: null })
    const result = orderService.getById('order-1')
    expect(result).toBeNull()
  })
})

// ── createProfessionalOrder ─────────────────────────────────────────────────

describe('orderService.createProfessionalOrder', () => {
  it('should create an order, invoice, and check notifications', async () => {
    const order = makeOrder()
    mockOrderRepo.create.mockResolvedValue(order)
    mockInvoiceRepo.create.mockResolvedValue({} as any)
    mockNotif.checkNewOrders.mockResolvedValue(undefined)

    const items = [{ product_id: 'prod-1', quantity: 2, unit_price: 250, tax_rate: 0, total: 500 }]
    const result = await orderService.createProfessionalOrder(
      { company_id: 'company-1', customer_id: 'cust-1', user_id: 'user-1', number: 'P-001', status: 'pending', total_amount: 500, discount: 0, tax_amount: 0, notes: null, customer_name: 'Test' },
      items
    )

    expect(mockOrderRepo.create).toHaveBeenCalled()
    expect(mockInvoiceRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      number: 'FT-P-001',
      type: 'invoice',
      status: 'draft',
      total_amount: 500,
    }))
    expect(mockNotif.checkNewOrders).toHaveBeenCalledWith('company-1')
    expect(result).toEqual(order)
  })
})

// ── startPicking ────────────────────────────────────────────────────────────

describe('orderService.startPicking', () => {
  it('should throw if order not found', async () => {
    mockOrderRepo.getById.mockReturnValue(null)
    await expect(orderService.startPicking('company-1', 'order-1')).rejects.toThrow('não encontrado')
  })

  it('should throw if order is not pending', async () => {
    mockOrderRepo.getById.mockReturnValue(makeOrder({ status: 'completed' }))
    await expect(orderService.startPicking('company-1', 'order-1')).rejects.toThrow('pendente')
  })

  it('should throw if order has no items', async () => {
    mockOrderRepo.getById.mockReturnValue(makeOrder())
    mockOrderRepo.getOrderItems.mockReturnValue([])
    await expect(orderService.startPicking('company-1', 'order-1')).rejects.toThrow('sem itens')
  })

  it('should create exit movements and update status to picking', async () => {
    const order = makeOrder()
    const item = makeItem()
    mockOrderRepo.getById.mockReturnValue(order)
    mockOrderRepo.getOrderItems.mockReturnValue([item])
    mockMovRepo.create.mockResolvedValue({ id: 'mov-1', ...item })
    mockOrderRepo.updateStatus.mockReturnValue(undefined)

    await orderService.startPicking('company-1', 'order-1')

    expect(mockMovRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      product_id: 'prod-1',
      type: 'exit',
      quantity: 2,
    }))
    expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith('company-1', 'order-1', 'picking')
  })

  it('should rollback stock movements if an item fails mid-picking', async () => {
    const order = makeOrder()
    const item1 = makeItem({ id: 'item-1', product_id: 'prod-1' })
    const item2 = makeItem({ id: 'item-2', product_id: 'prod-2' })
    mockOrderRepo.getById.mockReturnValue(order)
    mockOrderRepo.getOrderItems.mockReturnValue([item1, item2])

    // First movement succeeds, second fails
    mockMovRepo.create
      .mockResolvedValueOnce({ id: 'mov-1', product_id: 'prod-1', quantity: 2 })
      .mockRejectedValueOnce(new Error('Stock insuficiente'))
      .mockResolvedValue({ id: 'rollback-mov', product_id: 'prod-1', quantity: 2 })

    mockMovRepo.getById.mockReturnValue({ id: 'mov-1', product_id: 'prod-1', quantity: 2 } as any)

    await expect(orderService.startPicking('company-1', 'order-1')).rejects.toThrow('Stock insuficiente')

    // Should have tried to rollback the first successful movement
    const calls = mockMovRepo.create.mock.calls
    const rollbackCall = calls.find((c: any) => c[0].type === 'entry' && c[0].reason?.includes('Reversão'))
    expect(rollbackCall).toBeDefined()
  })
})

// ── finishOrder ─────────────────────────────────────────────────────────────

describe('orderService.finishOrder', () => {
  it('should throw if order not found', async () => {
    mockOrderRepo.getById.mockReturnValue(null)
    await expect(orderService.finishOrder('company-1', 'order-1')).rejects.toThrow('não encontrado')
  })

  it('should throw if order status is not picking or pending', async () => {
    mockOrderRepo.getById.mockReturnValue(makeOrder({ status: 'cancelled' }))
    await expect(orderService.finishOrder('company-1', 'order-1')).rejects.toThrow('não pode ser finalizado')
  })

  it('should finalize a picking order and issue invoice', async () => {
    const order = makeOrder({ status: 'picking' })
    const invoice = { id: 'inv-1', status: 'draft' }
    mockOrderRepo.getById.mockReturnValue(order)
    mockOrderRepo.updateStatus.mockReturnValue(undefined)
    mockInvoiceRepo.getByOrderId.mockReturnValue(invoice as any)
    mockInvoiceRepo.updateStatus.mockResolvedValue(undefined)

    await orderService.finishOrder('company-1', 'order-1')

    expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith('company-1', 'order-1', 'completed')
    expect(mockInvoiceRepo.updateStatus).toHaveBeenCalledWith('company-1', 'inv-1', 'issued')
  })
})

// ── cancelOrder ─────────────────────────────────────────────────────────────

describe('orderService.cancelOrder', () => {
  it('should throw if order not found', async () => {
    mockOrderRepo.getById.mockReturnValue(null)
    await expect(orderService.cancelOrder('company-1', 'order-1', 'user-1')).rejects.toThrow('não encontrado')
  })

  it('should throw if order is already cancelled', async () => {
    mockOrderRepo.getById.mockReturnValue(makeOrder({ status: 'cancelled' }))
    await expect(orderService.cancelOrder('company-1', 'order-1', 'user-1')).rejects.toThrow('já está cancelado')
  })

  it('should cancel a pending order without restoring stock', async () => {
    mockOrderRepo.getById.mockReturnValue(makeOrder({ status: 'pending' }))
    mockOrderRepo.getOrderItems.mockReturnValue([makeItem()])
    mockOrderRepo.updateStatus.mockResolvedValue(undefined)
    mockInvoiceRepo.getByOrderId.mockReturnValue(null)

    await orderService.cancelOrder('company-1', 'order-1', 'user-1')

    // Pending orders haven't had stock removed, so no entry movements needed
    const entryCalls = mockMovRepo.create.mock.calls.filter((c: any) => c[0].type === 'entry')
    expect(entryCalls).toHaveLength(0)
    expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith('company-1', 'order-1', 'cancelled')
  })

  it('should restore stock when cancelling a picking order', async () => {
    mockOrderRepo.getById.mockReturnValue(makeOrder({ status: 'picking' }))
    mockOrderRepo.getOrderItems.mockReturnValue([makeItem()])
    mockMovRepo.create.mockResolvedValue({ id: 'mov-1' } as any)
    mockOrderRepo.updateStatus.mockResolvedValue(undefined)
    mockInvoiceRepo.getByOrderId.mockReturnValue(null)

    await orderService.cancelOrder('company-1', 'order-1', 'user-1')

    expect(mockMovRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      type: 'entry',
      reason: expect.stringContaining('Cancelamento'),
    }))
  })

  it('should cancel the associated invoice', async () => {
    mockOrderRepo.getById.mockReturnValue(makeOrder({ status: 'pending' }))
    mockOrderRepo.getOrderItems.mockReturnValue([])
    mockOrderRepo.updateStatus.mockResolvedValue(undefined)
    const invoice = { id: 'inv-1', status: 'draft' }
    mockInvoiceRepo.getByOrderId.mockReturnValue(invoice as any)
    mockInvoiceRepo.updateStatus.mockResolvedValue(undefined)

    await orderService.cancelOrder('company-1', 'order-1', 'user-1')

    expect(mockInvoiceRepo.updateStatus).toHaveBeenCalledWith('company-1', 'inv-1', 'cancelled')
  })
})

// ── processPosSale ──────────────────────────────────────────────────────────

describe('orderService.processPosSale', () => {
  it('should create order with completed status, exit movements, and issued invoice', async () => {
    const order = makeOrder({ status: 'completed' })
    mockOrderRepo.create.mockResolvedValue(order)
    mockMovRepo.create.mockResolvedValue({ id: 'mov-1' } as any)
    mockInvoiceRepo.create.mockResolvedValue({} as any)

    const items = [{ product_id: 'prod-1', quantity: 1, unit_price: 500, tax_rate: 0, total: 500 }]
    const result = await orderService.processPosSale(
      { company_id: 'company-1', customer_id: 'cust-1', user_id: 'user-1', number: 'P-001', status: 'completed', total_amount: 500, discount: 0, tax_amount: 0, notes: null, customer_name: 'Test' },
      items
    )

    expect(mockOrderRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed' }),
      items
    )
    expect(mockMovRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      type: 'exit',
      reason: expect.stringContaining('PDV'),
    }))
    expect(mockInvoiceRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      number: 'V-FT-P-001',
      status: 'issued',
    }))
    expect(result).toEqual(order)
  })
})
