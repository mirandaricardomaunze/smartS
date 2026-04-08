import { useSubscriptionStore } from '@/store/subscriptionStore'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useEffect, useCallback } from 'react'

export function useSubscription() {
  const { user } = useAuthStore()
  const { subscription: sub, isLoading, status, daysLeft, fetchSubscription, refreshSubscription } = useSubscriptionStore()

  // Stable reference so it can safely be listed as a useEffect dependency
  const fetch = useCallback(() => {
    if (user?.id && user?.company_id) {
      fetchSubscription(user.id, user.company_id)
    }
  }, [user?.id, user?.company_id, fetchSubscription])

  useEffect(() => {
    if (!user || !user.company_id) {
      useSubscriptionStore.getState().setLoading(false)
      return
    }
    if (!sub) fetch()
  }, [user?.id, user?.company_id, sub, fetch])

  const isTrialExpired = status === 'EXPIRED'
  const plan = sub?.plan || 'TRIAL'
  const onboardingCompleted = sub?.onboarding_completed === 1

  return {
    sub,
    plan,
    status,
    isTrialExpired,
    daysRemaining: daysLeft,
    isLoading,
    onboardingCompleted,
    refresh: () => user?.company_id && refreshSubscription(user.id, user.company_id),
  }
}
