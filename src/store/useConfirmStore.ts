import { create } from 'zustand'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  isDestructive?: boolean
  showCancel?: boolean
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

interface ConfirmState {
  visible: boolean
  options: ConfirmOptions | null
  show: (options: ConfirmOptions) => void
  hide: () => void
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  visible: false,
  options: null,
  show: (options) => set({ visible: true, options }),
  hide: () => set({ visible: false }),
}))
