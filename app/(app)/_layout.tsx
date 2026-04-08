import { Tabs, router, useRootNavigationState } from 'expo-router'
import { useEffect, useMemo, useState, useRef } from 'react'
import { AppState, StyleSheet, View } from 'react-native'
import { useAuthStore } from '@/features/auth/store/authStore'
import { logger } from '@/utils/logger'
import {
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Wallet,
  Package
} from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSyncStore } from '@/features/sync/store/syncStore'
import { useSettings } from '@/features/settings/hooks/useSettings'
import { useSubscription } from '@/hooks/useSubscription'
import { realtimeService } from '@/features/sync/services/realtimeService'
import { pullFromSupabase, syncData } from '@/utils/syncData'
import { notificationService } from '@/features/notifications/services/notificationService'
import { useAutoAlerts } from '@/features/notifications/hooks/useAutoAlerts'
import { useBiometrics } from '@/hooks/useBiometrics'
import BiometricLock from '@/components/ui/BiometricLock'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import OfflineBanner from '@/components/ui/OfflineBanner'
import { authService } from '@/features/auth/services/authService'

// ─── Navigation Guard ────────────────────────────────────────────────────────
// Isolated component so that useRootNavigationState() is ONLY called after
// AppLayout has confirmed auth is done — the same pattern as AuthNavigationGuard
// in (auth)/_layout.tsx. This prevents "Couldn't find a navigation context"
// when AppLayout first mounts before expo-router's navigation context is ready.
interface GuardProps {
  user: { id: string; company_id?: string | null } | null
  settings: ReturnType<typeof useSettings>['settings']
  isSubLoading: boolean
  isTrialExpired: boolean | null
  plan: string | null
}

function AppNavigationGuard({ user, settings, isSubLoading, isTrialExpired, plan }: GuardProps) {
  const rootNavigationState = useRootNavigationState()
  const isNavigationMounted = !!rootNavigationState?.key
  const lastRedirectPath = useRef<string | null>(null)

  // ─── Route protection ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isNavigationMounted || isSubLoading) return

    const safeReplace = (target: string) => {
      if (lastRedirectPath.current === target) return
      lastRedirectPath.current = target
      router.replace(target as any)
    }

    if (!user) {
      logger.info('[nav] No user found in (app), redirecting to login')
      safeReplace('/(auth)/login')
      return
    }

    if (settings.onboarding_completed === 0) {
      logger.info(`[nav] User ${user.id} has not completed onboarding, redirecting`)
      safeReplace('/(auth)/onboarding')
      return
    }

    if (user.company_id && isTrialExpired === true && plan === 'TRIAL') {
      safeReplace('/(app)/choose-plan')
      return
    }
  }, [
    user?.id,
    user?.company_id,
    isSubLoading,
    settings.onboarding_completed,
    isTrialExpired,
    plan,
    isNavigationMounted,
  ])

  // ─── Global auth event listener ─────────────────────────────────────────
  useEffect(() => {
    if (!isNavigationMounted) return
    const unsubscribe = authService.subscribeToAuthChanges(() => {
      setTimeout(() => router.push('/(auth)/reset-password'), 300)
    })
    return () => unsubscribe()
  }, [isNavigationMounted])

  return null
}

// ─── Tab bar helper ──────────────────────────────────────────────────────────
const TabBarBackground = ({ color }: { color: string }) => (
  <View style={{ flex: 1, backgroundColor: color }} />
)

