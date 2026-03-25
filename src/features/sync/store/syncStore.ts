import { create } from 'zustand'
import { SyncQueueItem } from '@/repositories/syncRepository'

interface SyncState {
  pendingItems: SyncQueueItem[]
  errorItems: SyncQueueItem[]
  setPendingItems: (items: SyncQueueItem[]) => void
  setErrorItems: (items: SyncQueueItem[]) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  pendingItems: [],
  errorItems: [],
  setPendingItems: (items) => set({ pendingItems: items }),
  setErrorItems: (items) => set({ errorItems: items }),
}))
