import { useEffect, useRef } from 'react'
import { Animated, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { WifiOff } from 'lucide-react-native'
import { useNetworkStore } from '@/store/networkStore'

const BANNER_HEIGHT = 36

export default function OfflineBanner() {
  const isOnline = useNetworkStore(s => s.isOnline)
  const insets = useSafeAreaInsets()
  const translateY = useRef(new Animated.Value(-(BANNER_HEIGHT + insets.top))).current

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isOnline ? -(BANNER_HEIGHT + insets.top) : 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 140,
    }).start()
  }, [isOnline, insets.top])

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        transform: [{ translateY }],
        backgroundColor: '#d97706',
        paddingTop: insets.top,
        height: BANNER_HEIGHT + insets.top,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      <WifiOff size={13} color="#fff" />
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12, letterSpacing: 0.3 }}>
        Sem ligação · A trabalhar offline
      </Text>
    </Animated.View>
  )
}