// ─── Main Layout ─────────────────────────────────────────────────────────────
export default function AppLayout() {
  const { user, isLoading: isAuthLoading } = useAuthStore()
  const { sub, isTrialExpired, plan, isLoading: isSubLoading } = useSubscription()
  const { settings } = useSettings()
  const { colorScheme } = useColorScheme()
  const insets = useSafeAreaInsets()

  const { isSupported, isEnrolled, authenticateAsync } = useBiometrics()
  const [isLocked, setIsLocked] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  useAutoAlerts()

  // ─── Sync ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.company_id) return
    pullFromSupabase().catch(console.error)
    syncData().catch(console.error)
    const unsubscribe = realtimeService.subscribe(user.company_id, () => {
      useSyncStore.getState().triggerRefresh()
    })
    return () => unsubscribe()
  }, [user?.company_id])

  // ─── Trial notifications (separate — must not restart sync on sub change) ──
  useEffect(() => {
    if (!user?.company_id || !sub?.trial_started_at) return
    notificationService
      .checkTrialNotifications(sub.trial_started_at, user.company_id)
      .catch(console.error)
  }, [user?.company_id, sub?.trial_started_at])

  // ─── Sync ao voltar ao foreground ─────────────────────────────────────
  useEffect(() => {
    if (!user?.company_id) return
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        syncData().catch(console.error)
      }
    })
    return () => subscription.remove()
  }, [user?.company_id])

  // ─── Biometrics ────────────────────────────────────────────────────────
  useEffect(() => {
    setIsLocked(settings.biometrics_enabled === 1 && isSupported && isEnrolled)
  }, [settings.biometrics_enabled, isSupported, isEnrolled])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && settings.biometrics_enabled === 1 && isSupported && isEnrolled) {
        setIsLocked(true)
      }
    })
    return () => subscription.remove()
  }, [settings.biometrics_enabled, isSupported, isEnrolled])

  const handleUnlock = async () => {
    if (isAuthenticating) return
    setIsAuthenticating(true)
    try {
      const success = await authenticateAsync('Confirmar identidade para aceder ao SmartS')
      if (success) setIsLocked(false)
    } catch (e) {
      logger.error('[biometrics] Falha na autenticação:', e)
    } finally {
      setIsAuthenticating(false)
    }
  }

  const isDark = colorScheme === 'dark'
  const activeColor = useMemo(() => (isDark ? '#6366f1' : '#4f46e5'), [isDark])
  const inactiveColor = useMemo(() => (isDark ? '#94a3b8' : '#64748b'), [isDark])
  const tabBarBg = useMemo(() => (isDark ? '#0f172a' : '#f8fafc'), [isDark])
  const tabBarBorder = useMemo(() => (isDark ? '#1e293b' : '#e2e8f0'), [isDark])
  const backgroundColor = isDark ? '#0f172a' : '#f8fafc'

  // ─── Guard: do not render Tabs while auth is loading ───────────────────
  // This also ensures AppNavigationGuard (which calls useRootNavigationState
  // → useNavigation internally) is never mounted before navigation is ready.
  if (isAuthLoading) return null

  return (
    <>
      {/* Navigation guard rendered AFTER auth check — safe to call useRootNavigationState here */}
      <AppNavigationGuard
        user={user}
        settings={settings}
        isSubLoading={isSubLoading}
        isTrialExpired={isTrialExpired}
        plan={plan}
      />

      <Tabs
        backBehavior="history"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,
          tabBarShowLabel: true,
          tabBarBackground: () => <TabBarBackground color={tabBarBg} />,
          tabBarStyle: {
            borderTopColor: tabBarBorder,
            backgroundColor: 'transparent',
            height: 65 + insets.bottom,
            paddingTop: 12,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginBottom: insets.bottom > 0 ? 0 : 4,
          },
        }}
      >
        <Tabs.Screen
          name="dashboard/index"
          options={{ title: 'Painel', tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} /> }}
        />
        <Tabs.Screen
          name="products/index"
          options={{ title: 'Produtos', tabBarIcon: ({ color }) => <Package size={24} color={color} /> }}
        />
        <Tabs.Screen
          name="orders/index"
          options={{ title: 'Pedidos', tabBarIcon: ({ color }) => <ShoppingCart size={24} color={color} /> }}
        />
        <Tabs.Screen
          name="pos/index"
          options={{ title: 'PDV', tabBarIcon: ({ color }) => <Wallet size={24} color={color} /> }}
        />
        <Tabs.Screen
          name="settings/index"
          options={{ title: 'Definições', tabBarIcon: ({ color }) => <Settings size={24} color={color} /> }}
        />

        <Tabs.Screen name="notes/index" options={{ href: null }} />
        <Tabs.Screen name="customers/index" options={{ href: null }} />
        <Tabs.Screen name="suppliers/index" options={{ href: null }} />
        <Tabs.Screen name="movements/index" options={{ href: null }} />
        <Tabs.Screen name="modules/index" options={{ href: null }} />
        <Tabs.Screen name="choose-plan" options={{ href: null }} />
        <Tabs.Screen name="control/index" options={{ href: null }} />
        <Tabs.Screen name="categories/index" options={{ href: null }} />
        <Tabs.Screen name="inventory/audit" options={{ href: null }} />
        <Tabs.Screen name="scanner/index" options={{ href: null }} />
        <Tabs.Screen name="movements/create" options={{ href: null }} />
        <Tabs.Screen name="orders/create" options={{ href: null }} />
        <Tabs.Screen name="orders/[id]" options={{ href: null }} />
        <Tabs.Screen name="notes/create" options={{ href: null }} />
        <Tabs.Screen name="notes/[id]" options={{ href: null }} />
        <Tabs.Screen name="products/create" options={{ href: null }} />
        <Tabs.Screen name="products/[id]" options={{ href: null }} />
        <Tabs.Screen name="products/edit/[id]" options={{ href: null }} />
        <Tabs.Screen name="expiry/index" options={{ href: null }} />
        <Tabs.Screen name="reports/index" options={{ href: null }} />
        <Tabs.Screen name="history/index" options={{ href: null }} />
        <Tabs.Screen name="notifications/index" options={{ href: null }} />
        <Tabs.Screen name="finance/index" options={{ href: null }} />
        <Tabs.Screen name="sync/index" options={{ href: null }} />
        <Tabs.Screen name="backup/index" options={{ href: null }} />
        <Tabs.Screen name="users/index" options={{ href: null }} />
        <Tabs.Screen name="users/create" options={{ href: null }} />
        <Tabs.Screen name="profile/index" options={{ href: null }} />
        <Tabs.Screen name="hr/index" options={{ href: null }} />
        <Tabs.Screen name="hr/analytics" options={{ href: null }} />
        <Tabs.Screen name="hr/attendance/index" options={{ href: null }} />
        <Tabs.Screen name="hr/employees/index" options={{ href: null }} />
        <Tabs.Screen name="hr/employees/[id]" options={{ href: null }} />
        <Tabs.Screen name="hr/leaves/index" options={{ href: null }} />
        <Tabs.Screen name="hr/organization/index" options={{ href: null }} />
        <Tabs.Screen name="hr/payroll/index" options={{ href: null }} />
        <Tabs.Screen name="hr/payroll/inss" options={{ href: null }} />
        <Tabs.Screen name="settings/privacy" options={{ href: null }} />
        <Tabs.Screen name="settings/terms" options={{ href: null }} />
        <Tabs.Screen name="settings/subscription" options={{ href: null }} />
        <Tabs.Screen name="admin/subscriptions" options={{ href: null }} />
        <Tabs.Screen name="payment/success" options={{ href: null }} />
        <Tabs.Screen name="payment/cancel" options={{ href: null }} />
        <Tabs.Screen name="no-access" options={{ href: null }} />
      </Tabs>

      <ConfirmDialog />
      <OfflineBanner />

      {isLocked && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor, zIndex: 9999 }]}>
          <BiometricLock onRetry={handleUnlock} />
        </View>
      )}
    </>
  )
}
