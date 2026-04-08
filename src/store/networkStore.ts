import { create } from 'zustand'

interface NetworkState {
  isOnline: boolean
  setOnline: (online: boolean) => void
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: true, // assume online until first NetInfo event
  setOnline: (isOnline) => set({ isOnline }),
}))
