import { financialService } from '../../services/financialService'

// ── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('@/repositories/financialRepository', () => ({
  financialRepository: {
    create: jest.fn(),
    getStats: jest.fn(),
  },
}))

jest.mock('@/repositories/orderRepository', () => ({
  orderRepository: {
    getAll: jest.fn(),
  },
}))

jest.mock('@/repositories/invoiceRepository', () => ({
  invoiceRepository: {
    create: jest.fn(),
    getAll: jest.fn(),
    updateStatus: jest.fn(),
  },
}))

// ── Imports after mocks ─────────────────────────────────────────────────────

import { financialRepository } from '../../repositories/financialRepository'
import { orderRepository } from '../../repositories/orderRepository'
import { invoiceRepository } from '../../repositories/invoiceRepository'

const mockFinRepo = financialRepository as any
const mockOrderRepo = orderRepository as any
const mockInvoiceRepo = invoiceRepository as any

beforeEach(() => jest.clearAllMocks())

// ── recordPayment ───────────────────────────────────────────────────────────

describe('financialService.recordPayment', () => {
  it('should create a financial transaction with correct data', async () => {
    const tx = { id: 'tx-1', type: 'income', amount: 1000 }
    mockFinRepo.create.mockResolvedValue(tx as any)
    mockInvoiceRepo.updateStatus.mockResolvedValue(undefined)

    const result = await financialService.recordPayment('company-1', 'inv-123', 1000)

    expect(mockFinRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      company_id: 'company-1',
      type: 'income',
      category: 'Vendas',
      amount: 1000,
      status: 'paid',
      related_type: 'invoice',
      related_id: 'inv-123',
    }))
    expect(result).toEqual(tx)
  })

  it('should update the invoice status to paid', async () => {
    mockFinRepo.create.mockResolvedValue({} as any)
    mockInvoiceRepo.updateStatus.mockResolvedValue(undefined)

    await financialService.recordPayment('company-1', 'inv-456', 500)

    expect(mockInvoiceRepo.updateStatus).toHaveBeenCalledWith('company-1', 'inv-456', 'paid')
  })

  it('should include the invoice id in the description', async () => {
    mockFinRepo.create.mockResolvedValue({} as any)
    mockInvoiceRepo.updateStatus.mockResolvedValue(undefined)

    await financialService.recordPayment('company-1', 'inv-789', 250)

    const createCall = mockFinRepo.create.mock.calls[0][0]
    expect(createCall.description).toContain('inv-789')
  })
})

// ── getProfessionalKPIs ─────────────────────────────────────────────────────

describe('financialService.getProfessionalKPIs', () => {
  function setupMocks({
    income = 0,
    expense = 0,
    prevIncome = 0,
    prevExpense = 0,
    orders = [] as any[],
    invoices = [] as any[],
  } = {}) {
    mockFinRepo.getStats
      .mockReturnValueOnce({ income, expense })  // current month
      .mockReturnValueOnce({ income: prevIncome, expense: prevExpense }) // previous month
    mockOrderRepo.getAll.mockReturnValue(orders)
    mockInvoiceRepo.getAll.mockReturnValue(invoices)
  }

  it('should return monthly revenue and expenses', () => {
    setupMocks({ income: 100000, expense: 40000 })
    const kpis = financialService.getProfessionalKPIs('company-1')
    expect(kpis.monthlyRevenue).toBe(100000)
    expect(kpis.monthlyExpenses).toBe(40000)
  })

  it('should calculate net profit as income minus expenses', () => {
    setupMocks({ income: 80000, expense: 30000 })
    const kpis = financialService.getProfessionalKPIs('company-1')
    expect(kpis.netProfit).toBe(50000)
  })

  it('should return negative net profit when expenses exceed income', () => {
    setupMocks({ income: 20000, expense: 35000 })
    const kpis = financialService.getProfessionalKPIs('company-1')
    expect(kpis.netProfit).toBe(-15000)
  })

  it('should count orders placed this month', () => {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 10).toISOString()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString()
    setupMocks({
      orders: [
        { created_at: thisMonth, status: 'completed' },
        { created_at: thisMonth, status: 'pending' },
        { created_at: lastMonth, status: 'completed' }, // not this month
      ],
    })
    const kpis = financialService.getProfessionalKPIs('company-1')
    expect(kpis.ordersCount).toBe(2)
  })

  it('should sum pending invoices as pendingCollection', () => {
    setupMocks({
      invoices: [
        { status: 'issued', total_amount: 5000 },
        { status: 'issued', total_amount: 3000 },
        { status: 'paid', total_amount: 2000 }, // not pending
        { status: 'draft', total_amount: 1000 }, // not pending
      ],
    })
    const kpis = financialService.getProfessionalKPIs('company-1')
    expect(kpis.pendingCollection).toBe(8000)
  })

  it('should calculate positive performance when revenue grew vs previous month', () => {
    setupMocks({ income: 120000, prevIncome: 100000 })
    const kpis = financialService.getProfessionalKPIs('company-1')
    expect(kpis.topPerformance).toBeCloseTo(0.2)
  })

  it('should return 1 as topPerformance when previous income was zero and current is positive', () => {
    setupMocks({ income: 50000, prevIncome: 0 })
    const kpis = financialService.getProfessionalKPIs('company-1')
    expect(kpis.topPerformance).toBe(1)
  })

  it('should return 0 as topPerformance when both months have zero income', () => {
    setupMocks({ income: 0, prevIncome: 0 })
    const kpis = financialService.getProfessionalKPIs('company-1')
    expect(kpis.topPerformance).toBe(0)
  })

  it('should calculate negative performance when revenue dropped', () => {
    setupMocks({ income: 80000, prevIncome: 100000 })
    const kpis = financialService.getProfessionalKPIs('company-1')
    expect(kpis.topPerformance).toBeCloseTo(-0.2)
  })

  it('should return zero ordersCount when no orders exist', () => {
    setupMocks({ orders: [] })
    const kpis = financialService.getProfessionalKPIs('company-1')
    expect(kpis.ordersCount).toBe(0)
  })

  it('should return zero pendingCollection when no issued invoices', () => {
    setupMocks({ invoices: [{ status: 'paid', total_amount: 1000 }] })
    const kpis = financialService.getProfessionalKPIs('company-1')
    expect(kpis.pendingCollection).toBe(0)
  })
})
