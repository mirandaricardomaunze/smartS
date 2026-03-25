import { View, ViewProps, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColorScheme } from 'nativewind'

interface ScreenProps extends ViewProps {
  children: React.ReactNode
  scrollable?: boolean
  padHorizontal?: boolean
  withHeader?: boolean
  noSafeTop?: boolean
  noSafeBottom?: boolean
}

export default function Screen({ 
  children, 
  scrollable = false, 
  padHorizontal = true, 
  withHeader = false,
  noSafeTop = false,
  noSafeBottom = false,
  className, 
  ...props 
}: ScreenProps) {
  const insets = useSafeAreaInsets()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  
  // If we have a header, the header will handle the top inset
  const paddingTop = withHeader ? 0 : (noSafeTop ? 0 : insets.top)
  const paddingBottom = (noSafeBottom ? 0 : (insets.bottom > 0 ? insets.bottom : 24))

  const contentClass = `${scrollable ? '' : 'flex-1'} ${padHorizontal ? 'px-4' : ''} ${className || ''}`

  const isTransparent = className?.includes('bg-transparent')
  const screenStyle = {
    paddingTop,
    paddingBottom: scrollable ? 0 : paddingBottom,
    backgroundColor: isTransparent ? 'transparent' : (isDark ? '#0f172a' : '#f8fafc') 
  }

  return (
    <View style={screenStyle} className="flex-1">
      {scrollable ? (
        <ScrollView 
          className="flex-1" 
          contentContainerClassName={contentClass}
          contentContainerStyle={{ paddingBottom, flexGrow: 1 }}
          {...props}
        >
          {children}
        </ScrollView>
      ) : (
        <View className={contentClass} {...props}>
          {children}
        </View>
      )}
    </View>
  )
}
