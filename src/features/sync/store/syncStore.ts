import { create } from 'zustand'
import { SyncQueueItem } from '@/repositories/syncRepository'

interface SyncState {
  pendingItems: SyncQueueItem[]
  errorItems: SyncQueueItem[]
  lastUpdate: number
  setPendingItems: (items: SyncQueueItem[]) => void
  setErrorItems: (items: SyncQueueItem[]) => void
  triggerRefresh: () => void
}

export const useSyncStore = create<SyncState>((set) => ({
  pendingItems: [],
  errorItems: [],
  lastUpdate: 0,
  setPendingItems: (items) => set({ pendingItems: items }),
  setErrorItems: (items) => set({ errorItems: items }),
  triggerRefresh: () => set((state) => ({ lastUpdate: state.lastUpdate + 1 })),
}))
