import { create } from 'zustand'
import { Subscription, SubscriptionStatus } from '@/types'
import { subscriptionService } from '@/services/subscriptionService'
import { logger } from '@/utils/logger'
interface SubscriptionState {
  subscription: Subscription | null
  status: 'ACTIVE' | 'EXPIRED'
  daysLeft: number
  isLoading: boolean
  error: string | null
  fetchSubscription: (userId: string, companyId: string) => Promise<void>
  refreshSubscription: (userId: string, companyId: string) => Promise<void>
  setSubscription: (sub: Subscription | null) => void
  setLoading: (loading: boolean) => void
}
export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  subscription: null, status: 'ACTIVE', daysLeft: 30, isLoading: true, error: null,
  fetchSubscription: async (userId: string, companyId: string) => {
    set({ isLoading: true, error: null })
    try {
      const [sub, statusData] = await Promise.all([
        subscriptionService.getSubscription(companyId),
        subscriptionService.checkSubscriptionStatus(userId, companyId)
      ])
      set({
        subscription: sub,
        status: statusData.status,
        daysLeft: statusData.days_left,
        isLoading: false
      })
    } catch (e: any) {
      set({ error: e.message, isLoading: false })
    }
  },
  refreshSubscription: async (userId: string, companyId: string) => {
    try {
      const [sub, statusData] = await Promise.all([
        subscriptionService.getSubscription(companyId),
        subscriptionService.checkSubscriptionStatus(userId, companyId)
      ])
      set({ 
        subscription: sub, 
        status: statusData.status, 
        daysLeft: statusData.days_left 
      })
    } catch (e) {
      logger.error('[subscription] Falha ao actualizar subscrição:', e)
    }
  },
  setSubscription: (subscription) => set({ subscription }),
  setLoading: (isLoading) => set({ isLoading }),
}))