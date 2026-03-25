import 'react-native-get-random-values'
import '@/styles/global.css'
import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { useAuthStore } from '@/features/auth/store/authStore'
import { authService } from '@/features/auth/services/authService'
import { runMigrations } from '@/database/sqlite'
import { initializeNetworkListener } from '@/utils/networkListener'
import Loading from '@/components/ui/Loading'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { useColorScheme } from 'nativewind'
import { StatusBar } from 'expo-status-bar'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import * as SplashScreen from 'expo-splash-screen'
import ToastContainer from '@/components/ui/ToastContainer'
import { 
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black
} from '@expo-google-fonts/inter'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync()

function RootLayoutNav() {
  const { colorScheme } = useColorScheme()

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#f8fafc' }
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  )
}

export default function RootLayout() {
  const { isLoading } = useAuthStore()
  const { settings } = useSettingsStore()
  const { colorScheme, setColorScheme } = useColorScheme()
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-Black': Inter_900Black,
  })

  const theme = colorScheme === 'dark' ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#0f172a',
      card: '#0f172a',
      border: '#1e293b',
    },
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#f8fafc',
    },
  }

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  useEffect(() => {
    setColorScheme(settings.dark_mode === 1 ? 'dark' : 'light')
    
    async function setupApp() {
      try {
        await runMigrations()
        initializeNetworkListener()
        await authService.initializeSession()
      } catch (e) {
        console.error('App setup failed', e)
      }
    }
    setupApp()
  }, [])

  if (isLoading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#f8fafc' }}>
        <Loading fullScreen message="Loading ..."  />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={theme}>
        <SafeAreaProvider style={{ flex: 1, backgroundColor: 'transparent' }}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} translucent backgroundColor="transparent" />
          <ToastContainer />
          <RootLayoutNav />
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
