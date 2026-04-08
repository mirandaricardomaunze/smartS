export const formatCurrency = (value: number, currency: string = 'USD', locale: string = 'en-US'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value)
}

export const getCurrencySymbol = (currency: string = 'USD'): string => {
  switch (currency) {
    case 'MZN': return 'MT'
    case 'AOA': return 'Kz'
    case 'EUR': return '€'
    case 'USD': return '$'
    case 'BRL': return 'R$'
    case 'ZAR': return 'R'
    default: return currency
  }
}

export const formatDate = (dateString: string | null | undefined, locale: string = 'en-US'): string => {
  if (!dateString) return '---'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '---'
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export const formatShortDate = (dateString: string | null | undefined, locale: string = 'en-US'): string => {
  if (!dateString) return '---'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '---'
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}
