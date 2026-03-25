import { Stack, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth/store/authStore'

export default function AuthLayout() {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/(app)/dashboard')
    }
  }, [user, isLoading])

  if (isLoading) return null

  return (
    <Stack screenOptions={{ 
      headerShown: false,
      contentStyle: { backgroundColor: 'transparent' }
    }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  )
}
