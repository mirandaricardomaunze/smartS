import { View, Text, TouchableOpacity } from 'react-native'
import BackButton from '../ui/BackButton'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColorScheme } from 'nativewind'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { feedback } from '@/utils/haptics'

interface HeaderProps {
  title: string
  showBack?: boolean
  rightElement?: React.ReactNode
}

export default function Header({ title, showBack = true, rightElement }: HeaderProps) {
  const insets = useSafeAreaInsets()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <View className="bg-indigo-600 dark:bg-[#0f172a]">
      <StatusBar style="light" />
      <LinearGradient
        colors={isDark ? ['#0f172a', '#0f172a'] : ['#4f46e5', '#4338ca']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: Math.max(insets.top, 16) }}
        className="px-6 pb-6 shadow-premium-sm"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            {showBack && (
              <BackButton 
                variant="glass" 
                className="mr-3" 
              />
            )}
            <Text 
              style={{ fontFamily: 'Inter-Bold' }} 
              className="text-xl font-bold text-white flex-1 tracking-tight" 
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>
          {rightElement && (
            <View className="ml-3">
              {rightElement}
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  )
}
