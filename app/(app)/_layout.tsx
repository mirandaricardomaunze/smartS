import { Tabs, useRouter } from 'expo-router'
import { useEffect, useMemo } from 'react'
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
import { useColorScheme } from 'react-native' // switched from nativewind to avoid premount warning
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { View } from 'react-native'

export default function AppLayout() {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()
  const colorScheme = useColorScheme()
  const insets = useSafeAreaInsets()

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

  if (isLoading) return null

  return (
    <Tabs
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
          title: 'Início',
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
        name="finance/index"
        options={{
          title: 'Caixa',
          tabBarIcon: ({ color }) => <Wallet size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="control/index"
        options={{
          title: 'Módulos',
          tabBarIcon: ({ color }) => <LayoutGrid size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Definições',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />

      {/* Hidden nested routes */}
      <Tabs.Screen name="categories/index" options={{ href: null }} />
      <Tabs.Screen name="inventory/audit" options={{ href: null }} />
      <Tabs.Screen name="scanner/index" options={{ href: null }} />
      <Tabs.Screen name="movements/index" options={{ href: null }} />
      <Tabs.Screen name="customers/index" options={{ href: null }} />
      <Tabs.Screen name="suppliers/index" options={{ href: null }} />
      <Tabs.Screen name="orders/create" options={{ href: null }} />
      <Tabs.Screen name="products/[id]" options={{ href: null }} />
      <Tabs.Screen name="products/create" options={{ href: null }} />
      <Tabs.Screen name="products/edit/[id]" options={{ href: null }} />
      <Tabs.Screen name="movements/create" options={{ href: null }} />
      <Tabs.Screen name="expiry/index" options={{ href: null }} />
      <Tabs.Screen name="notes/index" options={{ href: null }} />
      <Tabs.Screen name="notes/create" options={{ href: null }} />
      <Tabs.Screen name="reports/index" options={{ href: null }} />
      <Tabs.Screen name="history/index" options={{ href: null }} />
      <Tabs.Screen name="notifications/index" options={{ href: null }} />
      <Tabs.Screen name="sync/index" options={{ href: null }} />
      <Tabs.Screen name="backup/index" options={{ href: null }} />
      <Tabs.Screen name="users/index" options={{ href: null }} />
      <Tabs.Screen name="users/create" options={{ href: null }} />
      <Tabs.Screen name="profile/index" options={{ href: null }} />
    </Tabs>
  )
}