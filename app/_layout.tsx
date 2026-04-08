import 'react-native-get-random-values'
import '@/styles/global.css'
import { initSentry } from '@/services/sentryService'
initSentry()
import { useEffect, useRef, useState } from 'react'
import { Stack, router } from 'expo-router'
import { useAuthStore } from '@/features/auth/store/authStore'
import { authService } from '@/features/auth/services/authService'
import { runMigrations } from '@/database/sqlite'
import { initializeNetworkListener } from '@/utils/networkListener'
import Loading from '@/components/ui/Loading'
import { View, Linking, StyleSheet, AppState } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { useColorScheme } from 'nativewind'
import { StatusBar } from 'expo-status-bar'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import * as SplashScreen from 'expo-splash-screen'
import { notificationService } from '@/features/notifications/services/notificationService'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from '@expo-google-fonts/inter'
import ToastContainer from '@/components/ui/ToastContainer'
import { useAutoBackup } from '@/hooks/useAutoBackup'
import { setSentryUser } from '@/services/sentryService'
import { revenueCatService } from '@/services/revenueCatService'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const { isLoading, isInitialized, user } = useAuthStore()
  const { settings } = useSettingsStore()
  useAutoBackup()
  const { colorScheme, setColorScheme } = useColorScheme()
  const isMounted = useRef(false)
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-Black': Inter_900Black,
  })

  // ✅ Stability: Once initialized, the navigator stays mounted forever.
  // This prevents "Couldn't find a navigation context" during state flickers.
  const isNavigationReady = isInitialized && fontsLoaded


  // ✅ Mark component as mounted
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync()
  }, [fontsLoaded, fontError])

  useEffect(() => {
    setColorScheme(settings.dark_mode === 1 ? 'dark' : 'light')
  }, [settings.dark_mode])

  useEffect(() => {
    const handleInitialURL = async () => {
      const url = await Linking.getInitialURL()
      if (url) authService.handleDeepLink(url)
    }
    handleInitialURL()
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url) authService.handleDeepLink(url)
    })
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    setSentryUser(user ? { id: user.id, email: user.email, name: user.name } : null)
    if (user?.id) {
      revenueCatService.configure(user.id)
    }
  }, [user?.id])

  useEffect(() => {
    async function setupApp() {
      try {
        await runMigrations()
        initializeNetworkListener()
        await authService.initializeSession()
        await notificationService.requestPermissions()
      } catch (e) {
        console.error('App setup failed', e)
      } finally {
        useAuthStore.getState().setLoading(false)
      }
    }
    setupApp()
  }, [])

  const isDark = colorScheme === 'dark'
  const backgroundColor = isDark ? '#0f172a' : '#f8fafc'

  const theme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: '#0f172a',
          card: '#0f172a',
          border: '#1e293b',
        },
      }
    : {
        ...DefaultTheme,
        colors: { ...DefaultTheme.colors, background: '#f8fafc' },
      }

  // Return null entirely if fonts are not loaded, so the native splash screen stays visible
  if (!fontsLoaded) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ThemeProvider value={theme}>
          <SafeAreaProvider>
            <StatusBar
              style={isDark ? 'light' : 'dark'}
              translucent
              backgroundColor="transparent"
            />
            {/* 
                ✅ Structural Refactor: 
                The Stack stays mounted once isNavigationReady is true.
                The Loading view is shown as an overlay or until initialized.
            */}
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor },
              }}
            >
              <Stack.Screen
                name="(auth)"
                options={{
                  headerShown: false,
                  contentStyle: { backgroundColor: 'transparent' },
                }}
              />
              <Stack.Screen name="(app)" options={{ headerShown: false }} />
            </Stack>

            {!isNavigationReady && (
              <View 
                style={[
                  StyleSheet.absoluteFill, 
                  { backgroundColor, zIndex: 999 }
                ]}
              >
                <Loading fullScreen message="A inicar SmartS..." />
              </View>
            )}

            <ToastContainer />

          </SafeAreaProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  )
}