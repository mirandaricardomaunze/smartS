import { useCallback } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { useColorScheme } from 'nativewind'

export function useSettings() {
  const { settings, setSettings } = useSettingsStore()
  const { setColorScheme } = useColorScheme()

  const toggleDarkMode = useCallback(() => {
    const isDark = settings.dark_mode === 1
    const newValue = isDark ? 0 : 1
    setSettings({ dark_mode: newValue })
    setColorScheme(newValue === 1 ? 'dark' : 'light')
  }, [settings.dark_mode, setSettings, setColorScheme])

  const updateSettings = useCallback((newSettings: Partial<typeof settings>) => {
    setSettings(newSettings)
    if (newSettings.dark_mode !== undefined) {
      setColorScheme(newSettings.dark_mode === 1 ? 'dark' : 'light')
    }
  }, [setSettings, setColorScheme])

  return { settings, toggleDarkMode, updateSettings }
}
