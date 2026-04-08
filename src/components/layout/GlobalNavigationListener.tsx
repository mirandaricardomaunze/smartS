import { useEffect } from 'react'
import { router, useRootNavigationState } from 'expo-router'
import { authService } from '@/features/auth/services/authService'

/**
 * ✅ Global listener for navigation events that need a valid context.
 * This component must be rendered within a Navigator (Stack or Tabs).
 */
export default function GlobalNavigationListener() {
  const rootNavigationState = useRootNavigationState()
  const isNavigationMounted = !!rootNavigationState?.key

  useEffect(() => {
    if (!isNavigationMounted) return

    const unsubscribe = authService.subscribeToAuthChanges(() => {
      // Small delay to ensure the transition is smooth and context is ready
      setTimeout(() => {
        router.push('/(auth)/reset-password')
      }, 300)
    })

    return () => unsubscribe()
  }, [isNavigationMounted])

  return null
}
