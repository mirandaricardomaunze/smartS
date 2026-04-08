import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import * as SecureStore from 'expo-secure-store'
import { User } from '@/types'

// SecureStore adapter compatible with Zustand persist
const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isInitialized: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isInitialized: false,
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set((state) => ({ 
        isLoading, 
        isInitialized: state.isInitialized || !isLoading 
      })),
      logout: () => set({ user: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => SecureStoreAdapter),
    }
  )
)
