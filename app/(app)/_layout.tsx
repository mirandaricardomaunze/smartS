import { Tabs, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { AppState } from 'react-native'
import { useAuthStore } from '@/features/auth/store/authStore'
import {
  LayoutDashboard,
  ScanLine,
  Settings,
  ShoppingCart,
  Wallet,
  LayoutGrid,
  Package
} from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { View } from 'react-native'
import { useSyncStore } from '@/features/sync/store/syncStore'
import { useSettings } from '@/features/settings/hooks/useSettings'
import { useBiometrics } from '@/hooks/useBiometrics'
import BiometricLock from '@/components/ui/BiometricLock'
import { realtimeService } from '@/features/sync/services/realtimeService'
import { pullFromSupabase } from '@/utils/syncData'
import { notificationService } from '@/features/notifications/services/notificationService'

export default function AppLayout() {
  const { user, isLoading } = useAuthStore()
  const { settings } = useSettings()
  const { isSupported, isEnrolled, authenticateAsync } = useBiometrics()
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const insets = useSafeAreaInsets()
  
  const [isLocked, setIsLocked] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const isDark = colorScheme === 'dark'

  const activeColor = useMemo(() => (isDark ? '#6366f1' : '#4f46e5'), [isDark])
  const inactiveColor = useMemo(() => (isDark ? '#94a3b8' : '#64748b'), [isDark])
  const tabBarBg = useMemo(() => (isDark ? '#0f172a' : '#ffffff'), [isDark])
  const tabBarBorder = useMemo(() => (isDark ? '#1e293b' : '#e2e8f0'), [isDark])

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/(auth)/login')
    }
  }, [user, isLoading])

  // Biometrics Lock Logic
  useEffect(() => {
    if (settings.biometrics_enabled === 1 && isSupported && isEnrolled) {
      setIsLocked(true)
    } else {
      setIsLocked(false)
    }
  }, [settings.biometrics_enabled, isSupported, isEnrolled])

  const handleUnlock = async () => {
    if (isAuthenticating) return
    setIsAuthenticating(true)
    const success = await authenticateAsync('Confirmar identidade para aceder ao SmartS')
    if (success) {
      setIsLocked(false)
    }
    setIsAuthenticating(false)
  }

  // Handle AppState (Lock on background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        nextAppState === 'active' && 
        settings.biometrics_enabled === 1 && 
        isSupported && 
        isEnrolled
      ) {
        setIsLocked(true)
      }
    });

    return () => {
      subscription.remove();
    };
  }, [settings.biometrics_enabled, isSupported, isEnrolled]);

  // Realtime & Initial Sync
  useEffect(() => {
    if (user?.company_id) {
      // 1. Initial Pull (Background)
      pullFromSupabase().catch(console.error)

      // 2. Subscribe to live changes
      const unsubscribe = realtimeService.subscribe(user.company_id, () => {
        useSyncStore.getState().triggerRefresh()
      })

      return () => unsubscribe()
    }
  }, [user?.company_id])

  if (isLoading) return null

  if (isLocked) {
    return <BiometricLock onRetry={handleUnlock} />
  }

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarShowLabel: true,
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: tabBarBg }} />
        ),
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
      }}>

      {/* Visible tabs */}
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: 'Painel',
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="products/index"
        options={{
          title: 'Produtos',
          tabBarIcon: ({ color }) => <Package size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders/index"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color }) => <ShoppingCart size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pos/index"
        options={{
          title: 'PDV',
          tabBarIcon: ({ color }) => <ScanLine size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Definições',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />

      <Tabs.Screen name="control/index" options={{ href: null }} />
      <Tabs.Screen name="categories/index" options={{ href: null }} />
      <Tabs.Screen name="inventory/audit" options={{ href: null }} />
      <Tabs.Screen name="scanner/index" options={{ href: null }} />
      <Tabs.Screen name="movements/index" options={{ href: null }} />
      <Tabs.Screen name="movements/create" options={{ href: null }} />
      <Tabs.Screen name="customers/index" options={{ href: null }} />
      <Tabs.Screen name="suppliers/index" options={{ href: null }} />
      <Tabs.Screen name="orders/create" options={{ href: null }} />
      <Tabs.Screen name="products/create" options={{ href: null }} />
      <Tabs.Screen name="products/[id]" options={{ href: null }} />
      <Tabs.Screen name="products/edit/[id]" options={{ href: null }} />
      <Tabs.Screen name="expiry/index" options={{ href: null }} />
      <Tabs.Screen name="notes/index" options={{ href: null }} />
      <Tabs.Screen name="notes/create" options={{ href: null }} />
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
    </Tabs>
  )
}