import { useCallback } from 'react'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { useCountryConfig } from '@/hooks/useCountryConfig'
import {
  formatCurrency as baseFormatCurrency,
  getCurrencySymbol as baseGetCurrencySymbol,
  formatDate as baseFormatDate,
  formatShortDate as baseFormatShortDate,
} from '@/utils/formatters'

export function useFormatter() {
  const { currency } = useSettingsStore((state) => state.settings)
  const countryConfig = useCountryConfig()
  const locale = countryConfig.locale

  const formatCurrency = useCallback(
    (value: number) => baseFormatCurrency(value, currency, locale),
    [currency, locale]
  )

  const getCurrencySymbol = useCallback(
    () => baseGetCurrencySymbol(currency),
    [currency]
  )

  const formatDate = useCallback(
    (date: string | null | undefined) => baseFormatDate(date, locale),
    [locale]
  )

  const formatShortDate = useCallback(
    (date: string | null | undefined) => baseFormatShortDate(date, locale),
    [locale]
  )

  return {
    formatCurrency,
    getCurrencySymbol,
    formatDate,
    formatShortDate,
    currency,
    locale,
  }
}
