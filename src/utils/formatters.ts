export const formatCurrency = (value: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: currency,
  }).format(value)
}

export const getCurrencySymbol = (currency: string = 'EUR'): string => {
  switch (currency) {
    case 'MZN': return 'MT'
    case 'AOA': return 'Kz'
    case 'EUR': return '€'
    case 'USD': return '$'
    case 'BRL': return 'R$'
    default: return currency
  }
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}
