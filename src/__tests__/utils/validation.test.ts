import { validate, ValidationError } from '../../utils/validation'

describe('validate.required', () => {
  it('should throw for null', () => {
    expect(() => validate.required(null, 'Campo')).toThrow(ValidationError)
    expect(() => validate.required(null, 'Campo')).toThrow('Campo é obrigatório')
  })

  it('should throw for undefined', () => {
    expect(() => validate.required(undefined, 'Campo')).toThrow(ValidationError)
  })

  it('should throw for empty string', () => {
    expect(() => validate.required('', 'Campo')).toThrow(ValidationError)
  })

  it('should pass for valid string', () => {
    expect(() => validate.required('value', 'Campo')).not.toThrow()
  })

  it('should pass for zero (valid number)', () => {
    expect(() => validate.required(0, 'Campo')).not.toThrow()
  })
})

describe('validate.nonEmptyString', () => {
  it('should throw for empty string', () => {
    expect(() => validate.nonEmptyString('', 'Nome')).toThrow('não pode estar vazio')
  })

  it('should throw for whitespace-only string', () => {
    expect(() => validate.nonEmptyString('   ', 'Nome')).toThrow('não pode estar vazio')
  })

  it('should throw for non-string', () => {
    expect(() => validate.nonEmptyString(123, 'Nome')).toThrow('não pode estar vazio')
  })

  it('should pass for valid string', () => {
    expect(() => validate.nonEmptyString('Arroz', 'Nome')).not.toThrow()
  })
})

describe('validate.nonEmptyArray', () => {
  it('should throw for empty array', () => {
    expect(() => validate.nonEmptyArray([], 'Itens')).toThrow('não pode estar vazio')
  })

  it('should pass for non-empty array', () => {
    expect(() => validate.nonEmptyArray([1], 'Itens')).not.toThrow()
  })
})

describe('validate.positiveNumber', () => {
  it('should throw for negative number', () => {
    expect(() => validate.positiveNumber(-1, 'Preço')).toThrow('número positivo')
  })

  it('should throw for non-number', () => {
    expect(() => validate.positiveNumber('abc', 'Preço')).toThrow('número positivo')
  })

  it('should pass for zero', () => {
    expect(() => validate.positiveNumber(0, 'Preço')).not.toThrow()
  })

  it('should pass for positive number', () => {
    expect(() => validate.positiveNumber(100, 'Preço')).not.toThrow()
  })
})

describe('validate.percentage', () => {
  it('should throw for value > 100', () => {
    expect(() => validate.percentage(101, 'Taxa')).toThrow('entre 0 e 100')
  })

  it('should throw for negative value', () => {
    expect(() => validate.percentage(-5, 'Taxa')).toThrow('entre 0 e 100')
  })

  it('should pass for valid percentage', () => {
    expect(() => validate.percentage(23, 'IVA')).not.toThrow()
  })

  it('should pass for boundary 0', () => {
    expect(() => validate.percentage(0, 'IVA')).not.toThrow()
  })

  it('should pass for boundary 100', () => {
    expect(() => validate.percentage(100, 'IVA')).not.toThrow()
  })
})

describe('validate.product', () => {
  it('should throw for empty product name', () => {
    expect(() => validate.product({ name: '' })).toThrow('Nome do produto')
  })

  it('should throw for negative sale_price', () => {
    expect(() => validate.product({ name: 'Arroz', sale_price: -10 })).toThrow('Preço de venda')
  })

  it('should throw for invalid tax_rate', () => {
    expect(() => validate.product({ name: 'Arroz', tax_rate: 150 })).toThrow('Taxa de IVA')
  })

  it('should pass for valid product data', () => {
    expect(() => validate.product({
      name: 'Arroz Agulha 1kg',
      sale_price: 150,
      purchase_price: 100,
      current_stock: 50,
      minimum_stock: 10,
      tax_rate: 16,
    })).not.toThrow()
  })
})

describe('validate.order', () => {
  it('should throw for empty items', () => {
    expect(() => validate.order({ total_amount: 100, items: [] })).toThrow('Itens do pedido')
  })

  it('should throw for negative total', () => {
    expect(() => validate.order({ total_amount: -1, items: [{}] })).toThrow('Total do pedido')
  })
})

describe('validate.movement', () => {
  it('should throw for missing product_id', () => {
    expect(() => validate.movement({ quantity: 10 })).toThrow('Produto')
  })

  it('should throw for zero quantity', () => {
    expect(() => validate.movement({ product_id: 'abc', quantity: 0 })).toThrow('maior que zero')
  })

  it('should throw for negative quantity', () => {
    expect(() => validate.movement({ product_id: 'abc', quantity: -5 })).toThrow('número positivo')
  })
})
