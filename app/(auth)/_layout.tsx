import { Stack, router, useRootNavigationState } from 'expo-router'
import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { logger } from '@/utils/logger'

function AuthNavigationGuard() {
  const { user, isLoading: isAuthLoading } = useAuthStore()
  const { settings } = useSettingsStore()
  const lastRedirectPath = useRef<string | null>(null)

  const rootNavigationState = useRootNavigationState()
  const isNavigationMounted = !!rootNavigationState?.key

  useEffect(() => {
    if (!isNavigationMounted || isAuthLoading) return

    const safeReplace = (target: string) => {
      if (lastRedirectPath.current === target) return
      lastRedirectPath.current = target
      router.replace(target as any)
    }

    // ONLY redirect to onboarding if user exists but hasn't completed it
    if (user && settings.onboarding_completed === 0) {
      logger.info(`[nav] Redirecting user ${user.id} to onboarding`)
      safeReplace('/(auth)/onboarding')
      return
    }

    // Redirect to dashboard if user exists and onboarding is complete
    if (user && settings.onboarding_completed === 1) {
      logger.info(`[nav] Redirecting user ${user.id} to dashboard (Authenticated)`)
      // Use router.replace with absolute path to clear stack
      setTimeout(() => {
        router.replace('/(app)/dashboard')
      }, 100)
      return
    }
  }, [user?.id, isAuthLoading, settings.onboarding_completed, isNavigationMounted])

  return null
}

export default function AuthLayout() {
  const { isLoading } = useAuthStore()

  if (isLoading) return null

  return (
    <>
      <AuthNavigationGuard />
      <Stack screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' }
      }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
    </>
  )
}
