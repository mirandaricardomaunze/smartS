import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { getCountryConfig, CountryConfig } from '@/config/countries'

export function useCountryConfig(): CountryConfig {
  const country_code = useSettingsStore((state) => state.settings.country_code)
  return getCountryConfig(country_code ?? 'MZ')
}
