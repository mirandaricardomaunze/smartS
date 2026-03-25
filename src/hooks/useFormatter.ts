import { useCallback } from 'react'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { formatCurrency as baseFormatCurrency, getCurrencySymbol as baseGetCurrencySymbol } from '@/utils/formatters'

export function useFormatter() {
  const { currency } = useSettingsStore((state) => state.settings)

  const formatCurrency = useCallback((value: number) => {
    return baseFormatCurrency(value, currency)
  }, [currency])

  const getCurrencySymbol = useCallback(() => {
    return baseGetCurrencySymbol(currency)
  }, [currency])

  return { 
    formatCurrency, 
    getCurrencySymbol,
    currency 
  }
}
