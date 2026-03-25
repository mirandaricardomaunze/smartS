import { create } from 'zustand'
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
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  setSettings: (newSettings) => set((state) => ({ 
    settings: { ...state.settings, ...newSettings } 
  })),
}))
