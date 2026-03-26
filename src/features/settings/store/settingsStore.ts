import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Settings } from '@/types'

interface SettingsState {
  settings: Settings
  setSettings: (settings: Partial<Settings>) => void
}

const defaultSettings: Settings = {
  dark_mode: 0,
  currency: 'EUR',
  language: 'pt',
  unit_of_measure: 'un',
  include_tax: 1,
  biometrics_enabled: 0,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      setSettings: (newSettings) => set((state) => ({ 
        settings: { ...state.settings, ...newSettings } 
      })),
    }),
    {
      name: 'smarts-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
